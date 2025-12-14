import React from 'react';
import PropTypes from 'prop-types';
import './QuickScoreButtons.css';

/**
 * Quick score button grid component
 * Displays numbered buttons for rapid score entry
 *
 * @param {Function} onSelect - Callback when score is selected (score) => void
 * @param {number} selectedScore - Currently selected score
 * @param {number} min - Minimum score to display (default: 1)
 * @param {number} max - Maximum score to display (default: 12)
 * @param {string} title - Optional title for the section
 * @param {string} className - Additional CSS classes
 */
function QuickScoreButtons({
  onSelect,
  selectedScore,
  min = 1,
  max = 12,
  title,
  className = ''
}) {
  const scores = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className={`quick-score-section ${className}`}>
      {title && <h3>{title}</h3>}
      <div className="quick-score-buttons">
        {scores.map(score => (
          <button
            key={score}
            onClick={() => onSelect(score)}
            className={`quick-score-btn ${selectedScore === score ? 'selected' : ''}`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

QuickScoreButtons.propTypes = {
  /** Callback when score is selected */
  onSelect: PropTypes.func.isRequired,
  /** Currently selected score */
  selectedScore: PropTypes.number,
  /** Minimum score to display */
  min: PropTypes.number,
  /** Maximum score to display */
  max: PropTypes.number,
  /** Optional title for the section */
  title: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string
};

export default QuickScoreButtons;
