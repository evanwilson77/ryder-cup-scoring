import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTournamentSeries,
  createTournamentSeries
} from '../firebase/tournamentServices';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import './SeriesManagement.css';

function SeriesManagement() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [seriesFormData, setSeriesFormData] = useState({
    name: '',
    description: '',
    format: 'ryder_cup',
    theming: 'neutral',
    isRecurring: false,
    frequency: 'monthly'
  });

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const seriesData = await getTournamentSeries();
      setSeries(seriesData);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    if (!seriesFormData.name.trim()) return;

    setCreating(true);
    try {
      await createTournamentSeries({
        ...seriesFormData,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setSeriesFormData({
        name: '',
        description: '',
        format: 'ryder_cup',
        theming: 'neutral',
        isRecurring: false,
        frequency: 'monthly'
      });

      // Reload series
      await loadSeries();
    } catch (error) {
      console.error('Error creating series:', error);
      alert('Failed to create series. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="series-management">
        <div className="loading">Loading series...</div>
      </div>
    );
  }

  return (
    <div className="series-management">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeftIcon className="icon" />
          Back to Dashboard
        </button>
        <h1>Manage Tournament Series</h1>
        <p className="page-subtitle">Create and manage your tournament series</p>
      </div>

      <div className="series-content">
        {/* Existing Series List */}
        <div className="series-section card">
          <h2>Existing Series</h2>
          {series.length > 0 ? (
            <div className="series-list">
              {series.map(s => (
                <div key={s.id} className="series-item">
                  <div className="series-info">
                    <div className="series-name">{s.name}</div>
                    {s.description && (
                      <div className="series-description">{s.description}</div>
                    )}
                    <div className="series-meta">
                      <span className="series-format capitalize">{s.format?.replace(/_/g, ' ')}</span>
                      {s.isRecurring && (
                        <span className="series-frequency"> • {s.frequency?.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="series-actions">
                    <button
                      onClick={() => navigate(`/series/${s.id}/dashboard`)}
                      className="button small secondary"
                    >
                      View Dashboard
                    </button>
                    <button
                      onClick={() => navigate(`/series/${s.id}`)}
                      className="button small primary"
                    >
                      View Standings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No series created yet. Create one below to get started!</p>
          )}
        </div>

        {/* Create New Series Form */}
        <div className="create-series-section card">
          <h2>Create New Series</h2>
          <form onSubmit={handleCreateSeries} className="series-form">
            <div className="form-group">
              <label>Series Name *</label>
              <input
                type="text"
                value={seriesFormData.name}
                onChange={(e) => setSeriesFormData({ ...seriesFormData, name: e.target.value })}
                className="form-input"
                placeholder="e.g., Spring Classic"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={seriesFormData.description}
                onChange={(e) => setSeriesFormData({ ...seriesFormData, description: e.target.value })}
                className="form-textarea"
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
                  className="form-select"
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
                  className="form-select"
                >
                  <option value="neutral">Neutral (Purple)</option>
                  <option value="ryder">Ryder Cup (Blue/Yellow)</option>
                  <option value="masters">Masters (Green)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={seriesFormData.isRecurring}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, isRecurring: e.target.checked })}
                />
                <span>Recurring Series</span>
              </label>
              <p className="field-hint">Enable if this series repeats regularly</p>
            </div>

            {seriesFormData.isRecurring && (
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={seriesFormData.frequency}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, frequency: e.target.value })}
                  className="form-select"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            <button type="submit" className="button primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Series'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SeriesManagement;
