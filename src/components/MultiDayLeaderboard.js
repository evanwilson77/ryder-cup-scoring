import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import './MultiDayLeaderboard.css';

function MultiDayLeaderboard() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overall'); // 'overall' or specific roundId

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, (tournamentData) => {
      setTournament(tournamentData);
      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => {
      unsubTournament();
      unsubPlayers();
    };
  }, [tournamentId]);

  useEffect(() => {
    if (tournament && players.length > 0) {
      calculateLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament, players, selectedView]);

  const calculateLeaderboard = () => {
    if (!tournament || players.length === 0) return;

    const playerScores = new Map();

    // Initialize player data
    players.forEach(player => {
      playerScores.set(player.id, {
        id: player.id,
        name: player.name,
        handicap: player.handicap || 0,
        roundScores: {},
        totalPoints: 0,
        roundsPlayed: 0,
        averagePoints: 0
      });
    });

    // Calculate scores for each round
    tournament.rounds?.forEach(round => {
      if (round.scoringFormat !== 'stableford') return;

      round.scorecards?.forEach(scorecard => {
        if (scorecard.status !== 'completed') return;

        const playerData = playerScores.get(scorecard.playerId);
        if (!playerData) return;

        const roundPoints = scorecard.totalPoints || 0;
        playerData.roundScores[round.id] = {
          points: roundPoints,
          roundNumber: tournament.rounds.findIndex(r => r.id === round.id) + 1,
          courseName: round.courseData?.name || 'Unknown Course',
          date: scorecard.completedAt
        };

        // Only include in total if viewing overall or this specific round
        if (selectedView === 'overall' || selectedView === round.id) {
          playerData.totalPoints += roundPoints;
          playerData.roundsPlayed += 1;
        }
      });
    });

    // Calculate averages and create leaderboard array
    const leaderboardArray = Array.from(playerScores.values())
      .filter(player => player.roundsPlayed > 0)
      .map(player => ({
        ...player,
        averagePoints: player.roundsPlayed > 0
          ? (player.totalPoints / player.roundsPlayed).toFixed(1)
          : '0.0'
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Add position
    leaderboardArray.forEach((player, index) => {
      player.position = index + 1;
    });

    setLeaderboard(leaderboardArray);
  };

  const getRoundOptions = () => {
    if (!tournament) return [];

    return tournament.rounds
      ?.filter(round => round.scoringFormat === 'stableford')
      .map((round, index) => ({
        id: round.id,
        label: `Round ${index + 1}`,
        courseName: round.courseData?.name || 'Unknown Course'
      })) || [];
  };

  const getPointsDifferenceFromLeader = (points) => {
    if (!leaderboard || leaderboard.length === 0) return null;
    const leaderPoints = leaderboard[0].totalPoints;
    if (points === leaderPoints) return 'Leader';
    const diff = leaderPoints - points;
    return `-${diff}`;
  };

  const getPositionChange = (player) => {
    // This would require historical data - for now just return null
    // In a full implementation, you'd compare with previous round standings
    return null;
  };

  if (loading || !tournament) {
    return (
      <div className="multi-day-leaderboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const roundOptions = getRoundOptions();
  const selectedRoundInfo = roundOptions.find(r => r.id === selectedView);

  return (
    <div className="multi-day-leaderboard">
      <div className="leaderboard-container">
        {/* Header */}
        <div className="leaderboard-header">
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="button secondary small back-button"
          >
            <ArrowLeftIcon className="icon" />
            Back
          </button>

          <div className="header-info">
            <div className="title-with-icon">
              <TrophyIcon className="trophy-icon" />
              <h1>{tournament.name} - Multi-Day Leaderboard</h1>
            </div>
            <p className="tournament-subtitle">
              {tournament.format === 'stableford' ? 'Stableford' : 'Multi-Round'} Competition
            </p>
          </div>
        </div>

        {/* View Selector */}
        <div className="view-selector">
          <div className="view-tabs">
            <button
              onClick={() => setSelectedView('overall')}
              className={`view-tab ${selectedView === 'overall' ? 'active' : ''}`}
            >
              <ChartBarIcon className="tab-icon" />
              Overall Standings
            </button>
            {roundOptions.map(round => (
              <button
                key={round.id}
                onClick={() => setSelectedView(round.id)}
                className={`view-tab ${selectedView === round.id ? 'active' : ''}`}
              >
                {round.label}
                <span className="course-name">{round.courseName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        {leaderboard.length > 0 && (
          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-label">Total Players</span>
              <span className="stat-value">{leaderboard.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Rounds Completed</span>
              <span className="stat-value">{roundOptions.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Leading Score</span>
              <span className="stat-value">{leaderboard[0]?.totalPoints || 0} pts</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">
                {(leaderboard.reduce((sum, p) => sum + p.totalPoints, 0) / leaderboard.length).toFixed(1)} pts
              </span>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="leaderboard-section">
          <div className="leaderboard-title">
            <h2>
              {selectedView === 'overall'
                ? 'Overall Standings'
                : `${selectedRoundInfo?.label} - ${selectedRoundInfo?.courseName}`}
            </h2>
            <span className="entry-count">{leaderboard.length} entries</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="no-scores">
              <p>No scores recorded yet</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="col-position">Pos</div>
                <div className="col-player">Player</div>
                <div className="col-handicap">HCP</div>
                <div className="col-rounds">Rounds</div>
                <div className="col-total">Total</div>
                <div className="col-average">Average</div>
                <div className="col-behind">Behind</div>
              </div>

              {leaderboard.map((player) => (
                <div
                  key={player.id}
                  className={`leaderboard-row ${player.position === 1 ? 'leader' : ''} ${player.position <= 3 ? 'podium' : ''}`}
                >
                  <div className="col-position">
                    <span className="position-badge">
                      {player.position === 1 && <TrophyIcon className="trophy-icon-small gold" />}
                      {player.position === 2 && <TrophyIcon className="trophy-icon-small silver" />}
                      {player.position === 3 && <TrophyIcon className="trophy-icon-small bronze" />}
                      {player.position}
                    </span>
                    {getPositionChange(player) && (
                      <span className={`position-change ${getPositionChange(player) > 0 ? 'up' : 'down'}`}>
                        {getPositionChange(player) > 0 ? '↑' : '↓'}{Math.abs(getPositionChange(player))}
                      </span>
                    )}
                  </div>

                  <div className="col-player">
                    <span className="player-name">{player.name}</span>
                  </div>

                  <div className="col-handicap">
                    <span className="handicap-value">{player.handicap.toFixed(1)}</span>
                  </div>

                  <div className="col-rounds">
                    <span className="rounds-value">{player.roundsPlayed}</span>
                  </div>

                  <div className="col-total">
                    <span className="total-points">{player.totalPoints}</span>
                    <span className="points-label">pts</span>
                  </div>

                  <div className="col-average">
                    <span className="average-value">{player.averagePoints}</span>
                  </div>

                  <div className="col-behind">
                    <span className={`behind-value ${player.position === 1 ? 'leader-text' : ''}`}>
                      {getPointsDifferenceFromLeader(player.totalPoints)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Round Details for Selected Player (if viewing single round) */}
        {selectedView !== 'overall' && leaderboard.length > 0 && (
          <div className="round-details-section">
            <h3>Round Details</h3>
            <div className="round-details-grid">
              {leaderboard.slice(0, 5).map(player => {
                const roundData = player.roundScores[selectedView];
                if (!roundData) return null;

                return (
                  <div key={player.id} className="round-detail-card">
                    <div className="card-header">
                      <span className="player-name-small">{player.name}</span>
                      <span className="position-small">#{player.position}</span>
                    </div>
                    <div className="card-body">
                      <div className="detail-item">
                        <span className="detail-label">Points:</span>
                        <span className="detail-value">{roundData.points}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Course:</span>
                        <span className="detail-value">{roundData.courseName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiDayLeaderboard;
