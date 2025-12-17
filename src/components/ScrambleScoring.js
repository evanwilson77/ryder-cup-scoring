import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  calculateScrambleTeamHandicap,
  calculateTeamStrokesReceived,
  ScrambleDriveTracker
} from '../utils/scrambleCalculations';
import { useAutoSave, useScoreEntry, useTournamentRound } from '../hooks';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useToast } from './Toast';
import {
  AutoSaveIndicator,
  HoleInfo,
  ScoreCard,
  ScoreEntry
} from './shared';
import './ScrambleScoring.css';

function ScrambleScoring() {
  const { tournamentId, roundId, teamId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { tournament, round, loading: tournamentLoading } = useTournamentRound(tournamentId, roundId);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState([]);
  const [driveSelections, setDriveSelections] = useState([]);
  const [driveTracker, setDriveTracker] = useState(null);
  const [teamHandicap, setTeamHandicap] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Custom hooks
  const currentHoleData = round?.courseData?.holes?.[currentHole];
  const { increment, decrement } = useScoreEntry(currentHoleData?.par || 4);

  // Helper to remove undefined values (Firebase doesn't accept them)
  const cleanUndefined = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => cleanUndefined(item));
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefined(obj[key]);
        }
      });
      return cleaned;
    }
    return obj;
  };

  const autoSaveScore = async (updatedScores, updatedDriveSelections = driveSelections) => {
    if (!team || !round || !tournament) return;

    try {
      const totalScore = calculateTotalScoreWithScores(updatedScores);

      // Determine current status based on scores
      const holesWithScores = updatedScores.filter(h => h.grossScore !== null && h.grossScore !== undefined).length;
      const allHolesComplete = holesWithScores === updatedScores.length;
      const status = holesWithScores === 0 ? 'not_started' : (allHolesComplete ? 'completed' : 'in_progress');

      // Clean the scorecard before saving to prevent undefined values
      const scorecard = cleanUndefined({
        teamId: teamId,
        teamName: team.name,
        holes: updatedScores,
        driveSelections: updatedDriveSelections,
        totalGross: totalScore.gross,
        totalNet: totalScore.net,
        teamHandicap: teamHandicap,
        status: status,
        currentHole: currentHole,
        updatedAt: new Date().toISOString()
      });

      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);

      // Deep clone the rounds array to avoid undefined values from original data
      const updatedRounds = tournament.rounds.map((r, idx) => {
        if (idx === roundIndex) {
          // Create a clean copy of the current round
          return {
            ...r,
            teamScorecards: r.teamScorecards ? [...r.teamScorecards] : []
          };
        }
        return r;
      });

      const existingIndex = updatedRounds[roundIndex].teamScorecards.findIndex(
        sc => sc.teamId === teamId
      );

      if (existingIndex >= 0) {
        updatedRounds[roundIndex].teamScorecards[existingIndex] = scorecard;
      } else {
        updatedRounds[roundIndex].teamScorecards.push(scorecard);
      }

      // CRITICAL: Update round status based on all scorecards
      const roundScorecards = updatedRounds[roundIndex].teamScorecards;
      const allNotStarted = roundScorecards.every(sc => sc.status === 'not_started');
      const allCompleted = roundScorecards.every(sc => sc.status === 'completed');

      if (allCompleted) {
        updatedRounds[roundIndex].status = 'completed';
      } else if (allNotStarted) {
        updatedRounds[roundIndex].status = 'not_started';
      } else {
        updatedRounds[roundIndex].status = 'in_progress';
      }

      // CRITICAL: Update tournament status based on all rounds
      const allRoundsNotStarted = updatedRounds.filter(r => !r.deleted).every(r =>
        r.status === 'not_started' || r.status === 'setup'
      );
      const allRoundsCompleted = updatedRounds.filter(r => !r.deleted).every(r =>
        r.status === 'completed'
      );

      let tournamentStatus;
      if (allRoundsCompleted) {
        tournamentStatus = 'completed';
      } else if (allRoundsNotStarted) {
        tournamentStatus = 'setup';
      } else {
        tournamentStatus = 'in_progress';
      }

      // Clean undefined values before saving to Firebase
      const cleanedUpdate = cleanUndefined({
        rounds: updatedRounds,
        status: tournamentStatus,
        updatedAt: new Date().toISOString()
      });

      // Final safety check: Convert any remaining undefined to null
      const safeUpdate = JSON.parse(JSON.stringify(cleanedUpdate, (key, value) => {
        if (value === undefined) {
          console.warn(`Converting undefined to null at key: ${key}`);
          return null;
        }
        return value;
      }));

      await updateDoc(doc(db, 'tournaments', tournamentId), safeUpdate);
    } catch (error) {
      console.error('Error auto-saving:', error);
      toast.error('Failed to save changes');
    }
  };

  const { isSaving, save: triggerAutoSave } = useAutoSave(autoSaveScore, 1000);

  // Load team and scorecard data when tournament changes
  useEffect(() => {
    if (!tournament || !round) return;

    // Find the team
    const foundTeam = tournament.teams?.find(t => t.id === teamId);
    setTeam(foundTeam);

    // Find existing scorecard or create new one
    const existingScorecard = round.teamScorecards?.find(sc => sc.teamId === teamId);
    if (existingScorecard) {
      setScores(existingScorecard.holes || []);
      setDriveSelections(existingScorecard.driveSelections || []);

      // Only auto-jump to first unscored hole on initial load, not after every autosave
      if (!initialLoadDone) {
        // Find first unscored hole
        const holes = existingScorecard.holes || [];
        let firstUnscoredHole = 0;
        for (let i = 0; i < 18; i++) {
          const hole = holes.find(h => h.holeNumber === i + 1);
          if (!hole || hole.grossScore === null || hole.grossScore === undefined) {
            firstUnscoredHole = i;
            break;
          }
        }
        setCurrentHole(firstUnscoredHole);
        setInitialLoadDone(true);
      }
    } else {
      // Initialize empty scores
      const initialScores = Array(18).fill(null).map((_, index) => ({
        holeNumber: index + 1,
        grossScore: null
      }));
      setScores(initialScores);
      setDriveSelections(Array(18).fill(null));
      if (!initialLoadDone) {
        setCurrentHole(0);
        setInitialLoadDone(true);
      }
    }
  }, [tournament, round, teamId, initialLoadDone]);

  // Subscribe to players
  useEffect(() => {
    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => unsubPlayers();
  }, []);

  // Setup team players and handicap calculation
  useEffect(() => {
    if (team && players.length > 0) {
      const foundTeamPlayers = (team.players || []).map(playerId =>
        players.find(p => p.id === playerId)
      ).filter(Boolean);

      setTeamPlayers(foundTeamPlayers);

      // Calculate team handicap
      const handicaps = foundTeamPlayers.map(p => p.handicap || 0);
      const config = round?.scrambleConfig || {};
      const calculatedHandicap = calculateScrambleTeamHandicap(
        handicaps,
        config.handicapMethod || 'usga',
        config.customPercentages
      );
      setTeamHandicap(calculatedHandicap);

      // Initialize drive tracker (always required for Scramble format)
      const minDrivesRequired = config.minDrivesPerPlayer || 3;
      const tracker = new ScrambleDriveTracker(
        foundTeamPlayers,
        minDrivesRequired,
        18
      );

      // Restore saved drive selections
      driveSelections.forEach((selectedPlayerId, index) => {
        if (selectedPlayerId) {
          tracker.recordDriveUsed(selectedPlayerId);
        }
      });

      setDriveTracker(tracker);
    }
  }, [team, players, round, driveSelections]);

  const handleScoreChange = useCallback((holeIndex, grossScore) => {
    const newScores = [...scores];
    newScores[holeIndex] = {
      ...newScores[holeIndex],
      grossScore: grossScore
    };
    setScores(newScores);

    if (grossScore !== null && grossScore !== '') {
      triggerAutoSave(newScores, driveSelections);
    }
  }, [scores, driveSelections, triggerAutoSave]);

  const incrementScore = useCallback(() => {
    const currentScore = scores[currentHole]?.grossScore;
    const newScore = increment(currentScore);
    handleScoreChange(currentHole, newScore);
  }, [scores, currentHole, increment, handleScoreChange]);

  const decrementScore = useCallback(() => {
    const currentScore = scores[currentHole]?.grossScore;
    const newScore = decrement(currentScore);
    handleScoreChange(currentHole, newScore);
  }, [scores, currentHole, decrement, handleScoreChange]);

  const handleDriveSelection = useCallback((holeIndex, playerId) => {
    const newSelections = [...driveSelections];
    newSelections[holeIndex] = playerId;
    setDriveSelections(newSelections);

    // Update drive tracker
    if (driveTracker) {
      // Create new tracker and recalculate from scratch
      const config = round?.scrambleConfig || {};
      const newTracker = new ScrambleDriveTracker(
        teamPlayers,
        config.minDrivesPerPlayer || 3,
        18
      );

      newSelections.forEach((selectedPlayerId) => {
        if (selectedPlayerId) {
          newTracker.recordDriveUsed(selectedPlayerId);
        }
      });

      setDriveTracker(newTracker);
    }

    // Auto-save drive selection
    triggerAutoSave(scores, newSelections);
  }, [driveSelections, driveTracker, round?.scrambleConfig, teamPlayers, scores, triggerAutoSave]);

  // Swipe gesture handlers for hole navigation
  const handleSwipeLeft = useCallback(() => {
    if (currentHole < 17) {
      setCurrentHole(currentHole + 1);
    }
  }, [currentHole]);

  const handleSwipeRight = useCallback(() => {
    if (currentHole > 0) {
      setCurrentHole(currentHole - 1);
    }
  }, [currentHole]);

  const swipeHandlers = useSwipeGestures(handleSwipeLeft, handleSwipeRight);

  const calculateNetScore = (grossScore, holeStrokeIndex) => {
    if (!grossScore) return null;
    const strokesReceived = calculateTeamStrokesReceived(teamHandicap, holeStrokeIndex);
    return grossScore - strokesReceived;
  };

  const calculateTotalScoreWithScores = (scoreData) => {
    const gross = scoreData.reduce((sum, hole) => sum + (hole.grossScore || 0), 0);
    const net = scoreData.reduce((sum, hole, index) => {
      if (!hole.grossScore) return sum;
      const holeData = round?.courseData?.holes?.[index];
      if (!holeData) return sum;
      const netScore = calculateNetScore(hole.grossScore, holeData.strokeIndex);
      return sum + (netScore || 0);
    }, 0);

    return { gross, net };
  };

  const calculateTotalScore = () => {
    return calculateTotalScoreWithScores(scores);
  };

  const handleSubmit = async () => {
    // Validate drive requirements (always required for Scramble format)
    if (driveTracker) {
      const validation = driveTracker.validate();
      if (!validation.isValid) {
        const message = validation.violations.map(v =>
          `${v.playerName}: ${v.used}/${v.required} drives (${v.missing} missing)`
        ).join('\n');

        if (!window.confirm(`Drive requirements not met:\n\n${message}\n\nSubmit anyway?`)) {
          return false;
        }
      }
    }

    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);

      const totalScore = calculateTotalScore();

      // Clean the scorecard before saving to prevent undefined values
      const scorecard = cleanUndefined({
        teamId: teamId,
        teamName: team.name,
        holes: scores,
        driveSelections: driveSelections,
        totalGross: totalScore.gross,
        totalNet: totalScore.net,
        teamHandicap: teamHandicap,
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Deep clone the rounds array to avoid undefined values from original data
      const updatedRounds = tournament.rounds.map((r, idx) => {
        if (idx === roundIndex) {
          // Create a clean copy of the current round
          return {
            ...r,
            teamScorecards: r.teamScorecards ? [...r.teamScorecards] : []
          };
        }
        return r;
      });

      const existingIndex = updatedRounds[roundIndex].teamScorecards.findIndex(
        sc => sc.teamId === teamId
      );

      if (existingIndex >= 0) {
        updatedRounds[roundIndex].teamScorecards[existingIndex] = scorecard;
      } else {
        updatedRounds[roundIndex].teamScorecards.push(scorecard);
      }

      // CRITICAL: Update round status based on all scorecards
      const roundScorecards = updatedRounds[roundIndex].teamScorecards;
      const allNotStarted = roundScorecards.every(sc => sc.status === 'not_started');
      const allCompleted = roundScorecards.every(sc => sc.status === 'completed');

      if (allCompleted) {
        updatedRounds[roundIndex].status = 'completed';
        updatedRounds[roundIndex].completedAt = new Date().toISOString();
      } else if (allNotStarted) {
        updatedRounds[roundIndex].status = 'not_started';
      } else {
        updatedRounds[roundIndex].status = 'in_progress';
      }

      // CRITICAL: Update tournament status based on all rounds
      const allRoundsNotStarted = updatedRounds.filter(r => !r.deleted).every(r =>
        r.status === 'not_started' || r.status === 'setup'
      );
      const allRoundsCompleted = updatedRounds.filter(r => !r.deleted).every(r =>
        r.status === 'completed'
      );

      let tournamentStatus;
      if (allRoundsCompleted) {
        tournamentStatus = 'completed';
      } else if (allRoundsNotStarted) {
        tournamentStatus = 'setup';
      } else {
        tournamentStatus = 'in_progress';
      }

      // Clean undefined values before saving to Firebase
      const cleanedUpdate = cleanUndefined({
        rounds: updatedRounds,
        status: tournamentStatus,
        updatedAt: new Date().toISOString()
      });

      // Final safety check: Convert any remaining undefined to null
      const safeUpdate = JSON.parse(JSON.stringify(cleanedUpdate, (key, value) => {
        if (value === undefined) {
          console.warn(`Converting undefined to null at key: ${key}`);
          return null;
        }
        return value;
      }));

      await updateDoc(doc(db, 'tournaments', tournamentId), safeUpdate);

      toast.success('Scramble scorecard submitted successfully!');
      navigate(`/tournaments/${tournamentId}`);
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error('Failed to submit scorecard. Please try again.');
      return false;
    }
  };

  // Memoize expensive calculations (must be before early returns)
  const currentScore = scores[currentHole];
  const currentNetScore = useMemo(
    () => {
      if (!currentScore?.grossScore || !currentHoleData?.strokeIndex) return null;
      return calculateNetScore(currentScore.grossScore, currentHoleData.strokeIndex);
    },
    [currentScore?.grossScore, currentHoleData?.strokeIndex, teamHandicap]
  );

  const totalScore = useMemo(
    () => {
      if (!round?.courseData?.holes) return { gross: 0, net: 0 };
      return calculateTotalScore();
    },
    [scores, round?.courseData?.holes, teamHandicap]
  );

  if (tournamentLoading || !tournament || !round || !team) {
    return (
      <div className="scramble-scoring">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const currentDriveSelection = driveSelections[currentHole];
  const config = round?.scrambleConfig || {};

  return (
    <div className="scramble-scoring" {...swipeHandlers}>
      <div className="scoring-container">
        {/* Header */}
        <div className="scoring-header">
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="button secondary small back-button"
          >
            <ArrowLeftIcon className="icon" />
            Back
          </button>

          <div className="header-info">
            <h1>{team.name} - Scramble</h1>
            <p className="tournament-info">{tournament.name} - {round.name}</p>
            <div className="format-info">
              Scramble • Team Handicap: {teamHandicap}
            </div>
          </div>

          <AutoSaveIndicator isSaving={isSaving} />
        </div>

        {/* Current Hole */}
        <div className="current-hole-section card">
          <HoleInfo
            holeNumber={currentHole + 1}
            par={currentHoleData?.par}
            strokeIndex={currentHoleData?.strokeIndex}
            yardage={currentHoleData?.yardage}
            name={currentHoleData?.name}
          />

          {/* Drive Selection */}
          <div className="drive-selection-section">
            <h3>Select Best Drive</h3>
            <div className="drive-options">
              {teamPlayers.map(player => {
                const status = driveTracker?.getPlayerStatus(player.id, currentHole + 1);
                const needsMore = status && !status.isCompliant && status.warning;
                const minDrives = config.minDrivesPerPlayer || 3;

                return (
                  <label
                    key={player.id}
                    className={`drive-option ${currentDriveSelection === player.id ? 'selected' : ''} ${needsMore ? 'needs-drive' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`drive-hole-${currentHole}`}
                      value={player.id}
                      checked={currentDriveSelection === player.id}
                      onChange={() => handleDriveSelection(currentHole, player.id)}
                    />
                    <div className="drive-option-content">
                      <span className="player-name">{player.name}</span>
                      {needsMore && <span className="warning-badge">⚠️ Needs drives</span>}
                      <span className="drive-count-badge">
                        {status?.used || 0}/{minDrives}
                      </span>
                    </div>
                    {currentDriveSelection === player.id && (
                      <CheckIcon className="selected-icon" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Score Entry */}
          <ScoreEntry
            value={currentScore?.grossScore || ''}
            onChange={(value) => handleScoreChange(currentHole, value)}
            onIncrement={incrementScore}
            onDecrement={decrementScore}
            label="Gross Score"
            min={1}
            max={15}
          />

          {/* Net Score Display */}
          {teamHandicap > 0 && currentScore?.grossScore && (
            <div className="net-score-display">
              <span className="net-score-label">Net Score:</span>
              <span className="net-score-value">{currentNetScore}</span>
            </div>
          )}

          {/* Hole Navigation Buttons */}
          <div className="hole-navigation-buttons">
            <button
              onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
              disabled={currentHole === 0}
              className="nav-btn secondary"
            >
              ← Previous Hole
            </button>
            <button
              onClick={() => setCurrentHole(Math.min(17, currentHole + 1))}
              disabled={currentHole === 17}
              className="nav-btn secondary"
            >
              Next Hole →
            </button>
          </div>
        </div>

        {/* Round Totals */}
        <div className="total-score-section card">
          <h3>Round Totals</h3>
          <div className="total-scores">
            <div className="total-item">
              <span className="label">Gross</span>
              <span className="value">{totalScore.gross || 0}</span>
            </div>
            <div className="total-item">
              <span className="label">Net</span>
              <span className="value">{totalScore.net || 0}</span>
            </div>
            <div className="total-item">
              <span className="label">To Par</span>
              <span className="value">
                {(() => {
                  const totalNet = totalScore.net || 0;
                  let completedHolesPar = 0;
                  for (let i = 0; i < 18; i++) {
                    if (scores[i]?.grossScore !== null && round?.courseData?.holes?.[i]) {
                      completedHolesPar += round.courseData.holes[i].par;
                    }
                  }
                  const toPar = totalNet - completedHolesPar;
                  return toPar === 0 ? 'E' : (toPar > 0 ? `+${toPar}` : toPar);
                })()}
              </span>
            </div>
            <div className="total-item">
              <span className="label">Holes Completed</span>
              <span className="value">
                {scores.filter(h => h?.grossScore !== null).length} / 18
              </span>
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div className="card">
          <ScoreCard
            holes={round.courseData?.holes || []}
            format="individual_stroke"
            scoringData={[{
              label: team.name,
              scores: scores.map((hole, idx) => {
                const holeData = round?.courseData?.holes?.[idx];
                const netScore = hole?.grossScore ? calculateNetScore(hole.grossScore, holeData?.strokeIndex) : null;
                return {
                  grossScore: hole?.grossScore || null,
                  netScore: netScore
                };
              })
            }]}
            currentHole={currentHole + 1}
          />
        </div>

        {/* Drive Totals */}
        {driveTracker && (
          <div className="card drive-totals-section">
            <h3>Drive Usage Summary</h3>
            <div className="drive-totals-grid">
              {teamPlayers.map(player => {
                const status = driveTracker.getPlayerStatus(player.id, 18);
                const minDrives = config.minDrivesPerPlayer || 3;
                const isCompliant = status.used >= minDrives;
                return (
                  <div key={player.id} className={`drive-total-item ${isCompliant ? 'compliant' : 'needs-more'}`}>
                    <div className="drive-total-player">
                      <span className="player-name">{player.name}</span>
                      {!isCompliant && <span className="warning-icon">⚠️</span>}
                    </div>
                    <div className="drive-total-count">
                      <span className="drives-used">{status.used}</span>
                      <span className="drives-separator">/</span>
                      <span className="drives-required">{minDrives}</span>
                      <span className="drives-label">drives</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const validation = driveTracker.validate();
              if (!validation.isValid) {
                return (
                  <div className="drive-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>Some players have not met the minimum drive requirement</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Submit Button */}
        <button
          className="button primary large submit-button"
          onClick={handleSubmit}
        >
          ✓ Submit Scramble Score
        </button>
      </div>
    </div>
  );
}

export default ScrambleScoring;
