/**
 * Scramble Calculations Test Suite
 * Tests team handicap calculations and drive tracking
 */

import {
  calculateScrambleTeamHandicap,
  getHandicapMethodDescription,
  calculateNetTeamScore,
  formatTeamHandicap,
  ScrambleDriveTracker,
  calculateTeamStrokesReceived
} from '../scrambleCalculations';

describe('Scramble Calculations', () => {
  describe('calculateScrambleTeamHandicap', () => {
    describe('USGA Method', () => {
      test('should calculate 2-person team handicap', () => {
        const handicaps = [10, 20];
        // Sorted: [10, 20]
        // USGA: 10*0.35 + 20*0.15 = 3.5 + 3.0 = 6.5 -> rounds to 7
        expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(7);
      });

      test('should calculate 3-person team handicap', () => {
        const handicaps = [10, 15, 20];
        // USGA: 10*0.20 + 15*0.15 + 20*0.10 = 2.0 + 2.25 + 2.0 = 6.25 -> rounds to 6
        expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(6);
      });

      test('should calculate 4-person team handicap', () => {
        const handicaps = [8, 12, 16, 20];
        // USGA: 8*0.20 + 12*0.15 + 16*0.10 + 20*0.05 = 1.6 + 1.8 + 1.6 + 1.0 = 6.0
        expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(6);
      });

      test('should sort handicaps before calculation', () => {
        const unsorted = [20, 10, 15];
        const sorted = [10, 15, 20];
        expect(calculateScrambleTeamHandicap(unsorted, 'usga')).toBe(
          calculateScrambleTeamHandicap(sorted, 'usga')
        );
      });

      test('should return 0 for unsupported team sizes', () => {
        expect(calculateScrambleTeamHandicap([10], 'usga')).toBe(0);
        expect(calculateScrambleTeamHandicap([10, 15, 20, 25, 30], 'usga')).toBe(0);
      });

      test('should handle low handicaps', () => {
        const handicaps = [2, 5];
        // 2*0.35 + 5*0.15 = 0.7 + 0.75 = 1.45 -> rounds to 1
        expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(1);
      });

      test('should handle scratch golfers', () => {
        const handicaps = [0, 0];
        expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(0);
      });
    });

    describe('Ambrose Method', () => {
      test('should calculate for 2-person team', () => {
        const handicaps = [12, 18];
        // (12 + 18) / (2 * 2) = 30 / 4 = 7.5 -> rounds to 8
        expect(calculateScrambleTeamHandicap(handicaps, 'ambrose')).toBe(8);
      });

      test('should calculate for 3-person team', () => {
        const handicaps = [10, 15, 20];
        // (10 + 15 + 20) / (3 * 2) = 45 / 6 = 7.5 -> rounds to 8
        expect(calculateScrambleTeamHandicap(handicaps, 'ambrose')).toBe(8);
      });

      test('should calculate for 4-person team', () => {
        const handicaps = [8, 12, 16, 20];
        // (8 + 12 + 16 + 20) / (4 * 2) = 56 / 8 = 7.0
        expect(calculateScrambleTeamHandicap(handicaps, 'ambrose')).toBe(7);
      });

      test('should work with any team size', () => {
        const handicaps = [10, 15, 20, 25, 30];
        // (10+15+20+25+30) / (5*2) = 100/10 = 10
        expect(calculateScrambleTeamHandicap(handicaps, 'ambrose')).toBe(10);
      });
    });

    describe('Custom Method', () => {
      test('should calculate with custom percentages', () => {
        const handicaps = [10, 20];
        const percentages = [40, 20];
        // 10*0.40 + 20*0.20 = 4.0 + 4.0 = 8.0
        expect(calculateScrambleTeamHandicap(handicaps, 'custom', percentages)).toBe(8);
      });

      test('should apply percentages to sorted handicaps', () => {
        const handicaps = [20, 10];
        const percentages = [40, 20];
        // Sorts to [10, 20], then 10*0.40 + 20*0.20 = 8
        expect(calculateScrambleTeamHandicap(handicaps, 'custom', percentages)).toBe(8);
      });

      test('should handle 3-person custom percentages', () => {
        const handicaps = [10, 15, 20];
        const percentages = [30, 20, 10];
        // 10*0.30 + 15*0.20 + 20*0.10 = 3.0 + 3.0 + 2.0 = 8.0
        expect(calculateScrambleTeamHandicap(handicaps, 'custom', percentages)).toBe(8);
      });

      test('should fallback to USGA if percentages mismatch', () => {
        const handicaps = [10, 20];
        const percentages = [40]; // Only 1 percentage for 2 players
        // Should fallback to USGA calculation
        const result = calculateScrambleTeamHandicap(handicaps, 'custom', percentages);
        const usgaResult = calculateScrambleTeamHandicap(handicaps, 'usga');
        expect(result).toBe(usgaResult);
      });

      test('should fallback to USGA if no percentages provided', () => {
        const handicaps = [10, 20];
        const result = calculateScrambleTeamHandicap(handicaps, 'custom', null);
        const usgaResult = calculateScrambleTeamHandicap(handicaps, 'usga');
        expect(result).toBe(usgaResult);
      });
    });

    describe('None Method', () => {
      test('should return 0 for no handicap', () => {
        expect(calculateScrambleTeamHandicap([10, 20], 'none')).toBe(0);
        expect(calculateScrambleTeamHandicap([5, 10, 15], 'none')).toBe(0);
      });
    });

    describe('Unknown Method', () => {
      test('should fallback to USGA for unknown method', () => {
        const handicaps = [10, 20];
        const result = calculateScrambleTeamHandicap(handicaps, 'unknown');
        const usgaResult = calculateScrambleTeamHandicap(handicaps, 'usga');
        expect(result).toBe(usgaResult);
      });
    });

    test('should default to USGA when no method specified', () => {
      const handicaps = [10, 20];
      const result = calculateScrambleTeamHandicap(handicaps);
      const usgaResult = calculateScrambleTeamHandicap(handicaps, 'usga');
      expect(result).toBe(usgaResult);
    });
  });

  describe('getHandicapMethodDescription', () => {
    test('should describe USGA method for different team sizes', () => {
      expect(getHandicapMethodDescription('usga', 2)).toBe('USGA Scramble Method (35% + 15%)');
      expect(getHandicapMethodDescription('usga', 3)).toBe('USGA Scramble Method (20% + 15% + 10%)');
      expect(getHandicapMethodDescription('usga', 4)).toBe('USGA Scramble Method (20% + 15% + 10% + 5%)');
    });

    test('should handle unsupported USGA team sizes', () => {
      expect(getHandicapMethodDescription('usga', 5)).toBe('USGA Scramble Method (N/A)');
    });

    test('should describe Ambrose method', () => {
      expect(getHandicapMethodDescription('ambrose', 2)).toBe('Traditional Ambrose (Sum ÷ 4)');
      expect(getHandicapMethodDescription('ambrose', 4)).toBe('Traditional Ambrose (Sum ÷ 8)');
    });

    test('should describe custom method with percentages', () => {
      const percentages = [40, 30, 20];
      expect(getHandicapMethodDescription('custom', 3, percentages)).toBe('Custom (40% + 30% + 20%)');
    });

    test('should describe custom method without percentages', () => {
      expect(getHandicapMethodDescription('custom', 3, null)).toBe('Custom percentages');
    });

    test('should describe none method', () => {
      expect(getHandicapMethodDescription('none', 2)).toBe('No handicap - Gross scores only');
    });

    test('should handle unknown method', () => {
      expect(getHandicapMethodDescription('unknown', 2)).toBe('Unknown method');
    });
  });

  describe('calculateNetTeamScore', () => {
    test('should subtract team handicap from gross score', () => {
      expect(calculateNetTeamScore(80, 10)).toBe(70);
      expect(calculateNetTeamScore(95, 15)).toBe(80);
    });

    test('should handle zero handicap', () => {
      expect(calculateNetTeamScore(72, 0)).toBe(72);
    });

    test('should handle scratch team', () => {
      expect(calculateNetTeamScore(72, 0)).toBe(72);
    });
  });

  describe('formatTeamHandicap', () => {
    test('should format scratch as "Scratch"', () => {
      expect(formatTeamHandicap(0)).toBe('Scratch');
    });

    test('should format non-zero handicaps as strings', () => {
      expect(formatTeamHandicap(7)).toBe('7');
      expect(formatTeamHandicap(12)).toBe('12');
      expect(formatTeamHandicap(18)).toBe('18');
    });
  });

  describe('ScrambleDriveTracker', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
      { id: 'p3', name: 'Player 3' },
      { id: 'p4', name: 'Player 4' }
    ];

    describe('Constructor', () => {
      test('should initialize drive tracking for all players', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        expect(tracker.players).toEqual(players);
        expect(tracker.minDrivesRequired).toBe(3);
        expect(tracker.totalHoles).toBe(18);
        expect(Object.keys(tracker.driveUsage)).toHaveLength(4);
      });

      test('should set initial drive counts to zero', () => {
        const tracker = new ScrambleDriveTracker(players, 4, 18);

        players.forEach(player => {
          expect(tracker.driveUsage[player.id].used).toBe(0);
          expect(tracker.driveUsage[player.id].required).toBe(4);
          expect(tracker.driveUsage[player.id].remaining).toBe(4);
        });
      });
    });

    describe('recordDriveUsed', () => {
      test('should increment drive count for player', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        tracker.recordDriveUsed('p1');
        expect(tracker.driveUsage['p1'].used).toBe(1);
        expect(tracker.driveUsage['p1'].remaining).toBe(2);

        tracker.recordDriveUsed('p1');
        expect(tracker.driveUsage['p1'].used).toBe(2);
        expect(tracker.driveUsage['p1'].remaining).toBe(1);
      });

      test('should not affect other players', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        tracker.recordDriveUsed('p1');
        expect(tracker.driveUsage['p2'].used).toBe(0);
        expect(tracker.driveUsage['p3'].used).toBe(0);
      });

      test('should not go below zero remaining', () => {
        const tracker = new ScrambleDriveTracker(players, 2, 18);

        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1'); // 3rd drive
        expect(tracker.driveUsage['p1'].remaining).toBe(0);
      });
    });

    describe('Drive Usage Data', () => {
      test('should track drive usage correctly', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');

        expect(tracker.driveUsage['p1'].used).toBe(3);
        expect(tracker.driveUsage['p1'].required).toBe(3);
        expect(tracker.driveUsage['p1'].remaining).toBe(0);
      });

      test('should calculate warning status', () => {
        const tracker = new ScrambleDriveTracker(players, 4, 18);

        // Player needs 4 drives, has used 1, on hole 16
        tracker.recordDriveUsed('p1');
        const usage = tracker.driveUsage['p1'];
        const holesLeft = 18 - 16;

        expect(usage.remaining).toBe(3);
        expect(holesLeft).toBe(2);
        expect(usage.remaining > holesLeft).toBe(true); // Warning condition
      });

      test('should show compliant when requirement met', () => {
        const tracker = new ScrambleDriveTracker(players, 4, 18);

        tracker.recordDriveUsed('p1');
        const usage = tracker.driveUsage['p1'];

        expect(usage.remaining).toBe(3);
        expect(usage.used >= usage.required).toBe(false); // Not yet compliant
      });
    });


    describe('validate', () => {
      test('should pass validation when all requirements met', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        players.forEach(player => {
          tracker.recordDriveUsed(player.id);
          tracker.recordDriveUsed(player.id);
          tracker.recordDriveUsed(player.id);
        });

        const validation = tracker.validate();
        expect(validation.isValid).toBe(true);
        expect(validation.violations).toHaveLength(0);
      });

      test('should fail validation with violations', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        // Only p1 and p2 meet requirements
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p2');
        tracker.recordDriveUsed('p2');
        tracker.recordDriveUsed('p2');

        const validation = tracker.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.violations).toHaveLength(2);
        expect(validation.violations[0].playerId).toBe('p3');
        expect(validation.violations[1].playerId).toBe('p4');
      });

      test('should report correct missing count', () => {
        const tracker = new ScrambleDriveTracker(players, 4, 18);

        tracker.recordDriveUsed('p1');

        const validation = tracker.validate();
        expect(validation.violations[0].used).toBe(1);
        expect(validation.violations[0].required).toBe(4);
        expect(validation.violations[0].missing).toBe(3);
      });
    });

    describe('JSON Serialization', () => {
      test('should serialize to JSON', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);

        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p1');

        const json = tracker.toJSON();
        expect(json.minDrivesRequired).toBe(3);
        expect(json.totalHoles).toBe(18);
        expect(json.driveUsage['p1'].used).toBe(2);
      });

      test('should restore from JSON', () => {
        const tracker = new ScrambleDriveTracker(players, 3, 18);
        tracker.recordDriveUsed('p1');
        tracker.recordDriveUsed('p2');

        const json = tracker.toJSON();
        const restored = ScrambleDriveTracker.fromJSON(json, players);

        expect(restored.minDrivesRequired).toBe(3);
        expect(restored.totalHoles).toBe(18);
        expect(restored.driveUsage['p1'].used).toBe(1);
        expect(restored.driveUsage['p2'].used).toBe(1);
      });
    });
  });

  describe('calculateTeamStrokesReceived', () => {
    test('should calculate strokes for team handicap 0-18', () => {
      // 9 handicap gets 1 stroke on SI 1-9
      expect(calculateTeamStrokesReceived(9, 1)).toBe(1);
      expect(calculateTeamStrokesReceived(9, 9)).toBe(1);
      expect(calculateTeamStrokesReceived(9, 10)).toBe(0);
    });

    test('should calculate strokes for team handicap 18+', () => {
      // 25 handicap gets 2 strokes on SI 1-7, 1 stroke on SI 8-18
      expect(calculateTeamStrokesReceived(25, 1)).toBe(2);
      expect(calculateTeamStrokesReceived(25, 7)).toBe(2);
      expect(calculateTeamStrokesReceived(25, 8)).toBe(1);
      expect(calculateTeamStrokesReceived(25, 18)).toBe(1);
    });

    test('should round team handicap', () => {
      // 12.7 rounds to 13
      expect(calculateTeamStrokesReceived(12.7, 13)).toBe(1);
      expect(calculateTeamStrokesReceived(12.7, 14)).toBe(0);
    });

    test('should return 0 for scratch team', () => {
      expect(calculateTeamStrokesReceived(0, 1)).toBe(0);
      expect(calculateTeamStrokesReceived(0, 18)).toBe(0);
    });

    test('should handle negative handicaps', () => {
      expect(calculateTeamStrokesReceived(-2, 1)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty player array', () => {
      const handicaps = [];
      expect(calculateScrambleTeamHandicap(handicaps, 'usga')).toBe(0);
    });

    test('should handle decimal handicaps in team calculations', () => {
      const handicaps = [10.5, 20.3];
      const result = calculateScrambleTeamHandicap(handicaps, 'usga');
      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });

    test('should handle very low team handicaps', () => {
      const handicaps = [0, 2];
      const result = calculateScrambleTeamHandicap(handicaps, 'usga');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test('should handle very high team handicaps', () => {
      const handicaps = [30, 40, 50, 54];
      const result = calculateScrambleTeamHandicap(handicaps, 'usga');
      expect(result).toBeGreaterThan(0);
    });
  });
});
