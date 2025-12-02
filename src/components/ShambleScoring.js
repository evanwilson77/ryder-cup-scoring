import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { calculateStablefordPoints, calculateStrokesReceived } from '../utils/stablefordCalculations';
import { ScrambleDriveTracker } from '../utils/scrambleCalculations';
import {
  QuickScoreButtons,
  HoleNavigationGrid
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
  const [saving, setSaving] = useState(false);
  const [currentHole, setCurrentHole] = useState(0);
  const [playerScores, setPlayerScores] = useState({}); // playerId -> array of holes
  const [driveSelections, setDriveSelections] = useState([]);
  const [driveTracker, setDriveTracker] = useState(null);
  const [scoringFormat, setScoringFormat] = useState('stroke'); // 'stroke' or 'stableford'

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
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: prev[playerId].map((hole, idx) =>
        idx === holeIndex ? { ...hole, grossScore } : hole
      )
    }));
  };

  const handleQuickScore = (playerId, holeIndex, grossScore) => {
    handleScoreChange(playerId, holeIndex, grossScore);
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
  };

  const calculateBestScore = (holeIndex) => {
    const holeData = round?.courseData?.holes?.[holeIndex];
    if (!holeData) return null;

    let bestNetScore = null;
    let bestPoints = null;
    let bestPlayer = null;

    teamPlayers.forEach(player => {
      const playerHole = playerScores[player.id]?.[holeIndex];
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

  const calculateTotalScore = () => {
    if (scoringFormat === 'stableford') {
      let totalPoints = 0;
      for (let i = 0; i < 18; i++) {
        const best = calculateBestScore(i);
        totalPoints += best?.points || 0;
      }
      return { totalPoints };
    } else {
      let totalGross = 0;
      let totalNet = 0;

      for (let i = 0; i < 18; i++) {
        const best = calculateBestScore(i);
        if (best?.netScore) {
          totalNet += best.netScore;
        }
      }

      // Calculate gross total (sum of best gross scores)
      for (let i = 0; i < 18; i++) {
        let bestGross = null;
        teamPlayers.forEach(player => {
          const playerHole = playerScores[player.id]?.[i];
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

  const handleSaveScore = async () => {
    setSaving(true);

    try {
      // Validate drive requirements if enforced
      const config = round?.shambleConfig || {};
      if (config.enforceDriveRequirements && driveTracker) {
        const validation = driveTracker.validate();
        if (!validation.isValid) {
          const message = validation.violations.map(v =>
            `${v.playerName}: ${v.used}/${v.required} drives (${v.missing} missing)`
          ).join('\n');

          if (!window.confirm(`Drive requirements not met:\n\n${message}\n\nSave anyway?`)) {
            setSaving(false);
            return;
          }
        }
      }

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

      await updateDoc(doc(db, 'tournaments', tournamentId), {
        rounds: updatedRounds
      });

      alert('Score saved successfully!');
      navigate(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Failed to save score. Please try again.');
    } finally {
      setSaving(false);
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

  const currentHoleData = round.courseData?.holes?.[currentHole];
  const currentDriveSelection = driveSelections[currentHole];
  const config = round?.shambleConfig || {};
  const bestScore = calculateBestScore(currentHole);

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
            <p className="tournament-info">{tournament.name} - Round {tournament.rounds.findIndex(r => r.id === roundId) + 1}</p>
            <div className="format-info">
              Format: {scoringFormat === 'stableford' ? 'Shamble Stableford' : 'Shamble Stroke Play'}
              <p className="format-description">Best drive, then individual play</p>
            </div>
          </div>

          <button
            onClick={handleSaveScore}
            className="button primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Score'}
          </button>
        </div>

        {/* Current Hole */}
        <div className="current-hole-section">
          <div className="hole-header">
            <h2>Hole {currentHole + 1}</h2>
            <div className="hole-details">
              <span className="hole-par">Par {currentHoleData?.par}</span>
              <span className="hole-si">SI {currentHoleData?.strokeIndex}</span>
            </div>
          </div>

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

          {/* Individual Scores */}
          <div className="players-scoring">
            <h3>Individual Scores</h3>
            {teamPlayers.map(player => {
              const playerHole = playerScores[player.id]?.[currentHole];
              const strokesReceived = calculateStrokesReceived(player.handicap || 0, currentHoleData?.strokeIndex);
              const netScore = playerHole?.grossScore ? playerHole.grossScore - strokesReceived : null;
              const points = netScore ? calculateStablefordPoints(netScore, currentHoleData?.par) : null;

              return (
                <div key={player.id} className="player-score-section">
                  <div className="player-header">
                    <span className="player-name">{player.name}</span>
                    <span className="player-handicap">HCP {player.handicap?.toFixed(1)}</span>
                    {strokesReceived > 0 && (
                      <span className="strokes-badge">{strokesReceived} stroke{strokesReceived > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  <QuickScoreButtons
                    onSelect={(score) => handleQuickScore(player.id, currentHole, score)}
                    selectedScore={playerHole?.grossScore}
                    min={1}
                    max={10}
                  />

                  {playerHole?.grossScore && (
                    <div className="player-score-summary">
                      <span>Gross: {playerHole.grossScore}</span>
                      <span>Net: {netScore}</span>
                      {scoringFormat === 'stableford' && <span>Points: {points}</span>}
                    </div>
                  )}
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
        </div>

        {/* Hole Navigation */}
        <HoleNavigationGrid
          currentHole={currentHole}
          onHoleSelect={setCurrentHole}
          completedHoles={Array.from({ length: 18 }, (_, i) => {
            const allScored = teamPlayers.every(player =>
              playerScores[player.id]?.[i]?.grossScore !== null
            );
            const driveSelected = driveSelections[i] !== null;
            return allScored && driveSelected;
          })}
          title="Holes"
        />

        {/* Total Score */}
        <div className="total-score-section">
          <h3>Team Total</h3>
          <div className="total-scores">
            {scoringFormat === 'stableford' ? (
              <div className="total-item">
                <span className="label">Total Points:</span>
                <span className="value">{calculateTotalScore().totalPoints || 0}</span>
              </div>
            ) : (
              <>
                <div className="total-item">
                  <span className="label">Gross:</span>
                  <span className="value">{calculateTotalScore().totalGross || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Net:</span>
                  <span className="value">{calculateTotalScore().totalNet || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShambleScoring;
