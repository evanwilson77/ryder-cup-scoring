import React from 'react';
import PropTypes from 'prop-types';
import { TrophyIcon } from '@heroicons/react/24/outline';
import './WinnerBanner.css';

/**
 * Tournament winner banner component
 * Displays the tournament winner with trophy icon
 */
function WinnerBanner({ winner, winnerDetails = null }) {
  if (!winner) return null;

  return (
    <div className="card winner-banner">
      <TrophyIcon className="winner-trophy-icon" />
      <div className="winner-content">
        <div className="winner-label">Tournament Winner</div>
        <div className="winner-name">{winner}</div>
        {winnerDetails?.method && (
          <div className="winner-method">Resolved by: {winnerDetails.method}</div>
        )}
      </div>
    </div>
  );
}

WinnerBanner.propTypes = {
  /** Winner name */
  winner: PropTypes.string,
  /** Additional winner details */
  winnerDetails: PropTypes.shape({
    method: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string
  })
};

export default WinnerBanner;
