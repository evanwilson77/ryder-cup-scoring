import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTournamentSeries,
  subscribeToTournaments,
  createTournamentSeries
} from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { PlusIcon, TrophyIcon } from '@heroicons/react/24/outline';
import './TournamentDashboard.css';

function TournamentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [seriesFormData, setSeriesFormData] = useState({
    name: '',
    description: '',
    format: 'ryder_cup',
    theming: 'neutral',
    isRecurring: true,
    frequency: 'annual'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const seriesData = await getTournamentSeries();
      setSeries(seriesData);

      // Subscribe to tournaments
      const unsubTournaments = subscribeToTournaments((tournamentsData) => {
        setTournaments(tournamentsData);
        setLoading(false);
      });

      // Subscribe to players
      const unsubPlayers = subscribeToPlayers(setPlayers);

      return () => {
        unsubTournaments();
        unsubPlayers();
      };
    } catch (error) {
      console.error('Error loading tournament data:', error);
      setLoading(false);
    }
  };

  const getSeriesById = (seriesId) => {
    return series.find(s => s.id === seriesId);
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'setup':
        return 'status-badge-setup';
      case 'in_progress':
        return 'status-badge-in-progress';
      case 'completed':
        return 'status-badge-completed';
      default:
        return 'status-badge-default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'setup':
        return 'Setup';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateTournament = () => {
    navigate('/tournaments/create');
  };

  const handleTournamentClick = (tournament) => {
    // Navigate to tournament detail/management page
    navigate(`/tournaments/${tournament.id}`);
  };

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    try {
      await createTournamentSeries(seriesFormData);
      setShowSeriesModal(false);
      setSeriesFormData({
        name: '',
        description: '',
        format: 'ryder_cup',
        theming: 'neutral',
        isRecurring: true,
        frequency: 'annual'
      });
      // Reload series data
      const seriesData = await getTournamentSeries();
      setSeries(seriesData);
    } catch (error) {
      console.error('Error creating series:', error);
      alert('Failed to create series. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="tournament-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header card">
          <div className="header-content">
            <div className="header-text">
              <h1>Tournament Management</h1>
              <p>Manage all tournament series and individual tournaments</p>
            </div>
            <div className="header-actions">
              <button onClick={() => navigate('/')} className="button secondary">
                ← Back to Home
              </button>
              <button onClick={handleCreateTournament} className="button primary">
                <PlusIcon className="icon" />
                Create Tournament
              </button>
            </div>
          </div>
        </div>

        {/* In-Progress Tournaments Section */}
        {tournaments.filter(t => t.status === 'setup' || t.status === 'in_progress').length > 0 && (
          <div className="tournaments-section">
            <div className="section-header">
              <h2>Active Tournaments</h2>
              <p className="section-subtitle">Tournaments currently in setup or progress</p>
            </div>
            <div className="tournaments-grid">
              {tournaments
                .filter(t => t.status === 'setup' || t.status === 'in_progress')
                .map(tournament => {
                  const tournamentSeries = getSeriesById(tournament.seriesId);
                  return (
                    <div
                      key={tournament.id}
                      className="tournament-card card"
                      onClick={() => handleTournamentClick(tournament)}
                    >
                      <div className="tournament-header">
                        <div className="tournament-title">
                          <h3>{tournament.name}</h3>
                          {tournament.edition && (
                            <span className="edition-badge">{tournament.edition}</span>
                          )}
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(tournament.status)}`}>
                          {getStatusLabel(tournament.status)}
                        </span>
                      </div>

                      <div className="tournament-info">
                        <div className="info-row">
                          <span className="info-label">Series:</span>
                          <span className="info-value">
                            {tournament.seriesId ? (tournamentSeries?.name || 'Unknown') : 'No Series'}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Type:</span>
                          <span className="info-value capitalize">
                            {(tournament.hasTeams || (tournament.teams && tournament.teams.length > 0)) ? 'Team Tournament' : 'Individual Tournament'}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Course:</span>
                          <span className="info-value">{tournament.courseName}</span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Dates:</span>
                          <span className="info-value">
                            {formatDate(tournament.startDate)}
                            {tournament.endDate && tournament.endDate !== tournament.startDate && (
                              <> - {formatDate(tournament.endDate)}</>
                            )}
                          </span>
                        </div>

                        {tournament.players && tournament.players.length > 0 && (
                          <div className="info-row players-row">
                            <span className="info-label">Players:</span>
                            <div className="players-list">
                              {tournament.players.slice(0, 5).map((playerId, idx) => (
                                <span
                                  key={playerId}
                                  className="player-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/players/${playerId}/statistics`);
                                  }}
                                  title="View player statistics"
                                >
                                  {getPlayerName(playerId)}{idx < Math.min(tournament.players.length - 1, 4) ? ', ' : ''}
                                </span>
                              ))}
                              {tournament.players.length > 5 && (
                                <span className="players-more"> +{tournament.players.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Series Section */}
        <div className="series-section card">
          <div className="section-header">
            <h2>Tournament Series</h2>
            <p className="section-subtitle">View all tournaments and history for each series</p>
          </div>
          <div className="series-grid">
            {series.map(s => {
              const seriesTournaments = tournaments.filter(t => t.seriesId === s.id);
              const completedCount = seriesTournaments.filter(t => t.status === 'completed').length;

              return (
                <div
                  key={s.id}
                  className="series-item"
                  onClick={() => navigate(`/series/${s.id}/dashboard`)}
                >
                  <div className="series-header">
                    <TrophyIcon className="series-icon" />
                    <h3>{s.name}</h3>
                  </div>
                  {s.description && (
                    <p className="series-description">{s.description}</p>
                  )}
                  <div className="series-stats">
                    <div className="series-stat">
                      <span className="stat-number">{seriesTournaments.length}</span>
                      <span className="stat-text">Tournaments</span>
                    </div>
                    <div className="series-stat">
                      <span className="stat-number">{completedCount}</span>
                      <span className="stat-text">Completed</span>
                    </div>
                  </div>
                  <button className="series-view-btn">
                    View Series →
                  </button>
                </div>
              );
            })}

            {/* No Series Card */}
            {(() => {
              const noSeriesTournaments = tournaments.filter(t => !t.seriesId || t.seriesId === null);
              const noSeriesCompletedCount = noSeriesTournaments.filter(t => t.status === 'completed').length;

              return (
                <div
                  className="series-item no-series"
                  onClick={() => navigate('/series/none/dashboard')}
                >
                  <div className="series-header">
                    <TrophyIcon className="series-icon" />
                    <h3>No Series</h3>
                  </div>
                  <p className="series-description">Tournaments not part of any series</p>
                  <div className="series-stats">
                    <div className="series-stat">
                      <span className="stat-number">{noSeriesTournaments.length}</span>
                      <span className="stat-text">Tournaments</span>
                    </div>
                    <div className="series-stat">
                      <span className="stat-number">{noSeriesCompletedCount}</span>
                      <span className="stat-text">Completed</span>
                    </div>
                  </div>
                  <button className="series-view-btn">
                    View Tournaments →
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Manage Series Modal */}
        {showSeriesModal && (
          <div className="modal-overlay" onClick={() => setShowSeriesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Manage Tournament Series</h2>
                <button onClick={() => setShowSeriesModal(false)} className="modal-close">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {/* Existing Series List */}
                <div className="series-list-section">
                  <h3>Existing Series</h3>
                  {series.length > 0 ? (
                    <div className="series-list">
                      {series.map(s => (
                        <div key={s.id} className="series-item">
                          <div className="series-info">
                            <div className="series-name">{s.name}</div>
                            <div className="series-meta">
                              <span className="series-format capitalize">{s.format?.replace(/_/g, ' ')}</span>
                              {s.isRecurring && (
                                <span className="series-frequency"> • {s.frequency?.replace(/_/g, ' ')}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/series/${s.id}`);
                            }}
                            className="button small secondary"
                          >
                            View Standings
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">No series created yet</p>
                  )}
                </div>

                {/* Create New Series Form */}
                <div className="create-series-section">
                  <h3>Create New Series</h3>
                  <form onSubmit={handleCreateSeries}>
                    <div className="form-group">
                      <label>Series Name *</label>
                      <input
                        type="text"
                        value={seriesFormData.name}
                        onChange={(e) => setSeriesFormData({ ...seriesFormData, name: e.target.value })}
                        placeholder="e.g., Spring Classic"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={seriesFormData.description}
                        onChange={(e) => setSeriesFormData({ ...seriesFormData, description: e.target.value })}
                        placeholder="Brief description of the series"
                        rows="3"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Format *</label>
                        <select
                          value={seriesFormData.format}
                          onChange={(e) => setSeriesFormData({ ...seriesFormData, format: e.target.value })}
                          required
                        >
                          <option value="ryder_cup">Ryder Cup (Match Play)</option>
                          <option value="individual_stableford">Individual Stableford</option>
                          <option value="scramble">Scramble / Ambrose</option>
                          <option value="team_stableford">Team Stableford</option>
                          <option value="best_ball">Best Ball</option>
                          <option value="shamble">Shamble</option>
                          <option value="multi_day">Multi-Day Stroke Play</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Theming</label>
                        <select
                          value={seriesFormData.theming}
                          onChange={(e) => setSeriesFormData({ ...seriesFormData, theming: e.target.value })}
                        >
                          <option value="neutral">Neutral (Purple)</option>
                          <option value="ryder_cup">Ryder Cup (Red vs Blue)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={seriesFormData.isRecurring}
                            onChange={(e) => setSeriesFormData({ ...seriesFormData, isRecurring: e.target.checked })}
                          />
                          <span>Recurring Series</span>
                        </label>
                      </div>

                      {seriesFormData.isRecurring && (
                        <div className="form-group">
                          <label>Frequency</label>
                          <select
                            value={seriesFormData.frequency}
                            onChange={(e) => setSeriesFormData({ ...seriesFormData, frequency: e.target.value })}
                          >
                            <option value="annual">Annual</option>
                            <option value="2_per_year">2 per year</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => setShowSeriesModal(false)} className="button secondary">
                        Cancel
                      </button>
                      <button type="submit" className="button primary">
                        <PlusIcon className="icon" />
                        Create Series
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentDashboard;
