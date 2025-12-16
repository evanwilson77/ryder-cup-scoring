/**
 * Scramble/Ambrose calculation utilities
 * Handles team handicap calculation and drive requirement tracking
 */

/**
 * Calculate team handicap for scramble format
 * @param {Array<number>} playerHandicaps - Array of player course handicaps
 * @param {string} method - 'none', 'usga', 'ambrose', 'custom'
 * @param {Array<number>} customPercentages - Custom percentages for each player (optional)
 * @returns {number} Team handicap (rounded)
 */
export const calculateScrambleTeamHandicap = (playerHandicaps, method = 'usga', customPercentages = null) => {
  const teamSize = playerHandicaps.length;

  // Sort handicaps ascending (lowest to highest)
  const sortedHandicaps = [...playerHandicaps].sort((a, b) => a - b);

  let teamHandicap = 0;

  switch (method) {
    case 'none':
      return 0;

    case 'usga':
      // Standard USGA scramble percentages
      const usgaPercentages = {
        2: [0.35, 0.15],
        3: [0.20, 0.15, 0.10],
        4: [0.20, 0.15, 0.10, 0.05]
      };

      const percentages = usgaPercentages[teamSize];
      if (!percentages) {
        console.warn(`No USGA percentages defined for team size ${teamSize}`);
        return 0;
      }

      sortedHandicaps.forEach((hcp, idx) => {
        teamHandicap += hcp * percentages[idx];
      });
      break;

    case 'ambrose':
      // Traditional Ambrose method: sum of handicaps divided by (team size * 2)
      const divisor = teamSize * 2;
      teamHandicap = sortedHandicaps.reduce((sum, hcp) => sum + hcp, 0) / divisor;
      break;

    case 'custom':
      // Custom percentages provided
      if (customPercentages && customPercentages.length === teamSize) {
        sortedHandicaps.forEach((hcp, idx) => {
          teamHandicap += hcp * (customPercentages[idx] / 100);
        });
      } else {
        console.warn('Custom percentages not properly defined, falling back to USGA');
        return calculateScrambleTeamHandicap(playerHandicaps, 'usga');
      }
      break;

    default:
      console.warn(`Unknown handicap method: ${method}, falling back to USGA`);
      return calculateScrambleTeamHandicap(playerHandicaps, 'usga');
  }

  return Math.round(teamHandicap);
};

/**
 * Get the percentage breakdown for a handicap method
 * @param {string} method - 'usga', 'ambrose', 'custom'
 * @param {number} teamSize - Number of players in team
 * @param {Array<number>} customPercentages - Custom percentages (optional)
 * @returns {string} Human-readable description
 */
export const getHandicapMethodDescription = (method, teamSize, customPercentages = null) => {
  switch (method) {
    case 'none':
      return 'No handicap - Gross scores only';

    case 'usga':
      const usgaPercentages = {
        2: '35% + 15%',
        3: '20% + 15% + 10%',
        4: '20% + 15% + 10% + 5%'
      };
      return `USGA Scramble Method (${usgaPercentages[teamSize] || 'N/A'})`;

    case 'ambrose':
      return `Traditional Ambrose (Sum ÷ ${teamSize * 2})`;

    case 'custom':
      if (customPercentages && customPercentages.length === teamSize) {
        return `Custom (${customPercentages.map(p => `${p}%`).join(' + ')})`;
      }
      return 'Custom percentages';

    default:
      return 'Unknown method';
  }
};

/**
 * Calculate net team score with handicap
 * @param {number} grossScore - Team's gross score
 * @param {number} teamHandicap - Team handicap
 * @returns {number} Net score
 */
export const calculateNetTeamScore = (grossScore, teamHandicap) => {
  return grossScore - teamHandicap;
};

/**
 * Format team handicap for display
 * @param {number} teamHandicap - Team handicap
 * @returns {string} Formatted handicap
 */
export const formatTeamHandicap = (teamHandicap) => {
  if (teamHandicap === 0) return 'Scratch';
  return `${teamHandicap}`;
};

/**
 * Drive requirement tracker class
 */
