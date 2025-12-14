/**
 * Utility functions for calculating player and tournament statistics
 */

/**
 * Calculate player statistics from all tournaments
 * @param {string} playerId - Player ID
 * @param {Array} tournaments - Array of tournament objects
 * @param {Array} players - Array of player objects
 * @returns {Object} Player statistics
 */
export const calculatePlayerStatistics = (playerId, tournaments, players) => {
  const player = players.find(p => p.id === playerId);
  if (!player) return null;

  let totalRounds = 0;
  let completedRounds = 0;
  let totalGross = 0;
  let totalNet = 0;
  let totalPoints = 0;
  let bestGross = Infinity;
  let bestNet = Infinity;
  let worstGross = -Infinity;
  let eagles = 0;
  let birdies = 0;
  let pars = 0;
  let bogeys = 0;
  let doublePlus = 0;

  tournaments.forEach(tournament => {
    tournament.rounds?.forEach(round => {
      // Individual scorecards
      const scorecard = round.scorecards?.find(sc => sc.playerId === playerId);
      if (scorecard) {
        totalRounds++;
        if (scorecard.status === 'completed') {
          completedRounds++;
          totalGross += scorecard.totalGross || 0;
          totalNet += scorecard.totalNet || 0;
          
          if (round.scoringFormat === 'stableford') {
            totalPoints += scorecard.totalPoints || 0;
          }

          // Track best/worst
          if (scorecard.totalGross < bestGross) bestGross = scorecard.totalGross;
          if (scorecard.totalNet < bestNet) bestNet = scorecard.totalNet;
          if (scorecard.totalGross > worstGross) worstGross = scorecard.totalGross;

          // Count score types
          scorecard.holes?.forEach((hole, idx) => {
            const holePar = round.courseData?.holes?.[idx]?.par;
            if (!holePar || !hole.grossScore) return;

            const diff = hole.grossScore - holePar;
            if (diff <= -2) eagles++;
            else if (diff === -1) birdies++;
            else if (diff === 0) pars++;
            else if (diff === 1) bogeys++;
            else if (diff >= 2) doublePlus++;
          });
        }
      }
    });
  });

  return {
    player,
    totalRounds,
    completedRounds,
    averageGross: completedRounds > 0 ? (totalGross / completedRounds).toFixed(1) : 0,
    averageNet: completedRounds > 0 ? (totalNet / completedRounds).toFixed(1) : 0,
    averagePoints: completedRounds > 0 ? (totalPoints / completedRounds).toFixed(1) : 0,
    bestGross: bestGross !== Infinity ? bestGross : null,
    bestNet: bestNet !== Infinity ? bestNet : null,
    worstGross: worstGross !== -Infinity ? worstGross : null,
    eagles,
    birdies,
    pars,
    bogeys,
    doublePlus,
    currentHandicap: player.handicap || 0
  };
};

/**
 * Calculate tournament analytics
 * @param {Object} tournament - Tournament object
 * @returns {Object} Tournament analytics
 */
export const calculateTournamentAnalytics = (tournament) => {
  const analytics = {
    totalPlayers: 0,
    totalRounds: tournament.rounds?.length || 0,
    completedRounds: 0,
    averageScorePerRound: [],
    hardestHoles: [],
    easiestHoles: [],
    scoringDistribution: {
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doublePlus: 0
    }
  };

  // Track unique players
  const uniquePlayers = new Set();

  tournament.rounds?.forEach(round => {
    if (round.status === 'completed') analytics.completedRounds++;

    // Analyze individual scorecards
    round.scorecards?.forEach(scorecard => {
      uniquePlayers.add(scorecard.playerId);
      
      if (scorecard.status === 'completed') {
        // Count score types
        scorecard.holes?.forEach((hole, idx) => {
          const holePar = round.courseData?.holes?.[idx]?.par;
          if (!holePar || !hole.grossScore) return;

          const diff = hole.grossScore - holePar;
          if (diff <= -2) analytics.scoringDistribution.eagles++;
          else if (diff === -1) analytics.scoringDistribution.birdies++;
          else if (diff === 0) analytics.scoringDistribution.pars++;
          else if (diff === 1) analytics.scoringDistribution.bogeys++;
          else if (diff >= 2) analytics.scoringDistribution.doublePlus++;
        });
      }
    });

    // Analyze team scorecards
    round.teamScorecards?.forEach(scorecard => {
      scorecard.players?.forEach(playerId => uniquePlayers.add(playerId));
    });
  });

  analytics.totalPlayers = uniquePlayers.size;

  return analytics;
};

/**
 * Calculate hole difficulty from a tournament
 * @param {Object} tournament - Tournament object
 * @returns {Array} Hole difficulty data (sorted from hardest to easiest)
 */
export const calculateHoleDifficulty = (tournament) => {
  const holeDifficulty = Array(18).fill(null).map((_, idx) => ({
    holeNumber: idx + 1,
    totalStrokes: 0,
    totalPar: 0,
    rounds: 0
  }));

  tournament.rounds?.forEach(round => {
    round.scorecards?.forEach(scorecard => {
      if (scorecard.status !== 'completed') return;

      scorecard.holes?.forEach((hole, idx) => {
        if (!hole.grossScore) return;
        const holePar = round.courseData?.holes?.[idx]?.par;
        if (!holePar) return;

        holeDifficulty[idx].totalStrokes += hole.grossScore;
        holeDifficulty[idx].totalPar += holePar;
        holeDifficulty[idx].rounds++;
      });
    });
  });

  // Calculate average and sort by difficulty
  return holeDifficulty
    .map(hole => ({
      ...hole,
      averageScore: hole.rounds > 0 ? (hole.totalStrokes / hole.rounds).toFixed(2) : 0,
      averagePar: hole.rounds > 0 ? (hole.totalPar / hole.rounds).toFixed(1) : 0,
      difficulty: hole.rounds > 0 ? (hole.totalStrokes / hole.rounds) - (hole.totalPar / hole.rounds) : 0
    }))
    .sort((a, b) => b.difficulty - a.difficulty);
};
