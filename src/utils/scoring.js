// Match play scoring utilities

/**
 * Calculate match status and score differential
 * Returns the number of holes up and holes remaining
 */
export const calculateMatchStatus = (holeScores, currentHole = 18, team1Name = 'Team 1', team2Name = 'Team 2') => {
  let team1Up = 0;
  let holesPlayed = 0;

  // Count hole wins for each side
  for (let i = 0; i < currentHole && i < holeScores.length; i++) {
    const hole = holeScores[i];
    if (hole && hole.winner) {
      holesPlayed++;
      if (hole.winner === 'team1') {
        team1Up++;
      } else if (hole.winner === 'team2') {
        team1Up--;
      }
    }
  }

  const holesRemaining = 18 - holesPlayed;
  const isComplete = holesPlayed === 18 || Math.abs(team1Up) > holesRemaining;

  return {
    team1Up,
    holesPlayed,
    holesRemaining,
    isComplete,
    status: getMatchStatusText(team1Up, holesRemaining, isComplete, team1Name, team2Name)
  };
};

/**
 * Get match status text (e.g., "2 UP", "3&2", "AS")
 */
export const getMatchStatusText = (differential, holesRemaining, isComplete, team1Name = 'Team 1', team2Name = 'Team 2') => {
  if (differential === 0) {
    return isComplete ? 'AS' : 'AS'; // All Square
  }

  const absDiff = Math.abs(differential);
  const leader = differential > 0 ? team1Name : team2Name;

  if (isComplete && holesRemaining > 0) {
    // Match ended early (e.g., "3&2" means 3 up with 2 to play)
    return `${leader} ${absDiff}&${holesRemaining}`;
  } else if (isComplete) {
    // Match went to 18th hole
    return `${leader} ${absDiff} UP`;
  } else {
    // Match in progress
    return `${leader} ${absDiff} UP`;
  }
};

/**
 * Calculate net score for a hole based on handicap
 * @param {number} grossScore - Actual strokes taken
 * @param {number} playerHandicap - Player's course handicap
 * @param {number} holeStrokeIndex - Hole's stroke index (1-18)
 * @returns {number} Net score after handicap adjustment
 */
export const calculateNetScore = (grossScore, playerHandicap, holeStrokeIndex) => {
  if (!grossScore || grossScore === 0) return null;

  // Player gets a stroke on holes where stroke index <= their handicap
  const strokesReceived = holeStrokeIndex <= playerHandicap ? 1 : 0;
  return grossScore - strokesReceived;
};

/**
 * Determine hole winner for different match formats
 */
export const determineHoleWinner = (format, scores, hole) => {
  if (!scores || !hole) return null;

  switch (format) {
    case 'singles':
      return determineSinglesWinner(scores, hole);
    case 'foursomes':
      return determineFoursomesWinner(scores, hole);
    case 'fourball':
      return determineFourballWinner(scores, hole);
    default:
      return null;
  }
};

/**
 * Singles format: 1v1, compare net scores
 */
const determineSinglesWinner = (scores, hole) => {
  const { team1Player1, team2Player1 } = scores;

  if (!team1Player1 || !team2Player1) return null;

  const p1Net = team1Player1;
  const p2Net = team2Player1;

  if (p1Net < p2Net) return 'team1';
  if (p2Net < p1Net) return 'team2';
  return 'halved';
};

/**
 * Foursomes format: 2v2 alternate shot, one score per team
 */
const determineFoursomesWinner = (scores, hole) => {
  const { team1Score, team2Score } = scores;

  if (!team1Score || !team2Score) return null;

  if (team1Score < team2Score) return 'team1';
  if (team2Score < team1Score) return 'team2';
  return 'halved';
};

/**
 * Four-ball format: 2v2 best ball, best net score per team
 */
const determineFourballWinner = (scores, hole) => {
  const { team1Player1, team1Player2, team2Player1, team2Player2 } = scores;

  // Get best score for each team (lowest net score)
  const team1Scores = [team1Player1, team1Player2].filter(s => s);
  const team2Scores = [team2Player1, team2Player2].filter(s => s);

  if (team1Scores.length === 0 || team2Scores.length === 0) return null;

  const team1Best = Math.min(...team1Scores);
  const team2Best = Math.min(...team2Scores);

  if (team1Best < team2Best) return 'team1';
  if (team2Best < team1Best) return 'team2';
  return 'halved';
};

/**
 * Calculate total tournament points
 * Win = 1 point, Halved = 0.5 points each
 */
export const calculateTournamentPoints = (matches) => {
  let team1Points = 0;
  let team2Points = 0;

  matches.forEach(match => {
    if (!match.result) return;

    if (match.result === 'team1_win') {
      team1Points += 1;
    } else if (match.result === 'team2_win') {
      team2Points += 1;
    } else if (match.result === 'halved') {
      team1Points += 0.5;
      team2Points += 0.5;
    }
  });

  return { team1Points, team2Points };
};

/**
 * Get match result from hole scores
 */
export const getMatchResult = (holeScores) => {
  const status = calculateMatchStatus(holeScores);

  if (!status.isComplete) {
    return null;
  }

  if (status.team1Up > 0) {
    return 'team1_win';
  } else if (status.team1Up < 0) {
    return 'team2_win';
  } else {
    return 'halved';
  }
};

/**
 * Get provisional match result from hole scores (for in-progress matches)
 * Returns who would win if the match ended now
 */
export const getProvisionalResult = (holeScores) => {
  const status = calculateMatchStatus(holeScores);

  if (status.team1Up > 0) {
    return 'team1_win';
  } else if (status.team1Up < 0) {
    return 'team2_win';
  } else {
    return 'halved';
  }
};
