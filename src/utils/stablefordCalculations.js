/**
 * Stableford Scoring Calculations
 *
 * Implements proper Stableford scoring with stroke index allocation
 * and net score calculation based on player handicap.
 */

/**
 * Calculate strokes received on a specific hole based on player handicap and stroke index
 *
 * @param {number} playerHandicap - Player's course handicap (can be decimal, e.g., 12.5)
 * @param {number} holeStrokeIndex - Hole's stroke index (1-18, where 1 is hardest)
 * @returns {number} Number of strokes received on this hole (0, 1, or 2)
 *
 * Examples:
 * - HCP 12 gets 1 stroke on holes with SI 1-12
 * - HCP 23 gets 2 strokes on SI 1-5, 1 stroke on SI 6-18
 * - HCP 5.4 rounds to 5, gets 1 stroke on SI 1-5
 */
export const calculateStrokesReceived = (playerHandicap, holeStrokeIndex) => {
  // Round handicap to nearest integer using standard rounding
  const roundedHandicap = Math.round(playerHandicap);

  // Handle negative handicaps (scratch or better players)
  if (roundedHandicap <= 0) {
    return 0;
  }

  // Player receives strokes based on stroke index
  if (roundedHandicap >= 18) {
    // Handicap 18+: At least 1 stroke on every hole, possibly 2 on harder holes
    const extraStrokes = roundedHandicap - 18;
    if (holeStrokeIndex <= extraStrokes) {
      return 2; // 2 strokes on holes with SI <= (handicap - 18)
    }
    return 1; // 1 stroke on all other holes
  } else {
    // Handicap 1-17: 1 stroke on holes with SI <= handicap
    return holeStrokeIndex <= roundedHandicap ? 1 : 0;
  }
};

/**
 * Calculate net score for a hole
 *
 * @param {number} grossScore - Player's actual strokes on the hole
 * @param {number} strokesReceived - Strokes received on this hole (from calculateStrokesReceived)
 * @returns {number} Net score after handicap adjustment
 */
export const calculateNetScore = (grossScore, strokesReceived) => {
  return grossScore - strokesReceived;
};

/**
 * Calculate Stableford points based on net score vs par
 *
 * Stableford Points System:
 * - 3+ under par: 5 points (Albatross or better)
 * - 2 under par: 4 points (Eagle)
 * - 1 under par: 3 points (Birdie)
 * - Par: 2 points
 * - 1 over par: 1 point (Bogey)
 * - 2+ over par: 0 points (Double bogey or worse)
 *
 * @param {number} netScore - Net score on the hole
 * @param {number} holePar - Par for the hole
 * @returns {number} Stableford points (0-5)
 */
export const calculateStablefordPoints = (netScore, holePar) => {
  const scoreDiff = netScore - holePar;

  if (scoreDiff <= -3) return 5; // 3+ under par
  if (scoreDiff === -2) return 4; // Eagle
  if (scoreDiff === -1) return 3; // Birdie
  if (scoreDiff === 0) return 2;  // Par
  if (scoreDiff === 1) return 1;  // Bogey
  return 0; // Double bogey or worse
};

/**
 * Calculate complete hole score with Stableford points
 *
 * @param {Object} params
 * @param {number} params.grossScore - Player's actual strokes
 * @param {number} params.holePar - Par for the hole
 * @param {number} params.holeStrokeIndex - Stroke index (1-18)
 * @param {number} params.playerHandicap - Player's handicap
 * @returns {Object} Complete scoring details
 */
export const calculateHoleScore = ({ grossScore, holePar, holeStrokeIndex, playerHandicap }) => {
  const strokesReceived = calculateStrokesReceived(playerHandicap, holeStrokeIndex);
  const netScore = calculateNetScore(grossScore, strokesReceived);
  const points = calculateStablefordPoints(netScore, holePar);

  return {
    grossScore,
    strokesReceived,
    netScore,
    points,
    scoreToPar: netScore - holePar // For display purposes
  };
};

/**
 * Calculate total Stableford score for a complete round
 *
 * @param {Array} holes - Array of hole scores with gross scores
 * @param {Array} courseHoles - Array of hole data with par and strokeIndex
 * @param {number} playerHandicap - Player's handicap
 * @returns {Object} Complete round scoring
 */
export const calculateRoundScore = (holes, courseHoles, playerHandicap) => {
  let totalGross = 0;
  let totalNet = 0;
  let totalPoints = 0;
  let holesCompleted = 0;

  const holesWithScores = holes.map((hole, index) => {
    const courseHole = courseHoles[index];

    // Skip holes without a gross score
    if (!hole.grossScore || hole.grossScore === 0) {
      return {
        holeNumber: courseHole.number,
        par: courseHole.par,
        strokeIndex: courseHole.strokeIndex,
        grossScore: null,
        netScore: null,
        strokesReceived: 0,
        points: 0,
        completed: false
      };
    }

    const holeScore = calculateHoleScore({
      grossScore: hole.grossScore,
      holePar: courseHole.par,
      holeStrokeIndex: courseHole.strokeIndex,
      playerHandicap
    });

    totalGross += holeScore.grossScore;
    totalNet += holeScore.netScore;
    totalPoints += holeScore.points;
    holesCompleted++;

    return {
      holeNumber: courseHole.number,
      par: courseHole.par,
      strokeIndex: courseHole.strokeIndex,
      ...holeScore,
      completed: true
    };
  });

  return {
    holesWithScores,
    totalGross,
    totalNet,
    totalPoints,
    holesCompleted,
    targetPoints: 36, // Playing to handicap = 36 points (2 per hole)
    pointsVsTarget: totalPoints - 36
  };
};

/**
 * Format score to par for display (e.g., "+2", "E", "-1")
 *
 * @param {number} scoreToPar - Score relative to par
 * @returns {string} Formatted string
 */
export const formatScoreToPar = (scoreToPar) => {
  if (scoreToPar === 0) return 'E';
  if (scoreToPar > 0) return `+${scoreToPar}`;
  return `${scoreToPar}`;
};

/**
 * Get score description (Albatross, Eagle, Birdie, etc.)
 *
 * @param {number} scoreToPar - Score relative to par
 * @returns {string} Score description
 */
export const getScoreDescription = (scoreToPar) => {
  if (scoreToPar <= -3) return 'Albatross';
  if (scoreToPar === -2) return 'Eagle';
  if (scoreToPar === -1) return 'Birdie';
  if (scoreToPar === 0) return 'Par';
  if (scoreToPar === 1) return 'Bogey';
  if (scoreToPar === 2) return 'Double Bogey';
  if (scoreToPar === 3) return 'Triple Bogey';
  return `+${scoreToPar}`;
};
