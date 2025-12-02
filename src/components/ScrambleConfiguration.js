import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getHandicapMethodDescription } from '../utils/scrambleCalculations';
import './ScrambleConfiguration.css';

function ScrambleConfiguration({ onSave, onClose, initialConfig = null }) {
  const [config, setConfig] = useState(initialConfig || {
    teamSize: 4,
    handicapMethod: 'usga',
    customPercentages: [20, 15, 10, 5],
    enforceDriveRequirements: true,
    minDrivesPerPlayer: 3,
    allowAllPlayersTeeOff: true,
    requireEachPlayerPutt: false,
    maxTeamHandicap: null
  });

  const handleTeamSizeChange = (size) => {
    // Update default custom percentages based on team size
    let defaultPercentages = [];
    switch (size) {
      case 2:
        defaultPercentages = [35, 15];
        break;
      case 3:
        defaultPercentages = [20, 15, 10];
        break;
      case 4:
        defaultPercentages = [20, 15, 10, 5];
        break;
      default:
        defaultPercentages = [20, 15, 10, 5];
    }

    setConfig({
      ...config,
      teamSize: size,
      customPercentages: defaultPercentages
    });
  };

  const handleCustomPercentageChange = (index, value) => {
    const newPercentages = [...config.customPercentages];
    newPercentages[index] = parseFloat(value) || 0;
    setConfig({
      ...config,
      customPercentages: newPercentages
    });
  };

  const handleSave = () => {
    // Validate configuration
    if (config.handicapMethod === 'custom') {
      const total = config.customPercentages.reduce((sum, p) => sum + p, 0);
      if (Math.abs(total - 100) > 0.01 && total > 0) {
        if (!window.confirm(`Custom percentages add up to ${total}%, not 100%. Continue anyway?`)) {
          return;
        }
      }
    }

    onSave(config);
  };

  const getPercentageTotal = () => {
    return config.customPercentages.reduce((sum, p) => sum + p, 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scramble-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Scramble Configuration</h2>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Team Size Selection */}
          <div className="config-section">
            <h3>Team Size</h3>
            <div className="team-size-options">
              {[2, 3, 4].map(size => (
                <label key={size} className={`size-option ${config.teamSize === size ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="teamSize"
                    value={size}
                    checked={config.teamSize === size}
                    onChange={() => handleTeamSizeChange(size)}
                  />
                  <span>{size}-person team</span>
                </label>
              ))}
            </div>
          </div>

          {/* Handicap System Selection */}
          <div className="config-section">
            <h3>Handicap System</h3>
            <div className="handicap-method-options">
              <label className={`method-option ${config.handicapMethod === 'none' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="handicapMethod"
                  value="none"
                  checked={config.handicapMethod === 'none'}
                  onChange={(e) => setConfig({ ...config, handicapMethod: e.target.value })}
                />
                <div className="method-content">
                  <div className="method-name">No Handicap</div>
                  <div className="method-description">Gross scores only</div>
                </div>
              </label>

              <label className={`method-option ${config.handicapMethod === 'usga' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="handicapMethod"
                  value="usga"
                  checked={config.handicapMethod === 'usga'}
                  onChange={(e) => setConfig({ ...config, handicapMethod: e.target.value })}
                />
                <div className="method-content">
                  <div className="method-name">USGA Scramble Method</div>
                  <div className="method-description">
                    {config.teamSize === 2 && '35% + 15% of course handicaps'}
                    {config.teamSize === 3 && '20% + 15% + 10% of course handicaps'}
                    {config.teamSize === 4 && '20% + 15% + 10% + 5% of course handicaps'}
                  </div>
                </div>
              </label>

              <label className={`method-option ${config.handicapMethod === 'ambrose' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="handicapMethod"
                  value="ambrose"
                  checked={config.handicapMethod === 'ambrose'}
                  onChange={(e) => setConfig({ ...config, handicapMethod: e.target.value })}
                />
                <div className="method-content">
                  <div className="method-name">Traditional Ambrose</div>
                  <div className="method-description">
                    Sum of handicaps ÷ {config.teamSize * 2}
                  </div>
                </div>
              </label>

              <label className={`method-option ${config.handicapMethod === 'custom' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="handicapMethod"
                  value="custom"
                  checked={config.handicapMethod === 'custom'}
                  onChange={(e) => setConfig({ ...config, handicapMethod: e.target.value })}
                />
                <div className="method-content">
                  <div className="method-name">Custom Percentages</div>
                  <div className="method-description">Define your own percentages</div>
                </div>
              </label>
            </div>

            {/* Custom Percentages Input */}
            {config.handicapMethod === 'custom' && (
              <div className="custom-percentages-section">
                <h4>Custom Percentages</h4>
                <p className="helper-text">
                  Enter percentage of each player's handicap (lowest to highest).
                  Total should equal 100% or less.
                </p>
                <div className="percentage-inputs">
                  {config.customPercentages.slice(0, config.teamSize).map((percentage, index) => (
                    <div key={index} className="percentage-input-group">
                      <label>Player {index + 1} (lowest {index === 0 ? '' : `+${index}`}):</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={percentage}
                          onChange={(e) => handleCustomPercentageChange(index, e.target.value)}
                        />
                        <span className="unit">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="percentage-total">
                  Total: {getPercentageTotal().toFixed(1)}%
                  {Math.abs(getPercentageTotal() - 100) > 0.01 && getPercentageTotal() > 0 && (
                    <span className="warning"> (Should be 100%)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drive Requirements */}
          <div className="config-section">
            <h3>Drive Requirements</h3>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={config.enforceDriveRequirements}
                onChange={(e) => setConfig({ ...config, enforceDriveRequirements: e.target.checked })}
              />
              <span>Enforce minimum drives per player</span>
            </label>

            {config.enforceDriveRequirements && (
              <div className="drive-requirement-config">
                <label>Minimum drives per player:</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={config.minDrivesPerPlayer}
                  onChange={(e) => setConfig({ ...config, minDrivesPerPlayer: parseInt(e.target.value) || 3 })}
                  className="drive-input"
                />
                <p className="helper-text">
                  Each player's drive must be used at least {config.minDrivesPerPlayer} times during the round.
                </p>
              </div>
            )}
          </div>

          {/* Scramble Rules */}
          <div className="config-section">
            <h3>Scramble Rules</h3>
            <div className="rules-options">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={config.allowAllPlayersTeeOff}
                  onChange={(e) => setConfig({ ...config, allowAllPlayersTeeOff: e.target.checked })}
                />
                <span>All players must tee off on each hole</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={config.requireEachPlayerPutt}
                  onChange={(e) => setConfig({ ...config, requireEachPlayerPutt: e.target.checked })}
                />
                <span>Require each player to putt at least once per round</span>
              </label>

              <div className="max-handicap-option">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={config.maxTeamHandicap !== null}
                    onChange={(e) => setConfig({
                      ...config,
                      maxTeamHandicap: e.target.checked ? 10 : null
                    })}
                  />
                  <span>Set maximum team handicap:</span>
                </label>
                {config.maxTeamHandicap !== null && (
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={config.maxTeamHandicap}
                    onChange={(e) => setConfig({ ...config, maxTeamHandicap: parseInt(e.target.value) || 0 })}
                    className="max-handicap-input"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="config-summary">
            <h4>Configuration Summary</h4>
            <ul>
              <li><strong>Team Size:</strong> {config.teamSize} players</li>
              <li><strong>Handicap:</strong> {getHandicapMethodDescription(
                config.handicapMethod,
                config.teamSize,
                config.customPercentages
              )}</li>
              {config.enforceDriveRequirements && (
                <li><strong>Drive Requirement:</strong> Minimum {config.minDrivesPerPlayer} drives per player</li>
              )}
              {config.maxTeamHandicap !== null && (
                <li><strong>Max Team Handicap:</strong> {config.maxTeamHandicap}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="button primary">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScrambleConfiguration;
