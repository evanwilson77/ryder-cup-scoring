import React from 'react';
import PropTypes from 'prop-types';
import './MyScorecardsSection.css';

/**
 * My Scorecards section component
 * Displays a player's scorecards with active scorecard highlighted
 */
function MyScorecardsSection({ scorecards, onNavigateToScorecard, getHolesCompleted }) {
  if (!scorecards || scorecards.length === 0) return null;

  const activeScorecard = scorecards.find(sc => sc.scorecard.status === 'in_progress');

  return (
    <div className="card my-scorecards-section">
      <h2>My Scorecards</h2>

      {/* Active Scorecard (Priority) */}
      {activeScorecard && (
        <div
          className="quick-action-card active-scorecard"
          onClick={() => onNavigateToScorecard(activeScorecard)}
        >
          <div className="action-badge">Active</div>
          <div className="action-icon">⛳</div>
          <div className="action-content">
            <div className="action-title">
              {activeScorecard.round.name}
            </div>
            <div className="action-subtitle">
              {activeScorecard.type === 'team'
                ? `${activeScorecard.team.name} • ${getHolesCompleted(activeScorecard.scorecard)}/18`
                : `${getHolesCompleted(activeScorecard.scorecard)}/18 holes`
              }
            </div>
            {activeScorecard.type === 'match' && activeScorecard.scorecard.result && (
              <div className="action-meta">
                {activeScorecard.scorecard.result}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Scorecards List */}
      <div className="my-scorecards-list">
        {scorecards
          .filter(sc => sc !== activeScorecard) // Don't duplicate active
          .map((scorecardData) => {
            const { round, scorecard, type, team } = scorecardData;
            const isCompleted = scorecard.status === 'completed';
            // Create unique key combining round id and team/player info
            const uniqueKey = type === 'team'
              ? `${round.id}-${team?.id}-team`
              : `${round.id}-individual`;

            return (
              <div
                key={uniqueKey}
                className={`scorecard-item ${isCompleted ? 'completed' : ''}`}
                onClick={() => onNavigateToScorecard(scorecardData)}
              >
                <div className="scorecard-item-header">
                  <span className="round-name">{round.name}</span>
                  <span className={`status-badge status-badge-${scorecard.status}`}>
                    {isCompleted ? '✓' : `${getHolesCompleted(scorecard)}/18`}
                  </span>
                </div>

                <div className="scorecard-item-details">
                  {type === 'team' && (
                    <>
                      <span className="team-indicator">
                        <span
                          className="team-dot"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </span>
                      <span className="format-badge">{round.format.replace(/_/g, ' ')}</span>
                    </>
                  )}

                  {type === 'individual' && (
                    <>
                      <span className="individual-indicator">Individual</span>
                      <span className="format-badge">{round.format.replace(/_/g, ' ')}</span>
                    </>
                  )}

                  {type === 'match' && (
                    <>
                      <span className="match-indicator">Match Play</span>
                      {scorecard.result && (
                        <span className="match-result">{scorecard.result}</span>
                      )}
                    </>
                  )}
                </div>

                {isCompleted && scorecard.totalNet && (
                  <div className="scorecard-item-score">
                    Net: {scorecard.totalNet}
                    {scorecard.totalPoints && ` • ${scorecard.totalPoints} pts`}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

MyScorecardsSection.propTypes = {
  /** Array of scorecard data objects */
  scorecards: PropTypes.arrayOf(
    PropTypes.shape({
      round: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        format: PropTypes.string.isRequired
      }).isRequired,
      scorecard: PropTypes.shape({
        status: PropTypes.string.isRequired,
        totalNet: PropTypes.number,
        totalPoints: PropTypes.number,
        result: PropTypes.string
      }).isRequired,
      type: PropTypes.oneOf(['team', 'individual', 'match']).isRequired,
      team: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        color: PropTypes.string
      })
    })
  ),
  /** Callback when scorecard is clicked */
  onNavigateToScorecard: PropTypes.func.isRequired,
  /** Helper function to calculate holes completed */
  getHolesCompleted: PropTypes.func.isRequired
};

export default MyScorecardsSection;
