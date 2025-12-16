import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import './DriveTrackerPanel.css';

/**
 * Drive Tracker Panel - Displays running total of drives used per player
 * Shows visual progress bars and warnings for drive requirements
 *
 * @param {Object} driveTracker - ScrambleDriveTracker instance
 * @param {Array} players - Team players
 * @param {number} currentHole - Current hole number (0-based)
 * @param {number} minDrivesRequired - Minimum drives required per player
 */
function DriveTrackerPanel({ driveTracker, players, currentHole, minDrivesRequired }) {
  if (!driveTracker || !players || players.length === 0) {
    return null;
  }

  // Calculate holes remaining
  const holesRemaining = 18 - (currentHole + 1);

  return (
    <div className="drive-tracker-panel">
      <h3>Drive Tracking Status</h3>
      <p className="holes-remaining">
        {holesRemaining} hole{holesRemaining !== 1 ? 's' : ''} remaining
      </p>

      <div className="player-drive-statuses">
        {players.map(player => {
          const status = driveTracker.getPlayerStatus(player.id, currentHole + 1);
          const progressPercent = (status.used / status.required) * 100;

          // Determine status color and icon
          let statusClass = 'status-ok';
          let statusIcon = null;
          let statusMessage = '';

          if (status.isCompliant) {
            // Completed minimum
            statusClass = 'status-complete';
            statusIcon = <CheckCircleIcon className="status-icon" />;
            statusMessage = 'Requirement met';
          } else if (status.warning) {
            // Behind pace - needs more drives than holes remaining
            statusClass = 'status-danger';
            statusIcon = <ExclamationTriangleIcon className="status-icon" />;
            statusMessage = `Needs ${status.remaining} more (${status.holesLeft} left)`;
          } else {
            // On track
            statusClass = 'status-on-track';
            statusMessage = `${status.remaining} more needed`;
          }

          return (
            <div key={player.id} className={`player-drive-status ${statusClass}`}>
              <div className="player-drive-header">
                <span className="player-name">{player.name}</span>
                <span className="drive-count">
                  <strong>{status.used}</strong> / {status.required}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="drive-progress-bar">
                <div
                  className="drive-progress-fill"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>

              {/* Status Message */}
              <div className="status-message">
                {statusIcon}
                <span>{statusMessage}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Warning */}
      {players.some(p => {
        const status = driveTracker.getPlayerStatus(p.id, currentHole + 1);
        return status.warning;
      }) && (
        <div className="overall-warning">
          <ExclamationTriangleIcon className="warning-icon" />
          <div className="warning-text">
            <strong>Warning:</strong> Some players are behind on drive requirements!
          </div>
        </div>
      )}
    </div>
  );
}

export default DriveTrackerPanel;
