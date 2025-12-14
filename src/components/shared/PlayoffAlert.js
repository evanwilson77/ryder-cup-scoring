import React from 'react';
import PropTypes from 'prop-types';
import { TrophyIcon } from '@heroicons/react/24/outline';
import './PlayoffAlert.css';

/**
 * Playoff alert banner component
 * Displays when players are tied and playoff is required
 */
function PlayoffAlert({ playoffData, onResolvePlayoff }) {
  if (!playoffData) return null;

  return (
    <div className="card playoff-alert">
      <TrophyIcon className="playoff-icon" />
      <div className="playoff-content">
        <h3>Playoff Required!</h3>
        <p>
          {playoffData.tiedPlayers.length} players are tied with {playoffData.topScore} points.
          A playoff is needed to determine the winner.
        </p>
      </div>
      <button onClick={onResolvePlayoff} className="button primary">
        Resolve Playoff
      </button>
    </div>
  );
}

PlayoffAlert.propTypes = {
  /** Playoff data with tiedPlayers and topScore */
  playoffData: PropTypes.shape({
    tiedPlayers: PropTypes.arrayOf(PropTypes.object).isRequired,
    topScore: PropTypes.number.isRequired
  }),
  /** Callback when resolve playoff button is clicked */
  onResolvePlayoff: PropTypes.func.isRequired
};

export default PlayoffAlert;