export class ScrambleDriveTracker {
  constructor(players, minDrivesRequired = 3, totalHoles = 18) {
    this.players = players;
    this.minDrivesRequired = minDrivesRequired;
    this.totalHoles = totalHoles;
    this.driveUsage = {};

    players.forEach(player => {
      this.driveUsage[player.id] = {
        used: 0,
        required: minDrivesRequired,
        remaining: minDrivesRequired
      };
    });
  }

  /**
   * Record a drive used by a player
   */
  recordDriveUsed(playerId) {
    if (this.driveUsage[playerId]) {
      this.driveUsage[playerId].used++;
      this.driveUsage[playerId].remaining = Math.max(
        0,
        this.minDrivesRequired - this.driveUsage[playerId].used
      );
    }
  }

  /**
   * Get player's drive usage status
   */
  getPlayerStatus(playerId, currentHole) {
    const usage = this.driveUsage[playerId];
    const holesRemaining = this.totalHoles - currentHole;

    return {
      used: usage.used,
      required: usage.required,
      remaining: usage.remaining,
      holesLeft: holesRemaining,
      isCompliant: usage.used >= usage.required,
      warning: usage.remaining > holesRemaining
    };
  }

  /**
   * Get status message for a player
   */
  getStatusMessage(playerId, currentHole) {
    const usage = this.driveUsage[playerId];
    const holesRemaining = this.totalHoles - currentHole;
    const isCompliant = usage.used >= usage.required;
    const warning = usage.remaining > holesRemaining;
    const player = this.players.find(p => p.id === playerId);

    if (!player) return '';

    if (isCompliant) {
      return `✓ ${player.name} has met minimum (${usage.used}/${usage.required})`;
    } else if (warning) {
      return `⚠️ ${player.name} needs ${usage.remaining} more drive${usage.remaining > 1 ? 's' : ''} (${holesRemaining} holes left)`;
    } else {
      return `${player.name} needs ${usage.remaining} more drive${usage.remaining > 1 ? 's' : ''}`;
    }
  }

  /**
   * Get summary of all players
   */
  getAllPlayersSummary(currentHole) {
    return this.players.map(player => ({
      playerId: player.id,
      playerName: player.name,
      ...this.getPlayerStatus(player.id, currentHole)
    }));
  }

  /**
   * Validate drive requirements at end of round
   */
  validate() {
    const violations = [];

    Object.keys(this.driveUsage).forEach(playerId => {
      const usage = this.driveUsage[playerId];
      const player = this.players.find(p => p.id === playerId);

      if (usage.used < usage.required) {
        violations.push({
          playerId: playerId,
          playerName: player?.name || 'Unknown',
          used: usage.used,
          required: usage.required,
          missing: usage.remaining
        });
      }
    });

    return {
      isValid: violations.length === 0,
      violations: violations
    };
  }

  /**
   * Get drive usage data for persistence
   */
  toJSON() {
    return {
      driveUsage: this.driveUsage,
      minDrivesRequired: this.minDrivesRequired,
      totalHoles: this.totalHoles
    };
  }

  /**
   * Restore drive tracker from saved data
   */
  static fromJSON(data, players) {
    const tracker = new ScrambleDriveTracker(
      players,
      data.minDrivesRequired,
      data.totalHoles
    );
    tracker.driveUsage = data.driveUsage;
    return tracker;
  }
}

/**
 * Calculate strokes received on a hole for team
 * @param {number} teamHandicap - Team's course handicap
 * @param {number} holeStrokeIndex - Hole's stroke index (1-18)
 * @returns {number} Number of strokes received on this hole
 */
export const calculateTeamStrokesReceived = (teamHandicap, holeStrokeIndex) => {
  const roundedHandicap = Math.round(teamHandicap);
  if (roundedHandicap <= 0) return 0;

  if (roundedHandicap >= 18) {
    const extraStrokes = roundedHandicap - 18;
    if (holeStrokeIndex <= extraStrokes) return 2;
    return 1;
  } else {
    return holeStrokeIndex <= roundedHandicap ? 1 : 0;
  }
};
