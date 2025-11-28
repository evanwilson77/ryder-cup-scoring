import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMatch,
  subscribeToPlayers,
  subscribeToTeams,
  subscribeToHoles
} from '../firebase/services';
import { calculateMatchStatus } from '../utils/scoring';
import './MatchDetail.css';

function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [holes, setHoles] = useState([]);

  useEffect(() => {
    getMatch(matchId).then(setMatch);
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubHoles = subscribeToHoles(setHoles);

    return () => {
      unsubPlayers();
      unsubTeams();
      unsubHoles();
    };
  }, [matchId]);

  if (!match || holes.length === 0) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const team1 = teams.find(t => t.id === 'team1');
  const team2 = teams.find(t => t.id === 'team2');
  const getPlayer = (playerId) => players.find(p => p.id === playerId);
  const matchStatus = calculateMatchStatus(match.holeScores, 18, team1?.name, team2?.name);

  const getHoleWinnerText = (holeScore) => {
    if (!holeScore || !holeScore.winner) return '-';
    if (holeScore.winner === 'team1') return team1?.name || 'Team 1';
    if (holeScore.winner === 'team2') return team2?.name || 'Team 2';
    return 'Halved';
  };

  const getHoleWinnerClass = (holeScore) => {
    if (!holeScore || !holeScore.winner) return '';
    if (holeScore.winner === 'team1') return 'team1-win';
    if (holeScore.winner === 'team2') return 'team2-win';
    return 'halved';
  };

  const getScoreDisplay = (holeScore, holeNumber) => {
    if (!holeScore) return { team1: '-', team2: '-' };

    if (match.format === 'singles') {
      return {
        team1: holeScore.team1Player1 || holeScore.team1Gross || '-',
        team2: holeScore.team2Player1 || holeScore.team2Gross || '-'
      };
    } else if (match.format === 'foursomes') {
      return {
        team1: holeScore.team1Score || holeScore.team1Gross || '-',
        team2: holeScore.team2Score || holeScore.team2Gross || '-'
      };
    } else if (match.format === 'fourball') {
      const team1Best = Math.min(
        holeScore.team1Player1 || 999,
        holeScore.team1Player2 || 999
      );
      const team2Best = Math.min(
        holeScore.team2Player1 || 999,
        holeScore.team2Player2 || 999
      );
      return {
        team1: team1Best === 999 ? '-' : team1Best,
        team2: team2Best === 999 ? '-' : team2Best
      };
    }

    return { team1: '-', team2: '-' };
  };

  return (
    <div className="match-detail">
      <div className="card">
        <button className="button secondary small" onClick={() => navigate('/')}>
          ← Back to Leaderboard
        </button>

        <div className="match-header">
          <h2>{match.name}</h2>
          <div className="match-meta">
            <span className="format-badge">{match.format}</span>
            <span className={`status-badge ${match.status}`}>
              {match.status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        <div className="match-result-banner" style={{
          background: matchStatus.team1Up === 0 ? '#f8f9fa' :
                     matchStatus.team1Up > 0 ? team1?.color : team2?.color,
          color: matchStatus.team1Up === 0 ? '#333' : 'white'
        }}>
          <h3>{matchStatus.status}</h3>
        </div>

        <div className="teams-display">
          <div className="team-info" style={{ borderTopColor: team1?.color }}>
            <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
            <div className="players-list">
              {match.team1Players.map(playerId => {
                const player = getPlayer(playerId);
                return player ? (
                  <div key={playerId} className="player-name">
                    {player.name} <span className="handicap">(HCP {player.handicap})</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="vs">VS</div>

          <div className="team-info" style={{ borderTopColor: team2?.color }}>
            <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
            <div className="players-list">
              {match.team2Players.map(playerId => {
                const player = getPlayer(playerId);
                return player ? (
                  <div key={playerId} className="player-name">
                    {player.name} <span className="handicap">(HCP {player.handicap})</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Hole-by-Hole Results</h3>
        <div className="scorecard-table">
          <div className="scorecard-header">
            <div>Hole</div>
            <div>Par</div>
            <div style={{ color: team1?.color }}>{team1?.name}</div>
            <div style={{ color: team2?.color }}>{team2?.name}</div>
            <div>Winner</div>
          </div>

          {holes.map((hole, idx) => {
            const holeScore = match.holeScores[idx];
            const scores = getScoreDisplay(holeScore, hole.number);

            return (
              <div key={hole.id} className={`scorecard-row ${getHoleWinnerClass(holeScore)}`}>
                <div className="hole-number">{hole.number}</div>
                <div className="par-value">{hole.par}</div>
                <div className="score-value">{scores.team1}</div>
                <div className="score-value">{scores.team2}</div>
                <div className="winner-value">{getHoleWinnerText(holeScore)}</div>
              </div>
            );
          })}

          <div className="scorecard-totals">
            <div><strong>Total</strong></div>
            <div><strong>{holes.reduce((sum, h) => sum + h.par, 0)}</strong></div>
            <div><strong>-</strong></div>
            <div><strong>-</strong></div>
            <div><strong>{matchStatus.status}</strong></div>
          </div>
        </div>
      </div>

      <div className="card match-stats">
        <h3>Match Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Holes Played</span>
            <span className="stat-value">{matchStatus.holesPlayed} / 18</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Holes Remaining</span>
            <span className="stat-value">{matchStatus.holesRemaining}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className="stat-value">{match.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchDetail;
