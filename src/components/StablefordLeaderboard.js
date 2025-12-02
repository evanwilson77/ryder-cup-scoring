import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToPlayers } from '../firebase/services';
import { subscribeToTournaments } from '../firebase/tournamentServices';
import { TrophyIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatScoreToPar } from '../utils/stablefordCalculations';
import './StablefordLeaderboard.css';

function StablefordLeaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTournaments = subscribeToTournaments((tournamentsData) => {
      // Filter for stableford tournaments (check if any round has stableford format)
      const stablefordTournaments = tournamentsData.filter(t =>
        t.rounds?.some(r =>
          r.format === 'individual_stableford' || r.format === 'team_stableford'
        )
      );
      setTournaments(stablefordTournaments);

      // Auto-select oldest in-progress stableford tournament
      if (!selectedTournament && stablefordTournaments.length > 0) {
        const openTournaments = stablefordTournaments.filter(t =>
          t.status === 'in_progress' || t.status === 'setup'
        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        if (openTournaments.length > 0) {
          setSelectedTournament(openTournaments[0]);
        } else {
          // If no open tournaments, show most recent
          const sortedByDate = [...stablefordTournaments].sort((a, b) =>
            new Date(b.startDate) - new Date(a.startDate)
          );
          if (sortedByDate.length > 0) {
            setSelectedTournament(sortedByDate[0]);
          }
        }
      }
    });

    return () => {
      unsubPlayers();
      unsubTournaments();
    };
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedTournament && players.length > 0) {
      calculateLeaderboard();
    }
  }, [selectedTournament, players]);

  const calculateLeaderboard = () => {
    const playerScores = new Map();

    // Collect all scorecards from all rounds
    selectedTournament.rounds?.forEach(round => {
      round.scorecards?.forEach(scorecard => {
        if (!playerScores.has(scorecard.playerId)) {
          playerScores.set(scorecard.playerId, {
            playerId: scorecard.playerId,
            rounds: [],
            totalPoints: 0,
            totalGross: 0,
            totalNet: 0,
            roundsCompleted: 0,
            roundsStarted: 0,
            bestRound: null
          });
        }

        const playerData = playerScores.get(scorecard.playerId);
        const isCompleted = scorecard.status === 'completed';
        const isStarted = scorecard.holesCompleted > 0;

        playerData.rounds.push({
          roundId: round.id,
          roundName: round.name,
          points: scorecard.totalPoints || 0,
          gross: scorecard.totalGross || 0,
          net: scorecard.totalNet || 0,
          holesCompleted: scorecard.holesCompleted || 0,
          status: scorecard.status,
          coursePar: round.courseData?.totalPar || 72
        });

        if (isStarted) {
          playerData.roundsStarted++;
          playerData.totalPoints += scorecard.totalPoints || 0;
          playerData.totalGross += scorecard.totalGross || 0;
          playerData.totalNet += scorecard.totalNet || 0;
        }

        if (isCompleted) {
          playerData.roundsCompleted++;

          // Track best round
          if (!playerData.bestRound || (scorecard.totalPoints || 0) > playerData.bestRound.points) {
            playerData.bestRound = {
              points: scorecard.totalPoints || 0,
              roundName: round.name
            };
          }
        }
      });
    });

    // Convert to array and enrich with player data
    const leaderboardArray = Array.from(playerScores.values()).map(data => {
      const player = players.find(p => p.id === data.playerId);
      return {
        ...data,
        playerName: player?.name || 'Unknown',
        playerHandicap: player?.handicap || 0,
        avgPoints: data.roundsCompleted > 0 ? (data.totalPoints / data.roundsCompleted).toFixed(1) : 0
      };
    });

    // Sort by total points descending
    leaderboardArray.sort((a, b) => b.totalPoints - a.totalPoints);

    // Add position with tie handling
    let currentPosition = 1;
    leaderboardArray.forEach((entry, index) => {
      if (index > 0 && entry.totalPoints === leaderboardArray[index - 1].totalPoints) {
        entry.position = leaderboardArray[index - 1].position;
      } else {
        entry.position = currentPosition;
      }
      currentPosition++;
    });

    setLeaderboardData(leaderboardArray);
  };

  const getPositionBadge = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position;
  };

  const getStatusColor = (roundsStarted, totalRounds) => {
    if (roundsStarted === 0) return '#94a3b8';
    if (roundsStarted < totalRounds) return '#f59e0b';
    return '#10b981';
  };

  const openTournaments = tournaments.filter(t =>
    t.status === 'in_progress' || t.status === 'setup'
  );

  if (!selectedTournament) {
    return (
      <div className="stableford-leaderboard">
        <div className="card">
          <div className="empty-state">
            <TrophyIcon className="empty-icon" />
            <h2>No Stableford Tournaments Found</h2>
            <p>Create a Stableford tournament to see the leaderboard</p>
            <button onClick={() => navigate('/tournaments/create')} className="button primary">
              Create Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRounds = selectedTournament.rounds?.length || 0;
  const targetPoints = 36 * totalRounds; // 36 points per round = playing to handicap

  return (
    <div className="stableford-leaderboard">
      {/* Tournament Selector */}
      {tournaments.length > 1 && (
        <div className="card tournament-selector">
          <label htmlFor="tournament-select">Viewing Tournament:</label>
          <select
            id="tournament-select"
            value={selectedTournament.id}
            onChange={(e) => {
              const tournament = tournaments.find(t => t.id === e.target.value);
              setSelectedTournament(tournament);
            }}
            className="tournament-select"
          >
            <optgroup label="Open Tournaments">
              {openTournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.edition ? `(${t.edition})` : ''} - {t.status === 'in_progress' ? 'In Progress' : 'Setup'}
                </option>
              ))}
            </optgroup>
            {tournaments.filter(t => t.status === 'completed').length > 0 && (
              <optgroup label="Completed Tournaments">
                {tournaments.filter(t => t.status === 'completed').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.edition ? `(${t.edition})` : ''} - Completed
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            onClick={() => navigate(`/tournaments/${selectedTournament.id}`)}
            className="button secondary small"
          >
            Manage Tournament
          </button>
        </div>
      )}

      {/* Tournament Header */}
      <div className="card tournament-header">
        <div className="header-content">
          <div className="tournament-info">
            <h1>{selectedTournament.name}</h1>
            {selectedTournament.edition && (
              <div className="tournament-edition">{selectedTournament.edition}</div>
            )}
            <p className="tournament-dates">
              {new Date(selectedTournament.startDate).toLocaleDateString()}
              {selectedTournament.startDate !== selectedTournament.endDate &&
                ` - ${new Date(selectedTournament.endDate).toLocaleDateString()}`
              }
            </p>
          </div>
          <div className="tournament-stats">
            <div className="stat-item">
              <UserIcon className="stat-icon" />
              <div className="stat-value">{leaderboardData.length}</div>
              <div className="stat-label">Players</div>
            </div>
            <div className="stat-item">
              <ChartBarIcon className="stat-icon" />
              <div className="stat-value">{totalRounds}</div>
              <div className="stat-label">Rounds</div>
            </div>
            <div className="stat-item">
              <TrophyIcon className="stat-icon" />
              <div className="stat-value">{targetPoints}</div>
              <div className="stat-label">Target</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card leaderboard-card">
        <div className="leaderboard-header">
          <h2>Leaderboard</h2>
          <div className="leaderboard-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              <span>In Progress</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#94a3b8' }}></span>
              <span>Not Started</span>
            </div>
          </div>
        </div>

        {leaderboardData.length === 0 ? (
          <div className="empty-state">
            <p>No scores recorded yet</p>
            <button
              onClick={() => navigate(`/tournaments/${selectedTournament.id}`)}
              className="button primary"
            >
              Setup Scorecards
            </button>
          </div>
        ) : (
          <div className="leaderboard-table">
            {/* Mobile View */}
            <div className="mobile-leaderboard">
              {leaderboardData.map((entry, index) => (
                <div key={entry.playerId} className="player-card">
                  <div className="player-card-header">
                    <div className="position-badge" style={{
                      backgroundColor: entry.position <= 3 ? '#fbbf24' : '#e5e7eb'
                    }}>
                      {getPositionBadge(entry.position)}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{entry.playerName}</div>
                      <div className="player-handicap">HCP {entry.playerHandicap.toFixed(1)}</div>
                    </div>
                    <div className="points-display">
                      <div className="points-value">{entry.totalPoints}</div>
                      <div className="points-label">pts</div>
                    </div>
                  </div>

                  <div className="player-card-body">
                    <div className="score-grid">
                      <div className="score-item">
                        <span className="score-label">Rounds</span>
                        <span className="score-value">
                          {entry.roundsStarted}/{totalRounds}
                        </span>
                      </div>
                      {entry.roundsCompleted > 0 && (
                        <>
                          <div className="score-item">
                            <span className="score-label">Avg Points</span>
                            <span className="score-value">{entry.avgPoints}</span>
                          </div>
                          <div className="score-item">
                            <span className="score-label">Total Gross</span>
                            <span className="score-value">{entry.totalGross}</span>
                          </div>
                          <div className="score-item">
                            <span className="score-label">Total Net</span>
                            <span className="score-value">{entry.totalNet}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Round Breakdown */}
                    <div className="rounds-breakdown">
                      {entry.rounds.map(round => (
                        <div key={round.roundId} className="round-chip">
                          <div
                            className="round-indicator"
                            style={{ backgroundColor: getStatusColor(round.holesCompleted > 0 ? 1 : 0, 1) }}
                          ></div>
                          <span className="round-name">{round.roundName}</span>
                          <span className="round-points">{round.points}pts</span>
                          {round.status === 'in_progress' && (
                            <span className="round-progress">({round.holesCompleted}/18)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <table className="desktop-leaderboard">
              <thead>
                <tr>
                  <th className="position-col">Pos</th>
                  <th className="player-col">Player</th>
                  <th className="handicap-col">HCP</th>
                  <th className="rounds-col">Rounds</th>
                  <th className="points-col">Points</th>
                  <th className="avg-col">Avg</th>
                  <th className="gross-col">Gross</th>
                  <th className="net-col">Net</th>
                  <th className="vs-target-col">vs Target</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => {
                  const vsTarget = entry.totalPoints - (36 * entry.roundsCompleted);
                  return (
                    <tr key={entry.playerId} className={entry.position <= 3 ? 'top-three' : ''}>
                      <td className="position-col">
                        <span className="position-badge">
                          {getPositionBadge(entry.position)}
                        </span>
                      </td>
                      <td className="player-col">
                        <div className="player-name-cell">
                          {entry.playerName}
                          {entry.bestRound && entry.roundsCompleted > 1 && (
                            <span className="best-round-badge" title={`Best: ${entry.bestRound.roundName}`}>
                              🔥 {entry.bestRound.points}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="handicap-col">{entry.playerHandicap.toFixed(1)}</td>
                      <td className="rounds-col">
                        <span className="rounds-progress" style={{
                          color: getStatusColor(entry.roundsStarted, totalRounds)
                        }}>
                          {entry.roundsStarted}/{totalRounds}
                        </span>
                      </td>
                      <td className="points-col">
                        <span className="points-value-large">{entry.totalPoints}</span>
                      </td>
                      <td className="avg-col">
                        {entry.roundsCompleted > 0 ? entry.avgPoints : '-'}
                      </td>
                      <td className="gross-col">
                        {entry.totalGross > 0 ? entry.totalGross : '-'}
                      </td>
                      <td className="net-col">
                        {entry.totalNet > 0 ? entry.totalNet : '-'}
                      </td>
                      <td className="vs-target-col">
                        {entry.roundsCompleted > 0 ? (
                          <span className={vsTarget >= 0 ? 'positive' : 'negative'}>
                            {formatScoreToPar(vsTarget)}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StablefordLeaderboard;
