/**
 * Handicap utility functions with decimal support
 * Supports 1 decimal place (e.g., 12.5, 9.0, 15.3)
 */

/**
 * Format handicap to 1 decimal place
 * @param {number} handicap - Handicap value
 * @returns {string} Formatted handicap (e.g., "12.5")
 */
export const formatHandicap = (handicap) => {
  if (handicap === null || handicap === undefined) return '0.0';
  return parseFloat(handicap).toFixed(1);
};

/**
 * Validate handicap value
 * @param {number|string} handicap - Handicap to validate
 * @returns {boolean} True if valid
 */
export const validateHandicap = (handicap) => {
  const num = parseFloat(handicap);
  if (isNaN(num)) return false;
  if (num < 0 || num > 54) return false;
  return true;
};

/**
 * Parse handicap input to decimal number
 * @param {string|number} input - Handicap input
 * @returns {number} Parsed handicap
 */
export const parseHandicap = (input) => {
  const num = parseFloat(input);
  if (isNaN(num)) return 0.0;
  return Math.round(num * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate strokes received on a hole based on handicap and stroke index
 * @param {number} handicap - Player's course handicap (e.g., 12.5)
 * @param {number} holeStrokeIndex - Hole's stroke index (1-18)
 * @returns {number} Number of strokes received (0, 1, 2, or 3)
 */
export const calculateStrokesReceived = (handicap, holeStrokeIndex) => {
  const fullStrokes = Math.floor(handicap);

  let strokes = 0;

  // First 18 strokes
  if (holeStrokeIndex <= fullStrokes) {
    strokes = 1;
  }

  // Second 18 strokes (for handicaps > 18)
  if (holeStrokeIndex <= (fullStrokes - 18)) {
    strokes = 2;
  }

  // Third 18 strokes (for handicaps > 36)
  if (holeStrokeIndex <= (fullStrokes - 36)) {
    strokes = 3;
  }

  return strokes;
};

/**
 * Calculate net score for a hole
 * @param {number} grossScore - Actual strokes taken
 * @param {number} handicap - Player's course handicap
 * @param {number} holeStrokeIndex - Hole's stroke index
 * @returns {number} Net score after handicap adjustment
 */
export const calculateNetScore = (grossScore, handicap, holeStrokeIndex) => {
  if (!grossScore || grossScore === 0) return null;

  const strokesReceived = calculateStrokesReceived(handicap, holeStrokeIndex);
  return grossScore - strokesReceived;
};

/**
 * Calculate Stableford points for a hole
 * @param {number} grossScore - Actual strokes taken
 * @param {number} holePar - Par for the hole
 * @param {number} holeStrokeIndex - Hole's stroke index (1-18)
 * @param {number} playerHandicap - Player's course handicap (decimal)
 * @returns {number} Stableford points (0-5)
 */
export const calculateStablefordPoints = (grossScore, holePar, holeStrokeIndex, playerHandicap) => {
  if (!grossScore || grossScore === 0) return 0;

  const netScore = calculateNetScore(grossScore, playerHandicap, holeStrokeIndex);
  if (netScore === null) return 0;

  // Calculate points based on net score vs par
  const scoreDiff = holePar - netScore;

  if (scoreDiff >= 3) return 5;  // Albatross or better (3+ under)
  if (scoreDiff === 2) return 4; // Eagle (2 under)
  if (scoreDiff === 1) return 3; // Birdie (1 under)
  if (scoreDiff === 0) return 2; // Par
  if (scoreDiff === -1) return 1; // Bogey (1 over)
  return 0; // Double bogey or worse (2+ over)
};

/**
 * Calculate team handicap for scramble using USGA method
 * @param {number[]} handicaps - Array of player handicaps
 * @param {string} method - 'usga', 'ambrose', 'percentage', or 'none'
 * @param {number[]} customPercentages - For custom method (optional)
 * @returns {number} Team handicap
 */
export const calculateScrambleTeamHandicap = (handicaps, method = 'usga', customPercentages = null) => {
  if (method === 'none') return 0;

  const teamSize = handicaps.length;
  const sortedHandicaps = [...handicaps].sort((a, b) => a - b);

  let teamHandicap = 0;

  switch (method) {
    case 'usga': {
      const usgaPercentages = {
        2: [0.35, 0.15],
        3: [0.20, 0.15, 0.10],
        4: [0.20, 0.15, 0.10, 0.05]
      };

      const percentages = usgaPercentages[teamSize];
      if (!percentages) return 0;

      sortedHandicaps.forEach((hcp, idx) => {
        teamHandicap += hcp * percentages[idx];
      });
      break;
    }

    case 'ambrose': {
      const divisor = teamSize * 2;
      teamHandicap = sortedHandicaps.reduce((sum, hcp) => sum + hcp, 0) / divisor;
      break;
    }

    case 'percentage': {
      if (customPercentages && customPercentages.length === teamSize) {
        sortedHandicaps.forEach((hcp, idx) => {
          teamHandicap += hcp * (customPercentages[idx] / 100);
        });
      }
      break;
    }

    default:
      return 0;
  }

  // Round to 1 decimal place
  return Math.round(teamHandicap * 10) / 10;
};

/**
 * Calculate team Stableford score for a hole (best ball)
 * @param {Object[]} playerScores - Array of {gross, handicap} for each player
 * @param {number} holePar - Par for the hole
 * @param {number} holeStrokeIndex - Hole's stroke index
 * @returns {Object} {teamPoints, playerPoints: []}
 */
export const calculateTeamStablefordHole = (playerScores, holePar, holeStrokeIndex) => {
  const playerPoints = playerScores.map(({ gross, handicap }) => {
    return calculateStablefordPoints(gross, holePar, holeStrokeIndex, handicap);
  });

  const teamPoints = Math.max(...playerPoints);

  return {
    teamPoints,
    playerPoints
  };
};
