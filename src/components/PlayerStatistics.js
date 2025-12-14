import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToPlayers } from '../firebase/services';
import { subscribeToTournaments } from '../firebase/tournamentServices';
import { calculatePlayerStatistics } from '../utils/statisticsUtils';
import { ArrowLeftIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import './PlayerStatistics.css';

function PlayerStatistics() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTournaments = subscribeToTournaments(setTournaments);

    return () => {
      unsubPlayers();
      unsubTournaments();
    };
  }, []);

  useEffect(() => {
    if (players.length > 0 && tournaments.length > 0 && playerId) {
      const stats = calculatePlayerStatistics(playerId, tournaments, players);
      setStatistics(stats);
      setLoading(false);
    }
  }, [playerId, players, tournaments]);

  if (loading) {
    return (
      <div className="player-statistics">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!statistics || !statistics.player) {
    return (
      <div className="player-statistics">
        <div className="card">
          <div className="empty-state">
            <h2>Player Not Found</h2>
            <p>The player you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/players')} className="button primary">
              View All Players
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { player } = statistics;
  const hasData = statistics.completedRounds > 0;

  return (
    <div className="player-statistics">
      {/* Header */}
      <div className="card stats-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeftIcon className="icon" />
        </button>
        <div className="player-info">
          <h1>{player.name}</h1>
          <div className="player-details">
            <span className="handicap-badge">HCP {player.handicap?.toFixed(1) || 0}</span>
            <span className="rounds-badge">{statistics.completedRounds} rounds completed</span>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="card">
          <div className="empty-state">
            <ChartBarIcon className="empty-icon" />
            <h3>No Statistics Yet</h3>
            <p>{player.name} hasn't completed any rounds yet.</p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Performance Summary */}
          <div className="card stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <TrophyIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Best Gross</div>
                <div className="stat-value">{statistics.bestGross}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrophyIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Best Net</div>
                <div className="stat-value">{statistics.bestNet}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ChartBarIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Avg Gross</div>
                <div className="stat-value">{statistics.averageGross}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ChartBarIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Avg Net</div>
                <div className="stat-value">{statistics.averageNet}</div>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="card">
            <h3>Score Distribution</h3>
            <div className="score-distribution">
              <div className="score-dist-item eagles">
                <div className="score-dist-label">Eagles</div>
                <div className="score-dist-value">{statistics.eagles}</div>
                <div className="score-dist-bar" style={{width: `${Math.min(100, (statistics.eagles / (statistics.eagles + statistics.birdies + statistics.pars + statistics.bogeys + statistics.doublePlus)) * 100)}%`}}></div>
              </div>

              <div className="score-dist-item birdies">
                <div className="score-dist-label">Birdies</div>
                <div className="score-dist-value">{statistics.birdies}</div>
                <div className="score-dist-bar" style={{width: `${Math.min(100, (statistics.birdies / (statistics.eagles + statistics.birdies + statistics.pars + statistics.bogeys + statistics.doublePlus)) * 100)}%`}}></div>
              </div>

              <div className="score-dist-item pars">
                <div className="score-dist-label">Pars</div>
                <div className="score-dist-value">{statistics.pars}</div>
                <div className="score-dist-bar" style={{width: `${Math.min(100, (statistics.pars / (statistics.eagles + statistics.birdies + statistics.pars + statistics.bogeys + statistics.doublePlus)) * 100)}%`}}></div>
              </div>

              <div className="score-dist-item bogeys">
                <div className="score-dist-label">Bogeys</div>
                <div className="score-dist-value">{statistics.bogeys}</div>
                <div className="score-dist-bar" style={{width: `${Math.min(100, (statistics.bogeys / (statistics.eagles + statistics.birdies + statistics.pars + statistics.bogeys + statistics.doublePlus)) * 100)}%`}}></div>
              </div>

              <div className="score-dist-item double-plus">
                <div className="score-dist-label">Double+</div>
                <div className="score-dist-value">{statistics.doublePlus}</div>
                <div className="score-dist-bar" style={{width: `${Math.min(100, (statistics.doublePlus / (statistics.eagles + statistics.birdies + statistics.pars + statistics.bogeys + statistics.doublePlus)) * 100)}%`}}></div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <h3>Performance Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Total Rounds</div>
                <div className="summary-value">{statistics.totalRounds}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Completed Rounds</div>
                <div className="summary-value">{statistics.completedRounds}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Worst Gross</div>
                <div className="summary-value">{statistics.worstGross || '-'}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Avg Points</div>
                <div className="summary-value">{statistics.averagePoints > 0 ? statistics.averagePoints : '-'}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerStatistics;
