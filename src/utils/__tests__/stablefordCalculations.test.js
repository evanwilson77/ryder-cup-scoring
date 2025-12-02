/**
 * Stableford Calculations Test Suite
 * Tests all stableford scoring logic
 */

import {
  calculateHoleScore,
  calculateRoundScore,
  formatScoreToPar,
  getScoreDescription
} from '../stablefordCalculations';

describe('Stableford Calculations', () => {
  describe('calculateHoleScore', () => {
    const par = 4;
    const strokeIndex = 10;

    test('should calculate correct points for different scores at par 4', () => {
      // Albatross (2 under par) = 4 points
      expect(calculateHoleScore({ grossScore: 2, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(4);
      // Eagle (2 under) = 4 points
      expect(calculateHoleScore({ grossScore: 2, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(4);
      // Birdie (1 under) = 3 points
      expect(calculateHoleScore({ grossScore: 3, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(3);
      // Par = 2 points
      expect(calculateHoleScore({ grossScore: 4, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(2);
      // Bogey (1 over) = 1 point
      expect(calculateHoleScore({ grossScore: 5, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(1);
      // Double bogey or worse = 0 points
      expect(calculateHoleScore({ grossScore: 6, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(0);
      expect(calculateHoleScore({ grossScore: 10, holePar: par, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(0);
    });

    test('should handle handicap strokes correctly', () => {
      const playerHandicap = 18; // Gets 1 stroke on every hole

      // Gross 5, net 4 (par) = 2 points
      const result = calculateHoleScore({ grossScore: 5, holePar: par, playerHandicap, holeStrokeIndex: strokeIndex });
      expect(result.netScore).toBe(4);
      expect(result.points).toBe(2);
    });

    test('should handle different par values', () => {
      // Par 3 - birdie
      expect(calculateHoleScore({ grossScore: 2, holePar: 3, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(3);
      // Par 5 - eagle
      expect(calculateHoleScore({ grossScore: 3, holePar: 5, playerHandicap: 0, holeStrokeIndex: strokeIndex }).points).toBe(4);
    });

    test('should calculate correct net scores with stroke allocation', () => {
      // 18 handicap gets 1 stroke on SI 10 hole
      const hcp18 = calculateHoleScore({ grossScore: 5, holePar: 4, playerHandicap: 18, holeStrokeIndex: 10 });
      expect(hcp18.netScore).toBe(4); // 5 - 1 = 4 (par)
      expect(hcp18.points).toBe(2);

      // 9 handicap gets 0 strokes on SI 10 hole
      const hcp9 = calculateHoleScore({ grossScore: 5, holePar: 4, playerHandicap: 9, holeStrokeIndex: 10 });
      expect(hcp9.netScore).toBe(5); // 5 - 0 = 5 (bogey)
      expect(hcp9.points).toBe(1);
    });
  });

  describe('calculateRoundScore', () => {
    const courseHoles = Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: i < 4 || i >= 14 ? 3 : i < 14 ? 4 : 5, // Mix of par 3, 4, 5
      strokeIndex: i + 1
    }));

    test('should calculate round totals correctly', () => {
      const scores = courseHoles.map((hole, i) => ({
        holeNumber: i + 1,
        grossScore: hole.par // All pars
      }));

      const result = calculateRoundScore(scores, courseHoles, 0);

      expect(result.holesCompleted).toBe(18);
      expect(result.totalGross).toBe(courseHoles.reduce((sum, h) => sum + h.par, 0));
      expect(result.totalNet).toBe(result.totalGross);
      expect(result.totalPoints).toBe(36); // 18 holes x 2 points each
    });

    test('should handle partially completed round', () => {
      const scores = courseHoles.map((hole, i) => ({
        holeNumber: i + 1,
        grossScore: i < 9 ? hole.par : null // Only front 9 complete
      }));

      const result = calculateRoundScore(scores, courseHoles, 0);

      expect(result.holesCompleted).toBe(9);
      expect(result.totalPoints).toBe(18); // 9 holes x 2 points each
    });

    test('should calculate handicap-adjusted scores', () => {
      const playerHandicap = 18;
      const scores = courseHoles.map((hole, i) => ({
        holeNumber: i + 1,
        grossScore: hole.par + 1 // All bogeys
      }));

      const result = calculateRoundScore(scores, courseHoles, playerHandicap);

      // With 18 handicap, each hole gets 1 stroke, so bogey becomes par
      expect(result.totalPoints).toBe(36); // All net pars = 2 points each
    });

    test('should handle empty scores array', () => {
      const result = calculateRoundScore([], courseHoles, 0);

      expect(result.holesCompleted).toBe(0);
      expect(result.totalGross).toBe(0);
      expect(result.totalPoints).toBe(0);
    });

    test('should calculate total points correctly', () => {
      const scores = courseHoles.map((hole, i) => ({
        holeNumber: i + 1,
        grossScore: hole.par
      }));

      const result = calculateRoundScore(scores, courseHoles, 0);

      expect(result.holesCompleted).toBe(18);
      expect(result.totalPoints).toBe(36); // All pars = 2 points each
      expect(result.pointsVsTarget).toBe(0); // Playing to handicap
    });
  });

  describe('formatScoreToPar', () => {
    test('should format scores correctly', () => {
      expect(formatScoreToPar(0)).toBe('E'); // Par
      expect(formatScoreToPar(-1)).toBe('-1'); // Birdie
      expect(formatScoreToPar(-2)).toBe('-2'); // Eagle
      expect(formatScoreToPar(1)).toBe('+1'); // Bogey
      expect(formatScoreToPar(2)).toBe('+2'); // Double bogey
    });
  });

  describe('getScoreDescription', () => {
    test('should return correct descriptions', () => {
      expect(getScoreDescription(-3)).toBe('Albatross');
      expect(getScoreDescription(-2)).toBe('Eagle');
      expect(getScoreDescription(-1)).toBe('Birdie');
      expect(getScoreDescription(0)).toBe('Par');
      expect(getScoreDescription(1)).toBe('Bogey');
      expect(getScoreDescription(2)).toBe('Double Bogey');
      expect(getScoreDescription(3)).toBe('Triple Bogey');
      expect(getScoreDescription(6)).toBe('+6');
    });
  });
});
