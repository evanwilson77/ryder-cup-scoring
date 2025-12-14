import React from 'react';
import PropTypes from 'prop-types';
import './ScoringHeader.css';

/**
 * Scoring Header Component
 * Displays match information, status, and tournament standings
 */
function ScoringHeader({
  match,
  tournament,
  matchStatus,
  team1,
  team2,
  team1Points,
  team2Points,
  team1Projected,
  team2Projected,
  isIndividualTournament,
  onBack
}) {
  return (
    <div className="card">
      <div className="scoring-header">
        <button className="button secondary small" onClick={onBack}>
          ← Back to {tournament ? 'Tournament' : 'Matches'}
        </button>
        <div className="header-content">
          <div className="match-info">
            <h2>{match.name}</h2>
            <div className="match-status">
              <span className="format-badge">{match.format}</span>
              <span className="status-text">{matchStatus.status}</span>
            </div>
          </div>
          {!isIndividualTournament && (
            <div className="header-leaderboard">
              <h4>Tournament Standings</h4>
              <div className="mini-score-display">
                <div className="mini-team-score" style={{ backgroundColor: team1?.color }}>
                  <div className="mini-team-name">{team1?.name || 'Team 1'}</div>
                  <div className="mini-team-points">
                    {team1Points}
                    {team1Projected !== team1Points && (
                      <span className="mini-provisional"> ({team1Projected})</span>
                    )}
                  </div>
                </div>
                <div className="mini-score-divider">-</div>
                <div className="mini-team-score" style={{ backgroundColor: team2?.color }}>
                  <div className="mini-team-name">{team2?.name || 'Team 2'}</div>
                  <div className="mini-team-points">
                    {team2Points}
                    {team2Projected !== team2Points && (
                      <span className="mini-provisional"> ({team2Projected})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {isIndividualTournament && (
            <div className="header-leaderboard">
              <div className="friendly-match-badge">
                <span className="badge-icon">🤝</span>
                <span className="badge-text">Friendly Match</span>
              </div>
              <p className="friendly-match-note">This match does not count towards tournament standings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ScoringHeader.propTypes = {
  /** Match object */
  match: PropTypes.shape({
    name: PropTypes.string.isRequired,
    format: PropTypes.string.isRequired
  }).isRequired,
  /** Tournament object */
  tournament: PropTypes.object,
  /** Match status object */
  matchStatus: PropTypes.shape({
    status: PropTypes.string.isRequired
  }).isRequired,
  /** Team 1 object */
  team1: PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string
  }),
  /** Team 2 object */
  team2: PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string
  }),
  /** Team 1 current points */
  team1Points: PropTypes.number.isRequired,
  /** Team 2 current points */
  team2Points: PropTypes.number.isRequired,
  /** Team 1 projected points */
  team1Projected: PropTypes.number.isRequired,
  /** Team 2 projected points */
  team2Projected: PropTypes.number.isRequired,
  /** Whether this is an individual tournament */
  isIndividualTournament: PropTypes.bool.isRequired,
  /** Callback when back button is clicked */
  onBack: PropTypes.func.isRequired
};

export default ScoringHeader;
