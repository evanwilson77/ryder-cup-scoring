/**
 * Match Play Scoring Test Suite
 * Tests all match play scoring logic
 */

import {
  calculateNetScore,
  determineHoleWinner,
  calculateMatchStatus,
  getMatchResult,
  calculateTournamentPoints
} from '../scoring';

describe('Match Play Scoring', () => {
  describe('calculateNetScore', () => {
    test('should calculate net score with no handicap strokes', () => {
      expect(calculateNetScore(5, 0, 18)).toBe(5);
      expect(calculateNetScore(4, 5, 18)).toBe(4);
    });

    test('should deduct handicap strokes based on stroke index', () => {
      // 18 handicap gets 1 stroke on all holes
      expect(calculateNetScore(5, 18, 10)).toBe(4);

      // 9 handicap gets 1 stroke on SI 1-9 only
      expect(calculateNetScore(5, 9, 5)).toBe(4); // Gets stroke
      expect(calculateNetScore(5, 9, 15)).toBe(5); // No stroke
    });

    test('should handle 36 handicap getting 1 stroke on all holes', () => {
      // 36 handicap gets 1 stroke on SI 5 (since 5 <= 36)
      expect(calculateNetScore(6, 36, 5)).toBe(5);
    });

    test('should handle low handicap correctly', () => {
      // Scratch golfer gets no strokes
      expect(calculateNetScore(4, 0, 1)).toBe(4);
    });
  });

  describe('determineHoleWinner - Singles', () => {
    const holeData = { par: 4, strokeIndex: 10 };

    test('should determine winner correctly in singles', () => {
      // Team 1 wins with better net score
      expect(determineHoleWinner(
        'singles',
        { team1Player1: 4, team2Player1: 5 },
        holeData
      )).toBe('team1');

      // Team 2 wins
      expect(determineHoleWinner(
        'singles',
        { team1Player1: 5, team2Player1: 4 },
        holeData
      )).toBe('team2');

      // Halved
      expect(determineHoleWinner(
        'singles',
        { team1Player1: 4, team2Player1: 4 },
        holeData
      )).toBe('halved');
    });
  });

  describe('determineHoleWinner - Fourball', () => {
    const holeData = { par: 4, strokeIndex: 10 };

    test('should use best ball scoring', () => {
      // Team 1: players score 4 and 5, Team 2: players score 5 and 6
      // Team 1 wins (4 beats 5)
      expect(determineHoleWinner(
        'fourball',
        {
          team1Player1: 4,
          team1Player2: 5,
          team2Player1: 5,
          team2Player2: 6
        },
        holeData
      )).toBe('team1');

      // Both teams best ball is 4 - halved
      expect(determineHoleWinner(
        'fourball',
        {
          team1Player1: 4,
          team1Player2: 5,
          team2Player1: 4,
          team2Player2: 6
        },
        holeData
      )).toBe('halved');
    });
  });

  describe('determineHoleWinner - Foursomes', () => {
    const holeData = { par: 4, strokeIndex: 10 };

    test('should use team score', () => {
      expect(determineHoleWinner(
        'foursomes',
        { team1Score: 4, team2Score: 5 },
        holeData
      )).toBe('team1');

      expect(determineHoleWinner(
        'foursomes',
        { team1Score: 5, team2Score: 4 },
        holeData
      )).toBe('team2');

      expect(determineHoleWinner(
        'foursomes',
        { team1Score: 4, team2Score: 4 },
        holeData
      )).toBe('halved');
    });
  });

  describe('calculateMatchStatus', () => {
    test('should detect match won early (dormie)', () => {
      // Team 1 up by 5 with 4 holes to play
      const holeScores = [
        { winner: 'team1' },
        { winner: 'team1' },
        { winner: 'halved' },
        { winner: 'team1' },
        { winner: 'halved' },
        { winner: 'team1' },
        { winner: 'halved' },
        { winner: 'team1' },
        { winner: 'halved' },
        { winner: 'halved' },
        { winner: 'halved' },
        { winner: 'halved' },
        { winner: 'halved' },
        { winner: 'halved' }
      ];

      const result = calculateMatchStatus(holeScores, 14, 'Team 1', 'Team 2');
      expect(result.isComplete).toBe(true);
      expect(result.status).toContain('5&4');
    });

    test('should handle match going to 18th hole', () => {
      const holeScores = Array(17).fill({ winner: 'halved' });

      const result = calculateMatchStatus(holeScores, 17, 'Team 1', 'Team 2');
      expect(result.isComplete).toBe(false);
    });

    test('should detect all square after 18 holes', () => {
      const holeScores = Array(18).fill({ winner: 'halved' });

      const result = calculateMatchStatus(holeScores, 18, 'Team 1', 'Team 2');
      expect(result.status).toBe('AS');
      expect(result.team1Up).toBe(0);
      expect(result.isComplete).toBe(true);
    });

    test('should calculate correct match score', () => {
      const holeScores = [
        { winner: 'team1' }, // Team 1 +1
        { winner: 'team2' }, // All square
        { winner: 'team1' }, // Team 1 +1
        { winner: 'team1' }, // Team 1 +2
        { winner: 'halved' },
        { winner: 'team2' }, // Team 1 +1
      ];

      const result = calculateMatchStatus(holeScores, 6, 'Team 1', 'Team 2');
      expect(result.team1Up).toBe(1);
      expect(result.holesPlayed).toBe(6);
      expect(result.holesRemaining).toBe(12);
    });
  });

  describe('getMatchResult', () => {
    test('should return team1_win when team1 is ahead', () => {
      const holeScores18 = [
        ...Array(10).fill({ winner: 'team1' }),
        ...Array(8).fill({ winner: 'halved' })
      ];

      const result = getMatchResult(holeScores18);
      expect(result).toBe('team1_win');
    });

    test('should return team2_win when team2 is ahead', () => {
      const holeScores18 = [
        ...Array(10).fill({ winner: 'team2' }),
        ...Array(8).fill({ winner: 'halved' })
      ];

      const result = getMatchResult(holeScores18);
      expect(result).toBe('team2_win');
    });

    test('should return halved when match is tied', () => {
      const holeScoresHalved = Array(18).fill({ winner: 'halved' });

      const result = getMatchResult(holeScoresHalved);
      expect(result).toBe('halved');
    });
  });

  describe('calculateTournamentPoints', () => {
    test('should award 1 point for win', () => {
      const matches = [{ result: 'team1_win' }];
      expect(calculateTournamentPoints(matches)).toEqual({
        team1Points: 1,
        team2Points: 0
      });
    });

    test('should award 0.5 points each for halved match', () => {
      const matches = [{ result: 'halved' }];
      expect(calculateTournamentPoints(matches)).toEqual({
        team1Points: 0.5,
        team2Points: 0.5
      });
    });

    test('should award 1 point to team2 for win', () => {
      const matches = [{ result: 'team2_win' }];
      expect(calculateTournamentPoints(matches)).toEqual({
        team1Points: 0,
        team2Points: 1
      });
    });

    test('should calculate total points from multiple matches', () => {
      const matches = [
        { result: 'team1_win' },
        { result: 'team2_win' },
        { result: 'halved' },
        { result: 'team1_win' }
      ];
      expect(calculateTournamentPoints(matches)).toEqual({
        team1Points: 2.5,
        team2Points: 1.5
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null scores gracefully', () => {
      expect(() => calculateNetScore(null, 0, 1)).not.toThrow();
    });

    test('should handle empty hole scores array', () => {
      const result = calculateMatchStatus([], 0, 'Team 1', 'Team 2');
      expect(result.isComplete).toBe(false);
    });

    test('should handle very high handicaps', () => {
      // 54 handicap gets 1 stroke on SI 10 (since 10 <= 54)
      expect(calculateNetScore(7, 54, 10)).toBe(6);
    });
  });
});
