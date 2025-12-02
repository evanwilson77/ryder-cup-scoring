/**
 * Handicap Utils Test Suite
 * Tests all handicap calculation and formatting functions
 */

import {
  formatHandicap,
  validateHandicap,
  parseHandicap,
  calculateStrokesReceived,
  calculateNetScore,
  calculateStablefordPoints,
  calculateTeamStablefordHole
} from '../handicapUtils';

describe('Handicap Utils', () => {
  describe('formatHandicap', () => {
    test('should format integer handicaps to 1 decimal place', () => {
      expect(formatHandicap(12)).toBe('12.0');
      expect(formatHandicap(0)).toBe('0.0');
      expect(formatHandicap(18)).toBe('18.0');
    });

    test('should format decimal handicaps to 1 decimal place', () => {
      expect(formatHandicap(12.5)).toBe('12.5');
      expect(formatHandicap(9.3)).toBe('9.3');
      expect(formatHandicap(15.7)).toBe('15.7');
    });

    test('should round to 1 decimal place', () => {
      expect(formatHandicap(12.456)).toBe('12.5');
      expect(formatHandicap(9.123)).toBe('9.1');
    });

    test('should handle null and undefined', () => {
      expect(formatHandicap(null)).toBe('0.0');
      expect(formatHandicap(undefined)).toBe('0.0');
    });

    test('should handle string inputs', () => {
      expect(formatHandicap('12.5')).toBe('12.5');
      expect(formatHandicap('18')).toBe('18.0');
    });
  });

  describe('validateHandicap', () => {
    test('should accept valid handicaps', () => {
      expect(validateHandicap(0)).toBe(true);
      expect(validateHandicap(12.5)).toBe(true);
      expect(validateHandicap(18)).toBe(true);
      expect(validateHandicap(36)).toBe(true);
      expect(validateHandicap(54)).toBe(true);
    });

    test('should reject negative handicaps', () => {
      expect(validateHandicap(-1)).toBe(false);
      expect(validateHandicap(-5)).toBe(false);
    });

    test('should reject handicaps over 54', () => {
      expect(validateHandicap(54.1)).toBe(false);
      expect(validateHandicap(60)).toBe(false);
      expect(validateHandicap(100)).toBe(false);
    });

    test('should reject non-numeric inputs', () => {
      expect(validateHandicap('abc')).toBe(false);
      expect(validateHandicap(NaN)).toBe(false);
      expect(validateHandicap(null)).toBe(false);
      expect(validateHandicap(undefined)).toBe(false);
    });

    test('should accept string representations of valid numbers', () => {
      expect(validateHandicap('12.5')).toBe(true);
      expect(validateHandicap('0')).toBe(true);
      expect(validateHandicap('54')).toBe(true);
    });
  });

  describe('parseHandicap', () => {
    test('should parse valid numeric strings', () => {
      expect(parseHandicap('12.5')).toBe(12.5);
      expect(parseHandicap('9.0')).toBe(9.0);
      expect(parseHandicap('18')).toBe(18.0);
    });

    test('should parse numbers directly', () => {
      expect(parseHandicap(12.5)).toBe(12.5);
      expect(parseHandicap(18)).toBe(18.0);
    });

    test('should round to 1 decimal place', () => {
      expect(parseHandicap(12.456)).toBe(12.5);
      expect(parseHandicap(9.123)).toBe(9.1);
      expect(parseHandicap(15.749)).toBe(15.7);
      expect(parseHandicap(15.751)).toBe(15.8);
    });

    test('should return 0.0 for invalid inputs', () => {
      expect(parseHandicap('abc')).toBe(0.0);
      expect(parseHandicap(NaN)).toBe(0.0);
      expect(parseHandicap(null)).toBe(0.0);
      expect(parseHandicap(undefined)).toBe(0.0);
    });
  });

  describe('calculateStrokesReceived', () => {
    test('should calculate strokes for handicap 0-18', () => {
      // 9 handicap gets 1 stroke on SI 1-9
      expect(calculateStrokesReceived(9, 1)).toBe(1);
      expect(calculateStrokesReceived(9, 9)).toBe(1);
      expect(calculateStrokesReceived(9, 10)).toBe(0);
      expect(calculateStrokesReceived(9, 18)).toBe(0);
    });

    test('should calculate strokes for handicap 18', () => {
      // 18 handicap gets 1 stroke on every hole
      expect(calculateStrokesReceived(18, 1)).toBe(1);
      expect(calculateStrokesReceived(18, 9)).toBe(1);
      expect(calculateStrokesReceived(18, 18)).toBe(1);
    });

    test('should calculate strokes for handicap 19-36', () => {
      // 27 handicap gets 2 strokes on SI 1-9, 1 stroke on SI 10-18
      expect(calculateStrokesReceived(27, 1)).toBe(2);
      expect(calculateStrokesReceived(27, 9)).toBe(2);
      expect(calculateStrokesReceived(27, 10)).toBe(1);
      expect(calculateStrokesReceived(27, 18)).toBe(1);
    });

    test('should calculate strokes for handicap 36', () => {
      // 36 handicap gets 2 strokes on every hole
      expect(calculateStrokesReceived(36, 1)).toBe(2);
      expect(calculateStrokesReceived(36, 9)).toBe(2);
      expect(calculateStrokesReceived(36, 18)).toBe(2);
    });

    test('should calculate strokes for handicap 37-54', () => {
      // 45 handicap gets 3 strokes on SI 1-9, 2 strokes on SI 10-18
      expect(calculateStrokesReceived(45, 1)).toBe(3);
      expect(calculateStrokesReceived(45, 9)).toBe(3);
      expect(calculateStrokesReceived(45, 10)).toBe(2);
      expect(calculateStrokesReceived(45, 18)).toBe(2);
    });

    test('should handle decimal handicaps by flooring', () => {
      // 12.5 handicap treated as 12
      expect(calculateStrokesReceived(12.5, 12)).toBe(1);
      expect(calculateStrokesReceived(12.5, 13)).toBe(0);

      // 18.7 handicap treated as 18
      expect(calculateStrokesReceived(18.7, 18)).toBe(1);
      expect(calculateStrokesReceived(18.7, 1)).toBe(1);
    });

    test('should handle scratch golfer', () => {
      expect(calculateStrokesReceived(0, 1)).toBe(0);
      expect(calculateStrokesReceived(0, 18)).toBe(0);
    });
  });

  describe('calculateNetScore', () => {
    test('should calculate net score with stroke deduction', () => {
      // 18 hcp gets 1 stroke on all holes
      expect(calculateNetScore(5, 18, 1)).toBe(4);
      expect(calculateNetScore(6, 18, 10)).toBe(5);
    });

    test('should calculate net score without strokes', () => {
      // 9 hcp gets no stroke on SI 10
      expect(calculateNetScore(5, 9, 10)).toBe(5);
      expect(calculateNetScore(4, 0, 1)).toBe(4);
    });

    test('should calculate net score with 2 strokes', () => {
      // 27 hcp gets 2 strokes on SI 1-9
      expect(calculateNetScore(7, 27, 5)).toBe(5);
      expect(calculateNetScore(6, 36, 1)).toBe(4);
    });

    test('should return null for missing gross score', () => {
      expect(calculateNetScore(0, 18, 1)).toBe(null);
      expect(calculateNetScore(null, 18, 1)).toBe(null);
    });
  });

  describe('calculateStablefordPoints', () => {
    test('should calculate points for scratch golfer', () => {
      const par = 4;
      const hcp = 0;
      const si = 10;

      expect(calculateStablefordPoints(2, par, si, hcp)).toBe(4); // Eagle
      expect(calculateStablefordPoints(3, par, si, hcp)).toBe(3); // Birdie
      expect(calculateStablefordPoints(4, par, si, hcp)).toBe(2); // Par
      expect(calculateStablefordPoints(5, par, si, hcp)).toBe(1); // Bogey
      expect(calculateStablefordPoints(6, par, si, hcp)).toBe(0); // Double bogey
    });

    test('should calculate points with handicap strokes', () => {
      const par = 4;
      const hcp = 18;
      const si = 5;

      // Gross 5, net 4 (par) = 2 points
      expect(calculateStablefordPoints(5, par, si, hcp)).toBe(2);
      // Gross 4, net 3 (birdie) = 3 points
      expect(calculateStablefordPoints(4, par, si, hcp)).toBe(3);
      // Gross 6, net 5 (bogey) = 1 point
      expect(calculateStablefordPoints(6, par, si, hcp)).toBe(1);
    });

    test('should calculate points on different pars', () => {
      const hcp = 0;
      const si = 1;

      // Par 3
      expect(calculateStablefordPoints(2, 3, si, hcp)).toBe(3); // Birdie
      // Par 5
      expect(calculateStablefordPoints(3, 5, si, hcp)).toBe(4); // Eagle
    });

    test('should return 0 for missing gross score', () => {
      expect(calculateStablefordPoints(0, 4, 1, 18)).toBe(0);
      expect(calculateStablefordPoints(null, 4, 1, 18)).toBe(0);
    });

    test('should award 5 points for albatross or better', () => {
      expect(calculateStablefordPoints(1, 4, 1, 0)).toBe(5); // 3 under
      expect(calculateStablefordPoints(2, 5, 1, 0)).toBe(5); // 3 under
    });
  });

  describe('calculateTeamStablefordHole', () => {
    test('should use best ball scoring', () => {
      const playerScores = [
        { gross: 4, handicap: 18 }, // Gets stroke on SI 5, net 3 = 3 points (birdie)
        { gross: 5, handicap: 9 }   // Gets stroke on SI 5, net 4 = 2 points (par)
      ];

      const result = calculateTeamStablefordHole(playerScores, 4, 5);
      expect(result.teamPoints).toBe(3); // Best of 3 and 2
      expect(result.playerPoints).toEqual([3, 2]);
    });

    test('should handle all players scoring 0 points', () => {
      const playerScores = [
        { gross: 8, handicap: 0 }, // 4 over = 0 points
        { gross: 9, handicap: 0 }  // 5 over = 0 points
      ];

      const result = calculateTeamStablefordHole(playerScores, 4, 10);
      expect(result.teamPoints).toBe(0);
      expect(result.playerPoints).toEqual([0, 0]);
    });

    test('should work with 4-player team', () => {
      const playerScores = [
        { gross: 3, handicap: 0 },  // Birdie = 3 points
        { gross: 4, handicap: 0 },  // Par = 2 points
        { gross: 5, handicap: 0 },  // Bogey = 1 point
        { gross: 6, handicap: 0 }   // Double = 0 points
      ];

      const result = calculateTeamStablefordHole(playerScores, 4, 5);
      expect(result.teamPoints).toBe(3); // Best is birdie
      expect(result.playerPoints).toEqual([3, 2, 1, 0]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very high handicaps', () => {
      expect(calculateStrokesReceived(54, 1)).toBe(3);
      expect(calculateStrokesReceived(54, 18)).toBe(3); // 54 handicap gets 3 strokes on all holes
    });

    test('should handle single decimal precision', () => {
      expect(formatHandicap(12.1234567)).toBe('12.1');
      expect(parseHandicap(12.9999)).toBe(13.0);
    });
  });
});
