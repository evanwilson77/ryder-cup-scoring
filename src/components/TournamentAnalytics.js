import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToTournament } from '../firebase/tournamentServices';
import {
  calculateTournamentAnalytics,
  calculateHoleDifficulty
} from '../utils/statisticsUtils';
import { ArrowLeftIcon, ChartBarIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import './TournamentAnalytics.css';

function TournamentAnalytics() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [holeDifficulty, setHoleDifficulty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, (data) => {
      setTournament(data);
      if (data) {
        const analyticsData = calculateTournamentAnalytics(data);
        const holeData = calculateHoleDifficulty(data);
        setAnalytics(analyticsData);
        setHoleDifficulty(holeData);
        setLoading(false);
      }
    });

    return () => unsubTournament();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="tournament-analytics">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!tournament || !analytics) {
    return (
      <div className="tournament-analytics">
        <div className="card">
          <div className="empty-state">
            <h2>Tournament Not Found</h2>
            <p>The tournament you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/tournaments')} className="button primary">
              View Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasData = analytics.completedRounds > 0;
  const hardestHoles = holeDifficulty.slice(0, 5);
  const easiestHoles = holeDifficulty.slice(-5).reverse();

  return (
    <div className="tournament-analytics">
      {/* Header */}
      <div className="card analytics-header">
        <button onClick={() => navigate(`/tournaments/${tournamentId}`)} className="back-button">
          <ArrowLeftIcon className="icon" />
        </button>
        <div className="tournament-info">
          <h1>{tournament.name}</h1>
          {tournament.edition && (
            <span className="edition-badge">{tournament.edition}</span>
          )}
          <p className="tournament-dates">
            {new Date(tournament.startDate).toLocaleDateString()}
            {tournament.startDate !== tournament.endDate &&
              ` - ${new Date(tournament.endDate).toLocaleDateString()}`
            }
          </p>
        </div>
      </div>

      {!hasData && (
        <div className="card">
          <div className="empty-state">
            <ChartBarIcon className="empty-icon" />
            <h3>No Analytics Data Yet</h3>
            <p>Complete some rounds to see tournament analytics.</p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Overview Stats */}
          <div className="card stats-overview">
            <div className="stat-card">
              <div className="stat-icon">
                <UserGroupIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Players</div>
                <div className="stat-value">{analytics.totalPlayers}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ChartBarIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Rounds</div>
                <div className="stat-value">{analytics.totalRounds}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrophyIcon />
              </div>
              <div className="stat-content">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{analytics.completedRounds}</div>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="card">
            <h3>Tournament Score Distribution</h3>
            <div className="score-distribution">
              <div className="score-dist-item eagles">
                <div className="score-dist-header">
                  <span className="score-dist-label">Eagles</span>
                  <span className="score-dist-value">{analytics.scoringDistribution.eagles}</span>
                </div>
                <div className="score-dist-bar-container">
                  <div
                    className="score-dist-bar"
                    style={{
                      width: `${Math.min(100, (analytics.scoringDistribution.eagles /
                        (analytics.scoringDistribution.eagles +
                         analytics.scoringDistribution.birdies +
                         analytics.scoringDistribution.pars +
                         analytics.scoringDistribution.bogeys +
                         analytics.scoringDistribution.doublePlus)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-dist-item birdies">
                <div className="score-dist-header">
                  <span className="score-dist-label">Birdies</span>
                  <span className="score-dist-value">{analytics.scoringDistribution.birdies}</span>
                </div>
                <div className="score-dist-bar-container">
                  <div
                    className="score-dist-bar"
                    style={{
                      width: `${Math.min(100, (analytics.scoringDistribution.birdies /
                        (analytics.scoringDistribution.eagles +
                         analytics.scoringDistribution.birdies +
                         analytics.scoringDistribution.pars +
                         analytics.scoringDistribution.bogeys +
                         analytics.scoringDistribution.doublePlus)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-dist-item pars">
                <div className="score-dist-header">
                  <span className="score-dist-label">Pars</span>
                  <span className="score-dist-value">{analytics.scoringDistribution.pars}</span>
                </div>
                <div className="score-dist-bar-container">
                  <div
                    className="score-dist-bar"
                    style={{
                      width: `${Math.min(100, (analytics.scoringDistribution.pars /
                        (analytics.scoringDistribution.eagles +
                         analytics.scoringDistribution.birdies +
                         analytics.scoringDistribution.pars +
                         analytics.scoringDistribution.bogeys +
                         analytics.scoringDistribution.doublePlus)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-dist-item bogeys">
                <div className="score-dist-header">
                  <span className="score-dist-label">Bogeys</span>
                  <span className="score-dist-value">{analytics.scoringDistribution.bogeys}</span>
                </div>
                <div className="score-dist-bar-container">
                  <div
                    className="score-dist-bar"
                    style={{
                      width: `${Math.min(100, (analytics.scoringDistribution.bogeys /
                        (analytics.scoringDistribution.eagles +
                         analytics.scoringDistribution.birdies +
                         analytics.scoringDistribution.pars +
                         analytics.scoringDistribution.bogeys +
                         analytics.scoringDistribution.doublePlus)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-dist-item double-plus">
                <div className="score-dist-header">
                  <span className="score-dist-label">Double+</span>
                  <span className="score-dist-value">{analytics.scoringDistribution.doublePlus}</span>
                </div>
                <div className="score-dist-bar-container">
                  <div
                    className="score-dist-bar"
                    style={{
                      width: `${Math.min(100, (analytics.scoringDistribution.doublePlus /
                        (analytics.scoringDistribution.eagles +
                         analytics.scoringDistribution.birdies +
                         analytics.scoringDistribution.pars +
                         analytics.scoringDistribution.bogeys +
                         analytics.scoringDistribution.doublePlus)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Hole Difficulty */}
          {holeDifficulty.length > 0 && (
            <div className="hole-difficulty-grid">
              <div className="card">
                <h3>🔥 Hardest Holes</h3>
                <div className="hole-list">
                  {hardestHoles.map((hole) => (
                    <div key={hole.holeNumber} className="hole-item hard">
                      <div className="hole-number">#{hole.holeNumber}</div>
                      <div className="hole-stats">
                        <div className="hole-stat">
                          <span className="stat-label">Avg Score</span>
                          <span className="stat-value">{hole.averageScore}</span>
                        </div>
                        <div className="hole-stat">
                          <span className="stat-label">vs Par</span>
                          <span className="stat-value difficulty-value">
                            +{hole.difficulty.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>✨ Easiest Holes</h3>
                <div className="hole-list">
                  {easiestHoles.map((hole) => (
                    <div key={hole.holeNumber} className="hole-item easy">
                      <div className="hole-number">#{hole.holeNumber}</div>
                      <div className="hole-stats">
                        <div className="hole-stat">
                          <span className="stat-label">Avg Score</span>
                          <span className="stat-value">{hole.averageScore}</span>
                        </div>
                        <div className="hole-stat">
                          <span className="stat-label">vs Par</span>
                          <span className="stat-value difficulty-value">
                            {hole.difficulty >= 0 ? '+' : ''}{hole.difficulty.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TournamentAnalytics;
