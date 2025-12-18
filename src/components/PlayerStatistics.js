import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToPlayers } from '../firebase/services';
import { subscribeToTournaments, getTournamentSeries } from '../firebase/tournamentServices';
import {
  calculatePlayerStatistics,
  calculateParPerformance,
  calculateSeriesStatistics
} from '../utils/statisticsUtils';
import { ArrowLeftIcon, TrophyIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import './PlayerStatistics.css';

function PlayerStatistics() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [series, setSeries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [parPerformance, setParPerformance] = useState(null);
  const [seriesStats, setSeriesStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const seriesData = await getTournamentSeries();
      setSeries(seriesData);
    };

    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTournaments = subscribeToTournaments(setTournaments);

    loadData();

    return () => {
      unsubPlayers();
      unsubTournaments();
    };
  }, []);

  useEffect(() => {
    if (players.length > 0 && tournaments.length > 0 && playerId) {
      const stats = calculatePlayerStatistics(playerId, tournaments, players);
      const parStats = calculateParPerformance(playerId, tournaments);
      const seriesData = calculateSeriesStatistics(playerId, tournaments, series);

      setStatistics(stats);
      setParPerformance(parStats);
      setSeriesStats(seriesData);
      setLoading(false);
    }
  }, [playerId, players, tournaments, series]);

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

          {/* Par Performance */}
          {parPerformance && (parPerformance.par3.holes > 0 || parPerformance.par4.holes > 0 || parPerformance.par5.holes > 0) && (
            <div className="card">
              <h3>Par Performance</h3>
              <div className="par-performance-grid">
                {parPerformance.par3.holes > 0 && (
                  <div className="par-performance-card par3">
                    <div className="par-header">
                      <span className="par-label">Par 3s</span>
                      <span className="par-average">{parPerformance.par3.average}</span>
                    </div>
                    <div className="par-stats">
                      <div className="par-stat-row">
                        <span className="stat-name">Holes Played:</span>
                        <span className="stat-value">{parPerformance.par3.holes}</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Birdies:</span>
                        <span className="stat-value">{parPerformance.par3.birdies} ({parPerformance.par3.birdieRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Pars:</span>
                        <span className="stat-value">{parPerformance.par3.pars} ({parPerformance.par3.parRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Bogeys+:</span>
                        <span className="stat-value">{parPerformance.par3.bogeys + parPerformance.par3.doublePlus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {parPerformance.par4.holes > 0 && (
                  <div className="par-performance-card par4">
                    <div className="par-header">
                      <span className="par-label">Par 4s</span>
                      <span className="par-average">{parPerformance.par4.average}</span>
                    </div>
                    <div className="par-stats">
                      <div className="par-stat-row">
                        <span className="stat-name">Holes Played:</span>
                        <span className="stat-value">{parPerformance.par4.holes}</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Birdies:</span>
                        <span className="stat-value">{parPerformance.par4.birdies} ({parPerformance.par4.birdieRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Pars:</span>
                        <span className="stat-value">{parPerformance.par4.pars} ({parPerformance.par4.parRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Bogeys+:</span>
                        <span className="stat-value">{parPerformance.par4.bogeys + parPerformance.par4.doublePlus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {parPerformance.par5.holes > 0 && (
                  <div className="par-performance-card par5">
                    <div className="par-header">
                      <span className="par-label">Par 5s</span>
                      <span className="par-average">{parPerformance.par5.average}</span>
                    </div>
                    <div className="par-stats">
                      <div className="par-stat-row">
                        <span className="stat-name">Holes Played:</span>
                        <span className="stat-value">{parPerformance.par5.holes}</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Eagles:</span>
                        <span className="stat-value">{parPerformance.par5.eagles} ({parPerformance.par5.eagleRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Birdies:</span>
                        <span className="stat-value">{parPerformance.par5.birdies} ({parPerformance.par5.birdieRate}%)</span>
                      </div>
                      <div className="par-stat-row">
                        <span className="stat-name">Pars:</span>
                        <span className="stat-value">{parPerformance.par5.pars} ({parPerformance.par5.parRate}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Series Statistics */}
          {seriesStats.length > 0 && (
            <div className="card">
              <h3>Performance by Series</h3>
              <div className="series-stats-grid">
                {seriesStats.map(seriesStat => (
                  <div key={seriesStat.seriesId} className="series-stat-card">
                    <div className="series-stat-header">
                      <h4>{seriesStat.seriesName}</h4>
                      {seriesStat.wins > 0 && (
                        <span className="wins-badge">
                          <TrophyIcon className="trophy-icon" />
                          {seriesStat.wins} {seriesStat.wins === 1 ? 'win' : 'wins'}
                        </span>
                      )}
                    </div>
                    <div className="series-stat-content">
                      <div className="series-stat-row">
                        <span className="stat-label">Rounds Played:</span>
                        <span className="stat-value">{seriesStat.roundsCompleted} / {seriesStat.roundsPlayed}</span>
                      </div>
                      <div className="series-stat-row">
                        <span className="stat-label">Best Gross:</span>
                        <span className="stat-value">{seriesStat.bestGross || '-'}</span>
                      </div>
                      <div className="series-stat-row">
                        <span className="stat-label">Best Net:</span>
                        <span className="stat-value">{seriesStat.bestNet || '-'}</span>
                      </div>
                      <div className="series-stat-row">
                        <span className="stat-label">Avg Gross:</span>
                        <span className="stat-value">{seriesStat.averageGross || '-'}</span>
                      </div>
                      <div className="series-stat-row">
                        <span className="stat-label">Avg Net:</span>
                        <span className="stat-value">{seriesStat.averageNet || '-'}</span>
                      </div>
                    </div>
                    {seriesStat.seriesId !== 'none' && (
                      <button
                        onClick={() => navigate(`/series/${seriesStat.seriesId}/dashboard`)}
                        className="button secondary small"
                      >
                        View Series
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card">
            <h3>Quick Links</h3>
            <div className="quick-links-grid">
              <button
                onClick={() => navigate('/players')}
                className="button secondary"
              >
                <AcademicCapIcon className="icon" />
                All Players
              </button>
              <button
                onClick={() => navigate('/tournaments')}
                className="button secondary"
              >
                <TrophyIcon className="icon" />
                Tournaments
              </button>
              <button
                onClick={() => navigate('/honours-board')}
                className="button secondary"
              >
                <TrophyIcon className="icon" />
                Honours Board
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerStatistics;
