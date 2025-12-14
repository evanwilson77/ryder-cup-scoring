import React from 'react';
import PropTypes from 'prop-types';
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

ScoreEntry.propTypes = {
  /** Current score value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback when score changes via input */
  onChange: PropTypes.func.isRequired,
  /** Callback when + button clicked */
  onIncrement: PropTypes.func.isRequired,
  /** Callback when - button clicked */
  onDecrement: PropTypes.func.isRequired,
  /** Label text to display above the score entry */
  label: PropTypes.string,
  /** Minimum allowed score value */
  min: PropTypes.number,
  /** Maximum allowed score value */
  max: PropTypes.number,
  /** Whether the score entry is disabled */
  disabled: PropTypes.bool,
  /** Additional CSS class names */
  className: PropTypes.string
};

export default ScoreEntry;
