import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { calculateStablefordPoints, calculateStrokesReceived } from '../utils/stablefordCalculations';
import { useAutoSave, useScoreEntry } from '../hooks';
import {
  AutoSaveIndicator,
  HoleInfo,
  ScoreCard,
  PlayerScoreEntry
} from './shared';
import './BestBallScoring.css';

function BestBallScoring() {
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

  const autoSaveScore = async (updatedPlayerScores) => {
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
      const format = foundRound?.format === 'team_stableford' || foundRound?.scoringFormat === 'stableford'
        ? 'stableford'
        : 'stroke';
      setScoringFormat(format);

      // Find existing scorecard or create new one
      const existingScorecard = foundRound?.teamScorecards?.find(sc => sc.teamId === teamId);

      if (existingScorecard && existingScorecard.playerScores) {
        setPlayerScores(existingScorecard.playerScores);

        // Find first unscored hole
        let firstUnscoredHole = 0;
        for (let i = 0; i < 18; i++) {
          const hasScore = Object.values(existingScorecard.playerScores).some(playerHoles => {
            const hole = playerHoles.find(h => h.holeNumber === i + 1);
            return hole && hole.grossScore !== null && hole.grossScore !== undefined;
          });
          if (!hasScore) {
            firstUnscoredHole = i;
            break;
          }
        }
        setCurrentHole(firstUnscoredHole);
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
        setCurrentHole(0);
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


  // Setup team players
  useEffect(() => {
    if (team && players.length > 0) {
      const foundTeamPlayers = (team.players || []).map(playerId =>
        players.find(p => p.id === playerId)
      ).filter(Boolean);
      setTeamPlayers(foundTeamPlayers);
    }
  }, [team, players]);


  const handleScoreChange = (playerId, holeIndex, grossScore) => {
    const updatedScores = {
      ...playerScores,
      [playerId]: playerScores[playerId].map((hole, idx) =>
        idx === holeIndex ? { ...hole, grossScore } : hole
      )
    };
    setPlayerScores(updatedScores);

    if (grossScore !== null && grossScore !== '') {
      triggerAutoSave(updatedScores);
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

  const calculateBestScoreWithScores = (holeIndex, scores) => {
    const holeData = round?.courseData?.holes?.[holeIndex];
    if (!holeData) return null;

    let bestNetScore = null;
    let bestPoints = null;
    let bestPlayer = null;

    // Best Ball handicap allowance: 90% for 2-person, 85% for 4-person
    const handicapAllowance = teamPlayers.length <= 2 ? 0.90 : 0.85;

    teamPlayers.forEach(player => {
      const playerHole = scores[player.id]?.[holeIndex];
      if (!playerHole?.grossScore) return;

      // Apply handicap allowance for best ball format
      const adjustedHandicap = (player.handicap || 0) * handicapAllowance;
      const strokesReceived = calculateStrokesReceived(adjustedHandicap, holeData.strokeIndex);
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

  const calculateTotalScoreWithScores = (scores) => {
    let totalGross = 0;
    let totalNet = 0;
    let totalPoints = 0;

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

    // Calculate net and points using best ball logic
    for (let i = 0; i < 18; i++) {
      const best = calculateBestScoreWithScores(i, scores);
      if (scoringFormat === 'stableford') {
        totalPoints += best?.points || 0;
      }
      if (best?.netScore) {
        totalNet += best.netScore;
      }
    }

    return { totalGross, totalNet, totalPoints };
  };

  const calculateTotalScore = () => {
    return calculateTotalScoreWithScores(playerScores);
  };

  // Prepare scorecard data for ScoreCard component
  const getScorecardData = () => {
    const scoringData = [];

    // Best Ball handicap allowance: 90% for 2-person, 85% for 4-person
    const handicapAllowance = teamPlayers.length <= 2 ? 0.90 : 0.85;

    // Add each player's scores
    teamPlayers.forEach(player => {
      const playerHoles = playerScores[player.id] || [];
      const adjustedHandicap = (player.handicap || 0) * handicapAllowance;

      const transformedScores = playerHoles.map((hole, idx) => {
        if (!hole?.grossScore || !round?.courseData?.holes?.[idx]) return { grossScore: null };

        const holeData = round.courseData.holes[idx];
        const strokesReceived = calculateStrokesReceived(adjustedHandicap, holeData.strokeIndex);
        const netScore = hole.grossScore - strokesReceived;

        return {
          grossScore: hole.grossScore,
          netScore: netScore,
          stablefordPoints: scoringFormat === 'stableford'
            ? calculateStablefordPoints(netScore, holeData.par)
            : null
        };
      });

      scoringData.push({
        label: `${player.name} (${player.handicap?.toFixed(1)} → ${adjustedHandicap.toFixed(1)})`,
        scores: transformedScores
      });
    });

    return scoringData;
  };


  if (loading || !tournament || !round || !team) {
    return (
      <div className="best-ball-scoring">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="best-ball-scoring">
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
            <h1>{team.name} - Best Ball</h1>
            <p className="tournament-info">{tournament.name} - Round {tournament.rounds.findIndex(r => r.id === roundId) + 1}</p>
            <div className="format-info">
              Format: {scoringFormat === 'stableford' ? 'Best Ball Stableford' : 'Best Ball Stroke Play'}
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

          {/* Player Scores */}
          <div className="players-scoring">
            {teamPlayers.map(player => {
              // Best Ball handicap allowance: 90% for 2-person, 85% for 4-person
              const handicapAllowance = teamPlayers.length <= 2 ? 0.90 : 0.85;
              const adjustedHandicap = (player.handicap || 0) * handicapAllowance;

              const playerHole = playerScores[player.id]?.[currentHole];
              const strokesReceived = calculateStrokesReceived(adjustedHandicap, currentHoleData?.strokeIndex);
              const netScore = playerHole?.grossScore ? playerHole.grossScore - strokesReceived : null;
              const points = netScore ? calculateStablefordPoints(netScore, currentHoleData?.par) : null;

              return (
                <PlayerScoreEntry
                  key={player.id}
                  player={player}
                  grossScore={playerHole?.grossScore}
                  strokesReceived={strokesReceived}
                  netScore={netScore}
                  points={points}
                  onChange={(value) => handleScoreChange(player.id, currentHole, value === '' ? null : parseInt(value))}
                  onIncrement={() => incrementScore(player.id, currentHole)}
                  onDecrement={() => decrementScore(player.id, currentHole)}
                  format={scoringFormat}
                />
              );
            })}
          </div>

          {/* Navigation Buttons */}
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

          {/* Scores */}
          <div className="total-scores">
            {scoringFormat === 'stableford' ? (
              <>
                <div className="total-item">
                  <span className="label">Total Points</span>
                  <span className="value">{calculateTotalScore().totalPoints || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Holes Completed</span>
                  <span className="value">{(() => {
                    let count = 0;
                    for (let i = 0; i < 18; i++) {
                      const hasAnyScore = teamPlayers.some(player =>
                        playerScores[player.id]?.[i]?.grossScore !== null
                      );
                      if (hasAnyScore) count++;
                    }
                    return count;
                  })()} / 18</span>
                </div>
              </>
            ) : (
              <>
                <div className="total-item">
                  <span className="label">Gross</span>
                  <span className="value">{calculateTotalScore().totalGross || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Net</span>
                  <span className="value">{calculateTotalScore().totalNet || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">To Par</span>
                  <span className="value">
                    {(() => {
                      const totalNet = calculateTotalScore().totalNet || 0;
                      // Calculate par only for completed holes
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
              </>
            )}
          </div>

          {/* Complete Round Button */}
          {(() => {
            // Check if all holes have at least one score from any player
            const allHolesScored = Array.from({ length: 18 }).every((_, i) =>
              teamPlayers.some(player => playerScores[player.id]?.[i]?.grossScore !== null)
            );

            // Check if scorecard is already completed
            const existingScorecard = round?.teamScorecards?.find(sc => sc.teamId === teamId);
            const isCompleted = existingScorecard?.status === 'completed';

            if (allHolesScored && !isCompleted) {
              return (
                <button
                  className="complete-round-button button primary"
                  onClick={async () => {
                    if (window.confirm('Mark this round as complete? You can still edit scores later if needed.')) {
                      const totalScore = calculateTotalScoreWithScores(playerScores);
                      const scorecard = {
                        teamId: teamId,
                        teamName: team.name,
                        playerScores: playerScores,
                        ...totalScore,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
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

                      // Check if all team scorecards are completed
                      const allTeamScorecards = updatedRounds[roundIndex].teamScorecards || [];
                      const allCompleted = tournament.teams?.every(team => {
                        const teamScorecard = allTeamScorecards.find(sc => sc.teamId === team.id);
                        return teamScorecard?.status === 'completed';
                      });

                      // If all scorecards are completed, mark the round as completed
                      if (allCompleted) {
                        updatedRounds[roundIndex].status = 'completed';
                        updatedRounds[roundIndex].completedAt = new Date().toISOString();
                      }

                      await updateDoc(doc(db, 'tournaments', tournamentId), {
                        rounds: updatedRounds
                      });

                      alert('Round completed successfully!');
                      navigate(`/tournaments/${tournamentId}`);
                    }
                  }}
                >
                  ✓ Complete Round
                </button>
              );
            } else if (isCompleted) {
              return (
                <div className="completed-badge">
                  ✓ Round Completed
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Scorecard - Full 18 holes view with traditional golf symbols */}
        <div className="card">
          <ScoreCard
            holes={round?.courseData?.holes || []}
            scoringData={getScorecardData()}
            format={scoringFormat === 'stableford' ? 'stableford' : 'individual_stroke'}
            currentHole={currentHole + 1}
          />
        </div>
      </div>
    </div>
  );
}

export default BestBallScoring;
