import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentSeriesById, subscribeToTournaments } from '../firebase/tournamentServices';
import {
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  PhotoIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import './SeriesDashboard.css';

function SeriesDashboard() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  const loadSeriesData = async () => {
    try {
      // Load series info
      const seriesData = await getTournamentSeriesById(seriesId);
      setSeries(seriesData);

      // Subscribe to all tournaments in this series
      const unsubTournaments = subscribeToTournaments((tournamentsData) => {
        // Filter tournaments in this series and sort by date (newest first)
        const seriesTournaments = tournamentsData
          .filter(t => t.seriesId === seriesId)
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setTournaments(seriesTournaments);
        setLoading(false);
      }, seriesId);

      return () => {
        unsubTournaments();
      };
    } catch (error) {
      console.error('Error loading series data:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      setup: { className: 'status-setup', label: 'Setup', icon: ClockIcon },
      in_progress: { className: 'status-in-progress', label: 'In Progress', icon: ClockIcon },
      completed: { className: 'status-completed', label: 'Completed', icon: TrophyIcon }
    };
    return badges[status] || badges.setup;
  };

  const getTournamentStats = () => {
    const completed = tournaments.filter(t => t.status === 'completed').length;
    const inProgress = tournaments.filter(t => t.status === 'in_progress').length;
    const upcoming = tournaments.filter(t => t.status === 'setup').length;

    return { completed, inProgress, upcoming, total: tournaments.length };
  };

  if (loading || !series) {
    return (
      <div className="series-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const stats = getTournamentStats();

  return (
    <div className="series-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <button onClick={() => navigate('/tournaments')} className="back-button">
            <ArrowLeftIcon className="icon" />
            Back to Tournaments
          </button>

          <div className="series-header-content">
            <div className="series-title-section">
              <h1>{series.name}</h1>
              {series.description && (
                <p className="series-description">{series.description}</p>
              )}
            </div>

            <div className="series-meta">
              {series.startYear && (
                <div className="meta-item">
                  <CalendarIcon className="icon" />
                  <span>Since {series.startYear}</span>
                </div>
              )}
              <div className="meta-item">
                <TrophyIcon className="icon" />
                <span>{stats.total} Tournament{stats.total !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card completed">
            <div className="stat-icon">
              <TrophyIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card in-progress">
            <div className="stat-icon">
              <ClockIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          <div className="stat-card upcoming">
            <div className="stat-icon">
              <CalendarIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.upcoming}</div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Series Information</h2>
          <div className="quick-actions-grid">
            <button
              onClick={() => navigate(`/honours`)}
              className="action-card honours"
            >
              <div className="action-icon">
                <TrophyIcon className="icon" />
              </div>
              <div className="action-content">
                <h3>Honours Board</h3>
                <p>View all-time winners and champions</p>
              </div>
            </button>

            <button
              onClick={() => navigate(`/series/${seriesId}`)}
              className="action-card leaderboard"
            >
              <div className="action-icon">
                <ChartBarIcon className="icon" />
              </div>
              <div className="action-content">
                <h3>Series Leaderboard</h3>
                <p>Current standings and points</p>
              </div>
            </button>

            <button
              onClick={() => alert('Photo gallery coming in Phase 7!')}
              className="action-card photos"
              disabled
            >
              <div className="action-icon">
                <PhotoIcon className="icon" />
              </div>
              <div className="action-content">
                <h3>Photo Gallery</h3>
                <p>Browse tournament photos</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/players')}
              className="action-card players"
            >
              <div className="action-icon">
                <UserGroupIcon className="icon" />
              </div>
              <div className="action-content">
                <h3>Players</h3>
                <p>View all series participants</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="tournaments-section">
          <div className="section-header">
            <h2>All Tournaments</h2>
            <p className="section-subtitle">
              {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} in this series
            </p>
          </div>

          {tournaments.length > 0 ? (
            <div className="tournaments-list">
              {tournaments.map(tournament => {
                const statusBadge = getStatusBadge(tournament.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={tournament.id}
                    className={`tournament-card ${tournament.status}`}
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  >
                    <div className="tournament-header">
                      <div className="tournament-title">
                        <h3>{tournament.name}</h3>
                        {tournament.edition && (
                          <span className="tournament-edition">{tournament.edition}</span>
                        )}
                      </div>
                      <span className={`status-badge ${statusBadge.className}`}>
                        <StatusIcon className="badge-icon" />
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="tournament-details">
                      <div className="detail-item">
                        <CalendarIcon className="icon" />
                        <span>
                          {new Date(tournament.startDate).toLocaleDateString()}
                          {tournament.startDate !== tournament.endDate &&
                            ` - ${new Date(tournament.endDate).toLocaleDateString()}`
                          }
                        </span>
                      </div>

                      <div className="detail-item">
                        <TrophyIcon className="icon" />
                        <span className="capitalize">
                          {tournament.hasTeams ? 'Team Tournament' : 'Individual Tournament'}
                        </span>
                      </div>

                      <div className="detail-item">
                        <UserGroupIcon className="icon" />
                        <span>{tournament.players.length} Players</span>
                      </div>

                      {tournament.rounds && tournament.rounds.length > 0 && (
                        <div className="detail-item">
                          <ClockIcon className="icon" />
                          <span>{tournament.rounds.length} Round{tournament.rounds.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {tournament.status === 'completed' && (
                      <div className="tournament-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tournaments/${tournament.id}`);
                          }}
                          className="view-results-btn"
                        >
                          View Results
                        </button>
                      </div>
                    )}

                    {tournament.status === 'in_progress' && (
                      <div className="tournament-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tournaments/${tournament.id}`);
                          }}
                          className="continue-btn"
                        >
                          Continue Scoring
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <TrophyIcon className="empty-icon" />
              <p>No tournaments in this series yet.</p>
              <button
                onClick={() => navigate('/tournaments/create')}
                className="button primary"
              >
                Create First Tournament
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeriesDashboard;
