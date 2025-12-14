import React from 'react';
import PropTypes from 'prop-types';
import './LeaderboardSummary.css';

/**
 * Reusable leaderboard summary component
 * Displays top players in a round with current player always visible
 *
 * @param {Array} scorecards - Array of scorecard objects with totals
 * @param {Array} players - Array of player objects
 * @param {string} currentScorecardId - ID of the current player's scorecard to highlight
 * @param {string} format - Scoring format: 'stableford', 'stroke', 'bestball'
 * @param {number} maxDisplay - Maximum number of players to show before truncating (default: 4 if > 6 players)
 * @param {string} className - Additional CSS classes
 */
function LeaderboardSummary({
  scorecards,
  players,
  currentScorecardId,
  format = 'stableford',
  maxDisplay,
  className = ''
}) {
  if (!scorecards || !players || scorecards.length === 0) {
    return null;
  }

  const getLeaderboard = () => {
    // Filter out scorecards with no scores
    const scoredCards = scorecards.filter(sc => {
      if (format === 'stableford') {
        return (sc.totalStableford || sc.totalPoints || 0) > 0;
      }
      return (sc.totalGross || sc.totalNet || 0) > 0;
    });

    // Map scorecards to leaderboard entries
    const leaderboard = scoredCards.map(sc => {
      const player = players.find(p => p.id === sc.playerId);

      return {
        id: sc.id,
        playerName: player?.name || 'Unknown',
        totalGross: sc.totalGross || 0,
        totalNet: sc.totalNet || 0,
        totalPoints: sc.totalStableford || sc.totalPoints || 0,
        holesCompleted: sc.holes?.filter(h => h.grossScore !== null).length || 0,
        isCurrentPlayer: sc.id === currentScorecardId
      };
    });

    // Sort based on format
    leaderboard.sort((a, b) => {
      if (format === 'stableford') {
        // Stableford: highest points first, then lowest net
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return a.totalNet - b.totalNet;
      } else {
        // Stroke play: lowest net first, then lowest gross
        if (a.totalNet !== b.totalNet) {
          return a.totalNet - b.totalNet;
        }
        return a.totalGross - b.totalGross;
      }
    });

    // Determine how many to display
    const displayLimit = maxDisplay || (leaderboard.length > 6 ? 4 : leaderboard.length);
    const topPlayers = leaderboard.slice(0, displayLimit);

    // Always include current player if not in top
    const currentPlayerIndex = leaderboard.findIndex(p => p.isCurrentPlayer);
    if (currentPlayerIndex >= displayLimit) {
      topPlayers.push(leaderboard[currentPlayerIndex]);
    }

    // Add position numbers
    return topPlayers.map(p => ({
      ...p,
      position: leaderboard.findIndex(lp => lp.id === p.id) + 1
    }));
  };

  const leaderboard = getLeaderboard();

  if (leaderboard.length === 0) {
    return null;
  }

  return (
    <div className={`leaderboard-summary card ${className}`}>
      <h4>Leaderboard</h4>
      <div className="leaderboard-list">
        {leaderboard.map((entry) => (
          <div
            key={entry.id}
            className={`leaderboard-entry ${entry.isCurrentPlayer ? 'current-player' : ''}`}
          >
            <div className="position">{entry.position}</div>
            <div className="player-info">
              <div className="player-name">{entry.playerName}</div>
              <div className="player-status">{entry.holesCompleted}/18 holes</div>
            </div>
            <div className="player-scores">
              {format === 'stableford' && (
                <>
                  <div className="score-item">
                    <span className="score-label">Pts:</span>
                    <span className="score-value points">{entry.totalPoints}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Net:</span>
                    <span className="score-value">{entry.totalNet || '-'}</span>
                  </div>
                </>
              )}
              {format === 'stroke' && (
                <>
                  <div className="score-item">
                    <span className="score-label">Net:</span>
                    <span className="score-value">{entry.totalNet || '-'}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Gross:</span>
                    <span className="score-value">{entry.totalGross || '-'}</span>
                  </div>
                </>
              )}
              {format === 'bestball' && (
                <div className="score-item">
                  <span className="score-label">Score:</span>
                  <span className="score-value">{entry.totalNet || entry.totalPoints || '-'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

LeaderboardSummary.propTypes = {
  /** Array of scorecard objects with totals */
  scorecards: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    playerId: PropTypes.string,
    totalGross: PropTypes.number,
    totalNet: PropTypes.number,
    totalStableford: PropTypes.number,
    totalPoints: PropTypes.number,
    holes: PropTypes.array
  })).isRequired,
  /** Array of player objects */
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })).isRequired,
  /** ID of the current player's scorecard to highlight */
  currentScorecardId: PropTypes.string,
  /** Scoring format: 'stableford', 'stroke', 'bestball' */
  format: PropTypes.oneOf(['stableford', 'stroke', 'bestball']),
  /** Maximum number of players to show before truncating */
  maxDisplay: PropTypes.number,
  /** Additional CSS class names */
  className: PropTypes.string
};

export default LeaderboardSummary;
