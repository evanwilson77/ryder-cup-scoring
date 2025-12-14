import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './PlayerSelectionStep.css';

/**
 * Player Selection Step Component
 * Second step in tournament creation - allows selecting participating players
 */
function PlayerSelectionStep({ formData, errors, players, onPlayerToggle, onSelectAll }) {
  const navigate = useNavigate();

  return (
    <div className="form-step">
      <h2>Select Players</h2>
      <p className="step-subtitle">Choose which players will participate in this tournament</p>

      {errors.players && (
        <div className="error-banner">{errors.players}</div>
      )}

      <div className="player-selection-controls">
        <div className="selection-summary">
          <span className="selected-count">{formData.selectedPlayers.length}</span>
          <span className="selection-text">of {players.length} players selected</span>
        </div>
        <button
          type="button"
          onClick={onSelectAll}
          className="button secondary small"
        >
          {formData.selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="players-grid">
        {players.map(player => (
          <div
            key={player.id}
            className={`player-card ${formData.selectedPlayers.includes(player.id) ? 'selected' : ''}`}
            onClick={() => onPlayerToggle(player.id)}
          >
            <div className="player-checkbox">
              <input
                type="checkbox"
                checked={formData.selectedPlayers.includes(player.id)}
                readOnly
              />
            </div>
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="empty-state">
          <p>No players found. Add players in Player Management first.</p>
          <button onClick={() => navigate('/players')} className="button primary">
            Go to Player Management
          </button>
        </div>
      )}
    </div>
  );
}

PlayerSelectionStep.propTypes = {
  /** Current form data */
  formData: PropTypes.shape({
    selectedPlayers: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  /** Validation errors */
  errors: PropTypes.object.isRequired,
  /** Available players */
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      handicap: PropTypes.number.isRequired
    })
  ).isRequired,
  /** Callback when a player is toggled */
  onPlayerToggle: PropTypes.func.isRequired,
  /** Callback when select/deselect all is clicked */
  onSelectAll: PropTypes.func.isRequired
};

export default PlayerSelectionStep;
