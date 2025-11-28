import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToTeams,
  subscribeToMatches,
  subscribeToPlayers
} from '../firebase/services';
import { calculateTournamentPoints, calculateMatchStatus, getProvisionalResult } from '../utils/scoring';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubMatches = subscribeToMatches(setMatches);
    const unsubPlayers = subscribeToPlayers(setPlayers);

    return () => {
      unsubTeams();
      unsubMatches();
      unsubPlayers();
    };
  }, []);

  const team1 = teams.find(t => t.id === 'team1');
  const team2 = teams.find(t => t.id === 'team2');

  // Calculate actual points (completed only)
  const { team1Points, team2Points } = calculateTournamentPoints(matches);

  // Calculate projected points (including in-progress matches)
  const calculateProjectedPoints = () => {
    let team1Projected = team1Points;
    let team2Projected = team2Points;

    const inProgressMatches = matches.filter(m => m.status === 'in_progress');
    inProgressMatches.forEach(match => {
      const projectedResult = getProvisionalResult(match.holeScores);
      if (projectedResult === 'team1_win') {
        team1Projected += 1;
      } else if (projectedResult === 'team2_win') {
        team2Projected += 1;
      } else if (projectedResult === 'halved') {
        team1Projected += 0.5;
        team2Projected += 0.5;
      }
    });

    return { team1Projected, team2Projected };
  };

  const { team1Projected, team2Projected } = calculateProjectedPoints();

  const completedMatches = matches.filter(m => m.status === 'completed');
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');
  const upcomingMatches = matches.filter(m => m.status === 'not_started');

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  const getMatchResultText = (match) => {
    if (!match.result) return 'In Progress';

    if (match.result === 'halved') {
      return 'Halved';
    } else if (match.result === 'team1_win') {
      return `${team1?.name} wins`;
    } else if (match.result === 'team2_win') {
      return `${team2?.name} wins`;
    }
  };

  const getPlayerNames = (playerIds) => {
    return playerIds.map(id => getPlayer(id)?.name).join(' & ');
  };

  return (
    <div className="leaderboard">
      <div className="card scoreboard">
        <h2>Tournament Leaderboard</h2>

        <div className="score-display">
          <div className="team-score" style={{ backgroundColor: team1?.color }}>
            <div className="team-name">{team1?.name || 'Team 1'}</div>
            <div className="team-points">
              {team1Points}
              {team1Projected !== team1Points && (
                <span className="provisional-score"> ({team1Projected})</span>
              )}
            </div>
            {inProgressMatches.length > 0 && (
              <div className="score-legend">
                Actual {team1Projected !== team1Points && '(Provisional)'}
              </div>
            )}
          </div>

          <div className="score-divider">
            <span>POINTS</span>
          </div>

          <div className="team-score" style={{ backgroundColor: team2?.color }}>
            <div className="team-name">{team2?.name || 'Team 2'}</div>
            <div className="team-points">
              {team2Points}
              {team2Projected !== team2Points && (
                <span className="provisional-score"> ({team2Projected})</span>
              )}
            </div>
            {inProgressMatches.length > 0 && (
              <div className="score-legend">
                Actual {team2Projected !== team2Points && '(Provisional)'}
              </div>
            )}
          </div>
        </div>

        <div className="match-summary">
          <div className="summary-item">
            <span className="summary-label">Total Matches</span>
            <span className="summary-value">{matches.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completed</span>
            <span className="summary-value">{completedMatches.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">In Progress</span>
            <span className="summary-value">{inProgressMatches.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Upcoming</span>
            <span className="summary-value">{upcomingMatches.length}</span>
          </div>
        </div>
      </div>

      {inProgressMatches.length > 0 && (
        <div className="card">
          <h3>Live Matches</h3>
          <div className="matches-list">
            {inProgressMatches.map(match => {
              const matchStatus = calculateMatchStatus(match.holeScores, 18, team1?.name, team2?.name);
              const projectedResult = getProvisionalResult(match.holeScores);

              return (
                <div key={match.id} className="match-item live">
                  <div className="match-info">
                    <div className="match-name">{match.name}</div>
                    <div className="match-format">{match.format}</div>
                    <div className="match-players">
                      <span style={{ color: team1?.color }}>
                        {getPlayerNames(match.team1Players)}
                      </span>
                      {' vs '}
                      <span style={{ color: team2?.color }}>
                        {getPlayerNames(match.team2Players)}
                      </span>
                    </div>
                    <div className="match-status-live">
                      {matchStatus.status} • {matchStatus.holesPlayed} of 18 played
                      {projectedResult && (
                        <span className="projected-indicator"> • Projected: {
                          projectedResult === 'team1_win' ? team1?.name :
                          projectedResult === 'team2_win' ? team2?.name :
                          'Halved'
                        }</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="button small"
                    onClick={() => navigate(`/scoring/${match.id}`)}
                  >
                    Continue Scoring
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedMatches.length > 0 && (
        <div className="card">
          <h3>Completed Matches</h3>
          <div className="matches-list">
            {completedMatches.map(match => (
              <div key={match.id} className="match-item completed">
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                  <div className="match-format">{match.format}</div>
                  <div className="match-players">
                    <span style={{ color: team1?.color }}>
                      {getPlayerNames(match.team1Players)}
                    </span>
                    {' vs '}
                    <span style={{ color: team2?.color }}>
                      {getPlayerNames(match.team2Players)}
                    </span>
                  </div>
                  <div className="match-result">
                    {getMatchResultText(match)}
                  </div>
                </div>
                <button
                  className="button small secondary"
                  onClick={() => navigate(`/match/${match.id}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="card">
          <h3>Upcoming Matches</h3>
          <div className="matches-list">
            {upcomingMatches.map(match => (
              <div key={match.id} className="match-item upcoming">
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                  <div className="match-format">{match.format}</div>
                  <div className="match-players">
                    <span style={{ color: team1?.color }}>
                      {getPlayerNames(match.team1Players)}
                    </span>
                    {' vs '}
                    <span style={{ color: team2?.color }}>
                      {getPlayerNames(match.team2Players)}
                    </span>
                  </div>
                </div>
                <button
                  className="button small"
                  onClick={() => navigate(`/scoring/${match.id}`)}
                >
                  Start Match
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="card empty-state">
          <h3>No Matches Yet</h3>
          <p>Get started by creating teams, adding players, and setting up matches!</p>
          <div className="quick-actions">
            <button className="button" onClick={() => navigate('/teams')}>
              Manage Teams
            </button>
            <button className="button" onClick={() => navigate('/matches')}>
              Create Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
