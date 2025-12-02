import React from 'react';
import './ScoreEntry.css';

/**
 * Reusable ScoreEntry component for inputting golf scores
 * Provides +/- buttons and manual input
 */
function ScoreEntry({
  value,
  onChange,
  onIncrement,
  onDecrement,
  label = 'Score',
  min = 1,
  max = 15,
  disabled = false,
  className = ''
}) {
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === '' || (parseInt(newValue) >= min && parseInt(newValue) <= max)) {
      onChange(newValue);
    }
  };

  return (
    <div className={`score-entry-widget ${className}`}>
      {label && <label className="score-entry-label">{label}</label>}
      <div className="score-entry-controls">
        <button
          className="score-entry-button decrement"
          onClick={onDecrement}
          disabled={disabled}
          type="button"
        >
          -
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          className="score-entry-input"
          disabled={disabled}
        />
        <button
          className="score-entry-button increment"
          onClick={onIncrement}
          disabled={disabled}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default ScoreEntry;
