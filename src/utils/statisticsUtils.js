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

/**
 * Calculate par-specific performance statistics
 * @param {string} playerId - Player ID
 * @param {Array} tournaments - Array of tournament objects
 * @returns {Object} Par-specific statistics
 */
export const calculateParPerformance = (playerId, tournaments) => {
  const parStats = {
    par3: { totalScore: 0, holes: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doublePlus: 0 },
    par4: { totalScore: 0, holes: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doublePlus: 0 },
    par5: { totalScore: 0, holes: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doublePlus: 0 }
  };

  tournaments.forEach(tournament => {
    tournament.rounds?.forEach(round => {
      const scorecard = round.scorecards?.find(sc => sc.playerId === playerId);
      if (scorecard && scorecard.status === 'completed') {
        scorecard.holes?.forEach((hole, idx) => {
          const holePar = round.courseData?.holes?.[idx]?.par;
          if (!holePar || !hole.grossScore) return;

          const parKey = `par${holePar}`;
          if (!parStats[parKey]) return;

          parStats[parKey].totalScore += hole.grossScore;
          parStats[parKey].holes++;

          const diff = hole.grossScore - holePar;
          if (diff <= -2) parStats[parKey].eagles++;
          else if (diff === -1) parStats[parKey].birdies++;
          else if (diff === 0) parStats[parKey].pars++;
          else if (diff === 1) parStats[parKey].bogeys++;
          else if (diff >= 2) parStats[parKey].doublePlus++;
        });
      }
    });
  });

  return {
    par3: {
      ...parStats.par3,
      average: parStats.par3.holes > 0 ? (parStats.par3.totalScore / parStats.par3.holes).toFixed(2) : 0,
      birdieRate: parStats.par3.holes > 0 ? ((parStats.par3.birdies / parStats.par3.holes) * 100).toFixed(1) : 0,
      parRate: parStats.par3.holes > 0 ? ((parStats.par3.pars / parStats.par3.holes) * 100).toFixed(1) : 0
    },
    par4: {
      ...parStats.par4,
      average: parStats.par4.holes > 0 ? (parStats.par4.totalScore / parStats.par4.holes).toFixed(2) : 0,
      birdieRate: parStats.par4.holes > 0 ? ((parStats.par4.birdies / parStats.par4.holes) * 100).toFixed(1) : 0,
      parRate: parStats.par4.holes > 0 ? ((parStats.par4.pars / parStats.par4.holes) * 100).toFixed(1) : 0
    },
    par5: {
      ...parStats.par5,
      average: parStats.par5.holes > 0 ? (parStats.par5.totalScore / parStats.par5.holes).toFixed(2) : 0,
      eagleRate: parStats.par5.holes > 0 ? ((parStats.par5.eagles / parStats.par5.holes) * 100).toFixed(1) : 0,
      birdieRate: parStats.par5.holes > 0 ? ((parStats.par5.birdies / parStats.par5.holes) * 100).toFixed(1) : 0,
      parRate: parStats.par5.holes > 0 ? ((parStats.par5.pars / parStats.par5.holes) * 100).toFixed(1) : 0
    }
  };
};

/**
 * Calculate series-specific statistics
 * @param {string} playerId - Player ID
 * @param {Array} tournaments - Array of tournament objects
 * @param {Array} series - Array of series objects
 * @returns {Array} Series-specific statistics
 */
export const calculateSeriesStatistics = (playerId, tournaments, series) => {
  const seriesStats = {};

  // Initialize stats for each series
  series.forEach(s => {
    seriesStats[s.id] = {
      seriesId: s.id,
      seriesName: s.name,
      roundsPlayed: 0,
      roundsCompleted: 0,
      bestGross: Infinity,
      bestNet: Infinity,
      averageGross: 0,
      averageNet: 0,
      totalGross: 0,
      totalNet: 0,
      wins: 0,
      runnersUp: 0,
      thirdPlace: 0
    };
  });

  // Add "No Series" category
  seriesStats.none = {
    seriesId: 'none',
    seriesName: 'No Series',
    roundsPlayed: 0,
    roundsCompleted: 0,
    bestGross: Infinity,
    bestNet: Infinity,
    averageGross: 0,
    averageNet: 0,
    totalGross: 0,
    totalNet: 0,
    wins: 0,
    runnersUp: 0,
    thirdPlace: 0
  };

  tournaments.forEach(tournament => {
    const seriesId = tournament.seriesId || 'none';
    if (!seriesStats[seriesId]) return;

    const stats = seriesStats[seriesId];

    // Check for wins (simplified - would need proper leaderboard calculation)
    if (tournament.status === 'completed' && tournament.winner === playerId) {
      stats.wins++;
    }

    tournament.rounds?.forEach(round => {
      const scorecard = round.scorecards?.find(sc => sc.playerId === playerId);
      if (scorecard) {
        stats.roundsPlayed++;
        if (scorecard.status === 'completed') {
          stats.roundsCompleted++;
          stats.totalGross += scorecard.totalGross || 0;
          stats.totalNet += scorecard.totalNet || 0;

          if (scorecard.totalGross < stats.bestGross) {
            stats.bestGross = scorecard.totalGross;
          }
          if (scorecard.totalNet < stats.bestNet) {
            stats.bestNet = scorecard.totalNet;
          }
        }
      }
    });

    if (stats.roundsCompleted > 0) {
      stats.averageGross = (stats.totalGross / stats.roundsCompleted).toFixed(1);
      stats.averageNet = (stats.totalNet / stats.roundsCompleted).toFixed(1);
    }
  });

  // Convert to array and filter out series with no data
  return Object.values(seriesStats)
    .filter(stats => stats.roundsPlayed > 0)
    .map(stats => ({
      ...stats,
      bestGross: stats.bestGross !== Infinity ? stats.bestGross : null,
      bestNet: stats.bestNet !== Infinity ? stats.bestNet : null
    }))
    .sort((a, b) => b.roundsPlayed - a.roundsPlayed);
};
