import React from 'react';
import ScoreEntry from './ScoreEntry';
import './PlayerScoreEntry.css';

/**
 * Player score entry component for team formats
 * Combines player info display with score entry
 *
 * @param {Object} player - Player object with name, handicap
 * @param {number} grossScore - Current gross score
 * @param {number} strokesReceived - Strokes received on this hole
 * @param {number} netScore - Calculated net score
 * @param {number} points - Stableford points (optional, for stableford format)
 * @param {Function} onChange - Callback when score changes
 * @param {Function} onIncrement - Callback for increment button
 * @param {Function} onDecrement - Callback for decrement button
 * @param {boolean} disabled - Whether score entry is disabled
 * @param {string} format - Scoring format: 'stroke' or 'stableford'
 * @param {string} className - Additional CSS classes
 */
function PlayerScoreEntry({
  player,
  grossScore,
  strokesReceived = 0,
  netScore,
  points,
  onChange,
  onIncrement,
  onDecrement,
  disabled = false,
  format = 'stroke',
  className = ''
}) {
  return (
    <div className={`player-score-entry ${className}`}>
      <div className="player-header">
        <span className="player-name">{player.name}</span>
        <span className="player-handicap">HCP {player.handicap?.toFixed(1) || '0.0'}</span>
        {strokesReceived > 0 && (
          <span className="strokes-badge">
            {strokesReceived} stroke{strokesReceived > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ScoreEntry
        value={grossScore || ''}
        onChange={onChange}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        label="Gross Score"
        min={1}
        max={15}
        disabled={disabled}
      />

      {grossScore && (
        <div className="player-score-summary">
          <span>Gross: {grossScore}</span>
          <span>Net: {netScore}</span>
          {format === 'stableford' && points !== null && points !== undefined && (
            <span>Points: {points}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerScoreEntry;
