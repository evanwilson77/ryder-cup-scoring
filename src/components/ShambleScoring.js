import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { calculateStablefordPoints, calculateStrokesReceived } from '../utils/stablefordCalculations';
import { ScrambleDriveTracker } from '../utils/scrambleCalculations';
import { useAutoSave, useScoreEntry } from '../hooks';
import {
  AutoSaveIndicator,
  HoleInfo,
  ScoreCard,
  PlayerScoreEntry
} from './shared';
import './ShambleScoring.css';

function ShambleScoring() {
  const { tournamentId, roundId, teamId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHole, setCurrentHole] = useState(0);
  const [playerScores, setPlayerScores] = useState({}); // playerId -> array of holes
  const [driveSelections, setDriveSelections] = useState([]);
  const [driveTracker, setDriveTracker] = useState(null);
  const [scoringFormat, setScoringFormat] = useState('stroke'); // 'stroke' or 'stableford'

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

  const autoSaveScore = async (updatedPlayerScores, updatedDriveSelections = driveSelections) => {
    if (!team || !round || !tournament) return;

    try {
      const totalScore = calculateTotalScoreWithScores(updatedPlayerScores);

      // Determine current status based on scores
      // Check across all players to see if any holes have scores
      let holesWithScores = 0;
      const totalHoles = 18;

      for (let holeNum = 1; holeNum <= totalHoles; holeNum++) {
        // Check if at least one player has a score for this hole
        const hasScore = Object.values(updatedPlayerScores).some(playerHoles => {
          const hole = playerHoles.find(h => h.holeNumber === holeNum);
          return hole && hole.grossScore !== null && hole.grossScore !== undefined;
        });
        if (hasScore) holesWithScores++;
      }

      const allHolesComplete = holesWithScores === totalHoles;
      const status = holesWithScores === 0 ? 'not_started' : (allHolesComplete ? 'completed' : 'in_progress');

      const scorecard = {
        teamId: teamId,
        teamName: team.name,
        playerScores: updatedPlayerScores,
        driveSelections: updatedDriveSelections,
        scoringFormat: scoringFormat,
        ...totalScore,
        status: status,
        currentHole: currentHole,
        updatedAt: new Date().toISOString()
      };

      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);
      const updatedRounds = [...tournament.rounds];

      if (!updatedRounds[roundIndex].teamScorecards) {
        updatedRounds[roundIndex].teamScorecards = [];
      }

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

      await updateDoc(doc(db, 'tournaments', tournamentId), cleanedUpdate);
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  const { isSaving, save: triggerAutoSave } = useAutoSave(autoSaveScore, 1000);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, (tournamentData) => {
      setTournament(tournamentData);

      const foundRound = tournamentData.rounds?.find(r => r.id === roundId);
      setRound(foundRound);

      const foundTeam = tournamentData.teams?.find(t => t.id === teamId);
      setTeam(foundTeam);

      // Determine scoring format
      const format = foundRound?.scoringFormat || 'stroke';
      setScoringFormat(format);

      // Find existing scorecard or create new one
      const existingScorecard = foundRound?.teamScorecards?.find(sc => sc.teamId === teamId);

      if (existingScorecard && existingScorecard.playerScores) {
        setPlayerScores(existingScorecard.playerScores);
        setDriveSelections(existingScorecard.driveSelections || []);
      } else {
        // Initialize empty scores for each player
        const initialScores = {};
        foundTeam?.players?.forEach(playerId => {
          initialScores[playerId] = Array(18).fill(null).map((_, index) => ({
            holeNumber: index + 1,
            grossScore: null
          }));
        });
        setPlayerScores(initialScores);
        setDriveSelections(Array(18).fill(null));
      }

      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => {
      unsubTournament();
      unsubPlayers();
    };
  }, [tournamentId, roundId, teamId]);

  // Setup team players and drive tracker
  useEffect(() => {
    if (team && players.length > 0) {
      const foundTeamPlayers = (team.players || []).map(playerId =>
        players.find(p => p.id === playerId)
      ).filter(Boolean);
      setTeamPlayers(foundTeamPlayers);

      // Initialize drive tracker if configured
      const config = round?.shambleConfig || {};
      if (config.enforceDriveRequirements) {
        const tracker = new ScrambleDriveTracker(
          foundTeamPlayers,
          config.minDrivesPerPlayer || 3,
          18
        );

        // Restore saved drive selections
        driveSelections.forEach((selectedPlayerId) => {
          if (selectedPlayerId) {
            tracker.recordDriveUsed(selectedPlayerId);
          }
        });

        setDriveTracker(tracker);
      }
    }
  }, [team, players, round, driveSelections]);

  const handleScoreChange = (playerId, holeIndex, grossScore) => {
    const updatedScores = {
      ...playerScores,
      [playerId]: playerScores[playerId].map((hole, idx) =>
        idx === holeIndex ? { ...hole, grossScore } : hole
      )
    };
    setPlayerScores(updatedScores);

    if (grossScore !== null && grossScore !== '') {
      triggerAutoSave(updatedScores, driveSelections);
    }
  };

  const incrementScore = (playerId, holeIndex) => {
    const currentScore = playerScores[playerId]?.[holeIndex]?.grossScore;
    const newScore = increment(currentScore);
    handleScoreChange(playerId, holeIndex, newScore);
  };

  const decrementScore = (playerId, holeIndex) => {
    const currentScore = playerScores[playerId]?.[holeIndex]?.grossScore;
    const newScore = decrement(currentScore);
    handleScoreChange(playerId, holeIndex, newScore);
  };

  const handleDriveSelection = (holeIndex, playerId) => {
    const newSelections = [...driveSelections];
    newSelections[holeIndex] = playerId;
    setDriveSelections(newSelections);

    // Update drive tracker
    if (driveTracker) {
      const config = round?.shambleConfig || {};
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
    triggerAutoSave(playerScores, newSelections);
  };

  const calculateBestScoreWithScores = (holeIndex, scores) => {
    const holeData = round?.courseData?.holes?.[holeIndex];
    if (!holeData) return null;

    let bestNetScore = null;
    let bestPoints = null;
    let bestPlayer = null;

    teamPlayers.forEach(player => {
      const playerHole = scores[player.id]?.[holeIndex];
      if (!playerHole?.grossScore) return;

      const strokesReceived = calculateStrokesReceived(player.handicap || 0, holeData.strokeIndex);
      const netScore = playerHole.grossScore - strokesReceived;

      if (scoringFormat === 'stableford') {
        const points = calculateStablefordPoints(netScore, holeData.par);
        if (bestPoints === null || points > bestPoints) {
          bestPoints = points;
          bestPlayer = player.name;
        }
      } else {
        if (bestNetScore === null || netScore < bestNetScore) {
          bestNetScore = netScore;
          bestPlayer = player.name;
        }
      }
    });

    return scoringFormat === 'stableford'
      ? { points: bestPoints, player: bestPlayer }
      : { netScore: bestNetScore, player: bestPlayer };
  };

  const calculateBestScore = (holeIndex) => {
    return calculateBestScoreWithScores(holeIndex, playerScores);
  };

  const calculateTotalScoreWithScores = (scores) => {
    if (scoringFormat === 'stableford') {
      let totalPoints = 0;
      for (let i = 0; i < 18; i++) {
        const best = calculateBestScoreWithScores(i, scores);
        totalPoints += best?.points || 0;
      }
      return { totalPoints };
    } else {
      let totalGross = 0;
      let totalNet = 0;

      for (let i = 0; i < 18; i++) {
        const best = calculateBestScoreWithScores(i, scores);
        if (best?.netScore) {
          totalNet += best.netScore;
        }
      }

      // Calculate gross total (sum of best gross scores)
      for (let i = 0; i < 18; i++) {
        let bestGross = null;
        teamPlayers.forEach(player => {
          const playerHole = scores[player.id]?.[i];
          if (playerHole?.grossScore) {
            if (bestGross === null || playerHole.grossScore < bestGross) {
              bestGross = playerHole.grossScore;
            }
          }
        });
        totalGross += bestGross || 0;
      }

      return { totalGross, totalNet };
    }
  };

  const calculateTotalScore = () => {
    return calculateTotalScoreWithScores(playerScores);
  };

  const handleSubmit = async () => {
    // Validate drive requirements if enforced
    const config = round?.shambleConfig || {};
    if (config.enforceDriveRequirements && driveTracker) {
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
      const updatedRounds = [...tournament.rounds];

      const totalScore = calculateTotalScore();

      const scorecard = {
        teamId: teamId,
        teamName: team.name,
        playerScores: playerScores,
        driveSelections: driveSelections,
        scoringFormat: scoringFormat,
        ...totalScore,
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      if (!updatedRounds[roundIndex].teamScorecards) {
        updatedRounds[roundIndex].teamScorecards = [];
      }

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

      await updateDoc(doc(db, 'tournaments', tournamentId), cleanedUpdate);

      navigate(`/tournaments/${tournamentId}`);
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Failed to save score. Please try again.');
      return false;
    }
  };

  if (loading || !tournament || !round || !team) {
    return (
      <div className="shamble-scoring">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const currentDriveSelection = driveSelections[currentHole];
  const config = round?.shambleConfig || {};
  const bestScore = calculateBestScore(currentHole);
  const totalScore = calculateTotalScore();

  return (
    <div className="shamble-scoring">
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
            <h1>{team.name} - Shamble</h1>
            <p className="tournament-info">{tournament.name} - {round.name}</p>
            <div className="format-info">
              {scoringFormat === 'stableford' ? 'Shamble Stableford' : 'Shamble Stroke Play'}
              <span className="format-description"> • Best drive, then individual play</span>
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
                const needsMore = status && config.enforceDriveRequirements && !status.isCompliant && status.warning;

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
                      {driveTracker && config.enforceDriveRequirements && (
                        <span className="drive-count-badge">
                          {status.used}/{config.minDrivesPerPlayer}
                        </span>
                      )}
                    </div>
                    {currentDriveSelection === player.id && (
                      <CheckIcon className="selected-icon" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Individual Player Scores */}
          <div className="players-scoring">
            <h3>Individual Scores</h3>
            {teamPlayers.map(player => {
              const playerHole = playerScores[player.id]?.[currentHole];
              const strokesReceived = calculateStrokesReceived(player.handicap || 0, currentHoleData?.strokeIndex);
              const netScore = playerHole?.grossScore ? playerHole.grossScore - strokesReceived : null;
              const points = netScore ? calculateStablefordPoints(netScore, currentHoleData?.par) : null;

              return (
                <div key={player.id} className="player-score-section">
                  <PlayerScoreEntry
                    player={player}
                    grossScore={playerHole?.grossScore}
                    netScore={netScore}
                    points={scoringFormat === 'stableford' ? points : undefined}
                    strokesReceived={strokesReceived}
                    onIncrement={() => incrementScore(player.id, currentHole)}
                    onDecrement={() => decrementScore(player.id, currentHole)}
                    onChange={(value) => handleScoreChange(player.id, currentHole, value)}
                    showPoints={scoringFormat === 'stableford'}
                  />
                </div>
              );
            })}
          </div>

          {/* Best Score Display */}
          {bestScore && (
            <div className="best-score-display">
              <h3>Best Score for Hole</h3>
              <div className="best-score-content">
                {scoringFormat === 'stableford' ? (
                  <>
                    <div className="best-value">{bestScore.points} points</div>
                    <div className="best-player">{bestScore.player}</div>
                  </>
                ) : (
                  <>
                    <div className="best-value">Net {bestScore.netScore}</div>
                    <div className="best-player">{bestScore.player}</div>
                  </>
                )}
              </div>
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
            {scoringFormat === 'stableford' ? (
              <>
                <div className="total-item">
                  <span className="label">Total Points</span>
                  <span className="value">{totalScore.totalPoints || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Holes Completed</span>
                  <span className="value">
                    {(() => {
                      let count = 0;
                      for (let i = 0; i < 18; i++) {
                        const hasAnyScore = teamPlayers.some(player =>
                          playerScores[player.id]?.[i]?.grossScore !== null
                        );
                        if (hasAnyScore) count++;
                      }
                      return count;
                    })()} / 18
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="total-item">
                  <span className="label">Gross</span>
                  <span className="value">{totalScore.totalGross || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Net</span>
                  <span className="value">{totalScore.totalNet || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">To Par</span>
                  <span className="value">
                    {(() => {
                      const totalNet = totalScore.totalNet || 0;
                      let completedHolesPar = 0;
                      for (let i = 0; i < 18; i++) {
                        const hasAnyScore = teamPlayers.some(player =>
                          playerScores[player.id]?.[i]?.grossScore !== null
                        );
                        if (hasAnyScore && round?.courseData?.holes?.[i]) {
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
                    {(() => {
                      let count = 0;
                      for (let i = 0; i < 18; i++) {
                        const hasAnyScore = teamPlayers.some(player =>
                          playerScores[player.id]?.[i]?.grossScore !== null
                        );
                        if (hasAnyScore) count++;
                      }
                      return count;
                    })()} / 18
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scorecard */}
        <div className="card">
          <ScoreCard
            holes={round.courseData?.holes || []}
            format={scoringFormat === 'stableford' ? 'stableford' : 'individual_stroke'}
            scoringData={teamPlayers.map(player => {
              const playerHoles = playerScores[player.id] || [];
              return {
                label: `${player.name} (${(player.handicap || 0).toFixed(1)})`,
                scores: playerHoles.map((hole, idx) => {
                  if (!hole?.grossScore || !round?.courseData?.holes?.[idx]) {
                    return { grossScore: null, netScore: null, stablefordPoints: null };
                  }
                  const holeData = round.courseData.holes[idx];
                  const strokesReceived = calculateStrokesReceived(player.handicap || 0, holeData.strokeIndex);
                  const netScore = hole.grossScore - strokesReceived;
                  return {
                    grossScore: hole.grossScore,
                    netScore: netScore,
                    stablefordPoints: scoringFormat === 'stableford'
                      ? calculateStablefordPoints(netScore, holeData.par)
                      : null
                  };
                })
              };
            })}
            currentHole={currentHole + 1}
          />
        </div>

        {/* Drive Totals */}
        {config.enforceDriveRequirements && driveTracker && (
          <div className="card drive-totals-section">
            <h3>Drive Usage Summary</h3>
            <div className="drive-totals-grid">
              {teamPlayers.map(player => {
                const status = driveTracker.getPlayerStatus(player.id, 18);
                const isCompliant = status.used >= config.minDrivesPerPlayer;
                return (
                  <div key={player.id} className={`drive-total-item ${isCompliant ? 'compliant' : 'needs-more'}`}>
                    <div className="drive-total-player">
                      <span className="player-name">{player.name}</span>
                      {!isCompliant && <span className="warning-icon">⚠️</span>}
                    </div>
                    <div className="drive-total-count">
                      <span className="drives-used">{status.used}</span>
                      <span className="drives-separator">/</span>
                      <span className="drives-required">{config.minDrivesPerPlayer}</span>
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
          ✓ Submit Shamble Score
        </button>
      </div>
    </div>
  );
}

export default ShambleScoring;
