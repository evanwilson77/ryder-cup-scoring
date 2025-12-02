import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentSeriesById, subscribeToTournaments } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { TrophyIcon, CalendarIcon, ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import './SeriesLeaderboard.css';

function SeriesLeaderboard() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournamentWinners, setTournamentWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  useEffect(() => {
    if (series && tournaments.length > 0 && players.length > 0) {
      calculateTournamentWinners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, tournaments, players]);

  const loadSeriesData = async () => {
    try {
      // Load series info
      const seriesData = await getTournamentSeriesById(seriesId);
      setSeries(seriesData);

      // Subscribe to tournaments in this series
      const unsubTournaments = subscribeToTournaments((tournamentsData) => {
        // Filter to only completed tournaments in this series
        const completedTournaments = tournamentsData.filter(t =>
          t.seriesId === seriesId && t.status === 'completed'
        );
        setTournaments(completedTournaments);
      }, seriesId);

      // Subscribe to players
      const unsubPlayers = subscribeToPlayers((playersData) => {
        setPlayers(playersData);
      });

      setLoading(false);

      return () => {
        unsubTournaments();
        unsubPlayers();
      };
    } catch (error) {
      console.error('Error loading series data:', error);
      setLoading(false);
    }
  };

  const calculateTournamentWinners = () => {
    const winnersData = [];

    // Process each completed tournament
    tournaments.forEach(tournament => {
      const hasStablefordRounds = tournament.rounds?.some(r =>
        r.format === 'individual_stableford' || r.format === 'team_stableford'
      );
      if (hasStablefordRounds && tournament.rounds) {
        const tournamentResults = calculateTournamentResults(tournament);

        // Get winner(s) and top 3
        const sortedResults = Array.from(tournamentResults.values())
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            // Tiebreaker: countback (could be enhanced)
            return 0;
          });

        const winner = sortedResults[0];
        const winnerPlayer = players.find(p => p.id === winner?.playerId);

        // Get all players tied for first
        const winners = sortedResults.filter(r => r.position === 1);
        const isPlayoff = winners.length > 1;

        winnersData.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentEdition: tournament.edition,
          tournamentDate: tournament.startDate,
          courseName: tournament.courseName,
          winnerId: winner?.playerId,
          winnerName: winnerPlayer?.name || 'Unknown',
          winnerPoints: winner?.points || 0,
          isPlayoff,
          playoffPlayers: isPlayoff ? winners.map(w => {
            const p = players.find(pl => pl.id === w.playerId);
            return { id: w.playerId, name: p?.name || 'Unknown', points: w.points };
          }) : null,
          topThree: sortedResults.slice(0, 3).map(r => {
            const p = players.find(pl => pl.id === r.playerId);
            return {
              playerId: r.playerId,
              playerName: p?.name || 'Unknown',
              points: r.points,
              position: r.position
            };
          }),
          totalPlayers: sortedResults.length
        });
      }
    });

    // Sort by date descending (most recent first)
    winnersData.sort((a, b) => new Date(b.tournamentDate) - new Date(a.tournamentDate));

    setTournamentWinners(winnersData);
  };

  const calculateTournamentResults = (tournament) => {
    const playerTournamentPoints = new Map();

    // Aggregate points across all rounds for each player
    tournament.rounds?.forEach(round => {
      round.scorecards?.forEach(scorecard => {
        if (scorecard.status === 'completed') {
          const current = playerTournamentPoints.get(scorecard.playerId) || 0;
          playerTournamentPoints.set(scorecard.playerId, current + (scorecard.totalPoints || 0));
        }
      });
    });

    // Sort by points and determine positions
    const results = Array.from(playerTournamentPoints.entries())
      .map(([playerId, points]) => ({ playerId, points }))
      .sort((a, b) => b.points - a.points);

    // Assign positions
    const resultsWithPositions = new Map();
    let currentPosition = 1;
    results.forEach((result, index) => {
      if (index > 0 && result.points === results[index - 1].points) {
        result.position = results[index - 1].position;
      } else {
        result.position = currentPosition;
      }
      currentPosition++;
      resultsWithPositions.set(result.playerId, result);
    });

    return resultsWithPositions;
  };

  const getPositionBadge = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position;
  };

  if (loading) {
    return (
      <div className="series-leaderboard loading">
        <div className="spinner"></div>
        <p>Loading series data...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="series-leaderboard">
        <div className="card">
          <div className="empty-state">
            <h2>Series Not Found</h2>
            <button onClick={() => navigate('/tournaments')} className="button primary">
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="series-leaderboard">
      {/* Header */}
      <div className="card series-header">
        <button onClick={() => navigate('/tournaments')} className="button secondary small back-button">
          <ArrowLeftIcon className="icon" />
          Back to Tournaments
        </button>

        <div className="series-title-section">
          <h1>{series.name} Series</h1>
          <p className="series-description">{series.description}</p>
          <div className="series-meta">
            <span className="series-format">{series.format.replace(/_/g, ' ')}</span>
            {series.frequency && (
              <span className="series-frequency">
                • {series.frequency === '2_per_year' ? '2 tournaments per year' :
                   series.frequency === 'annual' ? 'Annual' : series.frequency}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Series Stats */}
      <div className="series-stats-grid">
        <div className="card stat-card">
          <TrophyIcon className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{tournaments.length}</div>
            <div className="stat-label">Tournaments Completed</div>
          </div>
        </div>

        <div className="card stat-card">
          <UserIcon className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{tournamentWinners.length}</div>
            <div className="stat-label">Winners Crowned</div>
          </div>
        </div>

        <div className="card stat-card">
          <CalendarIcon className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{currentYear}</div>
            <div className="stat-label">Current Season</div>
          </div>
        </div>

        {tournamentWinners.length > 0 && tournamentWinners[0] && (
          <div className="card stat-card leader-card">
            <TrophyIcon className="stat-icon gold" />
            <div className="stat-content">
              <div className="stat-value">{tournamentWinners[0].winnerName}</div>
              <div className="stat-label">Latest Champion</div>
            </div>
          </div>
        )}
      </div>

      {/* Honours Board - Tournament Winners */}
      <div className="card standings-card">
        <div className="standings-header">
          <h2>Honours Board</h2>
          <div className="standings-subtitle">
            Champions from {tournaments.length} completed tournament{tournaments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {tournamentWinners.length === 0 ? (
          <div className="empty-state">
            <p>No champions yet - complete tournaments to add to the honours board</p>
            <button onClick={() => navigate('/tournaments/create')} className="button primary">
              Create Tournament
            </button>
          </div>
        ) : (
          <div className="honours-list">
            {/* Tournament Winners List */}
            {tournamentWinners.map((winner, index) => (
              <div key={winner.tournamentId} className="honour-card"
                onClick={() => navigate(`/tournaments/${winner.tournamentId}`)}>
                <div className="honour-header">
                  <div className="honour-trophy">
                    <TrophyIcon className="trophy-icon" />
                    {index === 0 && <span className="latest-badge">Latest</span>}
                  </div>
                  <div className="honour-tournament-info">
                    <div className="honour-tournament-name">
                      {winner.tournamentName}
                      {winner.tournamentEdition && <span className="edition-text"> ({winner.tournamentEdition})</span>}
                    </div>
                    <div className="honour-tournament-date">
                      {new Date(winner.tournamentDate).toLocaleDateString('en-NZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="honour-course">{winner.courseName}</div>
                  </div>
                </div>

                <div className="honour-body">
                  {winner.isPlayoff ? (
                    <div className="playoff-winner">
                      <div className="playoff-badge">PLAYOFF REQUIRED</div>
                      <div className="playoff-players">
                        {winner.playoffPlayers.map((p, idx) => (
                          <div key={p.id} className="playoff-player">
                            {p.name} - {p.points} pts
                          </div>
                        ))}
                      </div>
                      <div className="playoff-note">Winner to be determined</div>
                    </div>
                  ) : (
                    <>
                      <div className="winner-section">
                        <div className="winner-label">Champion</div>
                        <div className="winner-name">{winner.winnerName}</div>
                        <div className="winner-score">{winner.winnerPoints} points</div>
                      </div>

                      {winner.topThree && winner.topThree.length > 1 && (
                        <div className="podium-section">
                          <div className="podium-label">Top 3</div>
                          <div className="podium-list">
                            {winner.topThree.map((player, idx) => (
                              <div key={player.playerId} className={`podium-player position-${idx + 1}`}>
                                <span className="podium-position">{getPositionBadge(player.position)}</span>
                                <span className="podium-name">{player.playerName}</span>
                                <span className="podium-points">{player.points}pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="honour-footer">
                    <span className="participants-count">{winner.totalPlayers} players competed</span>
                    <button
                      className="view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tournaments/${winner.tournamentId}`);
                      }}
                    >
                      View Full Results →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeriesLeaderboard;
