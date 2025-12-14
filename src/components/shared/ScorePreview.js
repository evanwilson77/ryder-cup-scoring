import React from 'react';
import PropTypes from 'prop-types';
import './ScorePreview.css';

/**
 * Score preview component
 * Displays gross, net, points breakdown for a score entry
 *
 * @param {number} grossScore - Gross score
 * @param {number} netScore - Net score (after handicap)
 * @param {number} points - Stableford points (optional)
 * @param {number} par - Hole par (optional, for vs par display)
 * @param {string} format - Scoring format: 'stroke' or 'stableford'
 * @param {string} className - Additional CSS classes
 */
function ScorePreview({
  grossScore,
  netScore,
  points,
  par,
  format = 'stroke',
  className = ''
}) {
  if (!grossScore && grossScore !== 0) {
    return null;
  }

  const getVsParText = () => {
    if (!par || netScore === undefined || netScore === null) return null;

    if (netScore === par) return 'Par';
    if (netScore < par) return `${par - netScore} under`;
    return `${netScore - par} over`;
  };

  const getVsParClass = () => {
    if (!par || netScore === undefined || netScore === null) return '';

    if (netScore === par) return 'even-par';
    if (netScore < par) return 'under-par';
    return 'over-par';
  };

  const vsParText = getVsParText();

  return (
    <div className={`score-preview ${className}`}>
      {grossScore !== undefined && grossScore !== null && (
        <div className="preview-item">
          <span className="label">Gross:</span>
          <span className="value">{grossScore}</span>
        </div>
      )}

      {netScore !== undefined && netScore !== null && (
        <div className="preview-item">
          <span className="label">Net:</span>
          <span className="value">{netScore}</span>
        </div>
      )}

      {format === 'stableford' && points !== undefined && points !== null && (
        <div className="preview-item">
          <span className="label">Points:</span>
          <span className="value stableford">{points}</span>
        </div>
      )}

      {vsParText && (
        <div className="preview-item">
          <span className="label">vs Par:</span>
          <span className={`value ${getVsParClass()}`}>{vsParText}</span>
        </div>
      )}
    </div>
  );
}

ScorePreview.propTypes = {
  /** Gross score */
  grossScore: PropTypes.number,
  /** Net score (after handicap) */
  netScore: PropTypes.number,
  /** Stableford points (optional) */
  points: PropTypes.number,
  /** Hole par (optional, for vs par display) */
  par: PropTypes.number,
  /** Scoring format: 'stroke' or 'stableford' */
  format: PropTypes.oneOf(['stroke', 'stableford']),
  /** Additional CSS class names */
  className: PropTypes.string
};

export default ScorePreview;
