import {
  mapFormatToRoute,
  mapRouteToFormat,
  getFormatDisplayName,
  FORMAT_MAPPINGS
} from '../formatMapping';

describe('Format Mapping Utility', () => {
  describe('mapFormatToRoute', () => {
    test('maps best_ball to bestball', () => {
      expect(mapFormatToRoute('best_ball')).toBe('bestball');
    });

    test('maps team_stableford to team-stableford', () => {
      expect(mapFormatToRoute('team_stableford')).toBe('team-stableford');
    });

    test('maps individual_stableford to stableford', () => {
      expect(mapFormatToRoute('individual_stableford')).toBe('stableford');
    });

    test('maps match_play_singles to singles', () => {
      expect(mapFormatToRoute('match_play_singles')).toBe('singles');
    });

    test('maps four_ball to fourball', () => {
      expect(mapFormatToRoute('four_ball')).toBe('fourball');
    });

    test('returns format unchanged if no mapping exists (scramble)', () => {
      expect(mapFormatToRoute('scramble')).toBe('scramble');
    });

    test('returns format unchanged if no mapping exists (shamble)', () => {
      expect(mapFormatToRoute('shamble')).toBe('shamble');
    });

    test('returns format unchanged if no mapping exists (foursomes)', () => {
      expect(mapFormatToRoute('foursomes')).toBe('foursomes');
    });

    test('returns empty string for null input', () => {
      expect(mapFormatToRoute(null)).toBe('');
    });

    test('returns empty string for undefined input', () => {
      expect(mapFormatToRoute(undefined)).toBe('');
    });

    test('returns empty string for empty string input', () => {
      expect(mapFormatToRoute('')).toBe('');
    });
  });

  describe('mapRouteToFormat', () => {
    test('maps bestball to best_ball', () => {
      expect(mapRouteToFormat('bestball')).toBe('best_ball');
    });

    test('maps team-stableford to team_stableford', () => {
      expect(mapRouteToFormat('team-stableford')).toBe('team_stableford');
    });

    test('maps stableford to individual_stableford', () => {
      expect(mapRouteToFormat('stableford')).toBe('individual_stableford');
    });

    test('maps singles to match_play_singles', () => {
      expect(mapRouteToFormat('singles')).toBe('match_play_singles');
    });

    test('maps fourball to four_ball', () => {
      expect(mapRouteToFormat('fourball')).toBe('four_ball');
    });

    test('returns format unchanged if no mapping exists (scramble)', () => {
      expect(mapRouteToFormat('scramble')).toBe('scramble');
    });

    test('returns format unchanged if no mapping exists (shamble)', () => {
      expect(mapRouteToFormat('shamble')).toBe('shamble');
    });

    test('returns format unchanged if no mapping exists (foursomes)', () => {
      expect(mapRouteToFormat('foursomes')).toBe('foursomes');
    });

    test('returns empty string for null input', () => {
      expect(mapRouteToFormat(null)).toBe('');
    });

    test('returns empty string for undefined input', () => {
      expect(mapRouteToFormat(undefined)).toBe('');
    });

    test('returns empty string for empty string input', () => {
      expect(mapRouteToFormat('')).toBe('');
    });
  });

  describe('getFormatDisplayName', () => {
    test('returns display name for database format best_ball', () => {
      expect(getFormatDisplayName('best_ball')).toBe('Best Ball');
    });

    test('returns display name for route format bestball', () => {
      expect(getFormatDisplayName('bestball')).toBe('Best Ball');
    });

    test('returns display name for database format team_stableford', () => {
      expect(getFormatDisplayName('team_stableford')).toBe('Team Stableford');
    });

    test('returns display name for route format team-stableford', () => {
      expect(getFormatDisplayName('team-stableford')).toBe('Team Stableford');
    });

    test('returns display name for individual_stableford', () => {
      expect(getFormatDisplayName('individual_stableford')).toBe('Individual Stableford');
    });

    test('returns display name for stableford', () => {
      expect(getFormatDisplayName('stableford')).toBe('Individual Stableford');
    });

    test('returns display name for four_ball', () => {
      expect(getFormatDisplayName('four_ball')).toBe('Four-Ball');
    });

    test('returns display name for fourball', () => {
      expect(getFormatDisplayName('fourball')).toBe('Four-Ball');
    });

    test('returns display name for foursomes', () => {
      expect(getFormatDisplayName('foursomes')).toBe('Foursomes');
    });

    test('returns display name for scramble', () => {
      expect(getFormatDisplayName('scramble')).toBe('Scramble');
    });

    test('returns display name for shamble', () => {
      expect(getFormatDisplayName('shamble')).toBe('Shamble');
    });

    test('returns display name for match_play_singles', () => {
      expect(getFormatDisplayName('match_play_singles')).toBe('Match Play Singles');
    });

    test('returns display name for singles', () => {
      expect(getFormatDisplayName('singles')).toBe('Match Play Singles');
    });

    test('returns format unchanged for unknown format', () => {
      expect(getFormatDisplayName('unknown_format')).toBe('unknown_format');
    });
  });

  describe('FORMAT_MAPPINGS consistency', () => {
    test('DATABASE_TO_ROUTE and ROUTE_TO_DATABASE are inverses', () => {
      // Every database format should map to a route format that maps back to the same database format
      Object.entries(FORMAT_MAPPINGS.DATABASE_TO_ROUTE).forEach(([dbFormat, routeFormat]) => {
        if (FORMAT_MAPPINGS.ROUTE_TO_DATABASE[routeFormat]) {
          expect(FORMAT_MAPPINGS.ROUTE_TO_DATABASE[routeFormat]).toBe(dbFormat);
        }
      });
    });

    test('ROUTE_TO_DATABASE and DATABASE_TO_ROUTE are inverses', () => {
      // Every route format should map to a database format that maps back to the same route format
      Object.entries(FORMAT_MAPPINGS.ROUTE_TO_DATABASE).forEach(([routeFormat, dbFormat]) => {
        if (FORMAT_MAPPINGS.DATABASE_TO_ROUTE[dbFormat]) {
          expect(FORMAT_MAPPINGS.DATABASE_TO_ROUTE[dbFormat]).toBe(routeFormat);
        }
      });
    });
  });

  describe('Round-trip conversions', () => {
    test('database format round-trips correctly', () => {
      const dbFormats = Object.keys(FORMAT_MAPPINGS.DATABASE_TO_ROUTE);
      dbFormats.forEach(dbFormat => {
        const routeFormat = mapFormatToRoute(dbFormat);
        const backToDb = mapRouteToFormat(routeFormat);
        expect(backToDb).toBe(dbFormat);
      });
    });

    test('route format round-trips correctly', () => {
      const routeFormats = Object.keys(FORMAT_MAPPINGS.ROUTE_TO_DATABASE);
      routeFormats.forEach(routeFormat => {
        const dbFormat = mapRouteToFormat(routeFormat);
        const backToRoute = mapFormatToRoute(dbFormat);
        expect(backToRoute).toBe(routeFormat);
      });
    });
  });

  describe('Edge cases', () => {
    test('handles format that needs no mapping (scramble)', () => {
      expect(mapFormatToRoute('scramble')).toBe('scramble');
      expect(mapRouteToFormat('scramble')).toBe('scramble');
    });

    test('handles format that needs no mapping (shamble)', () => {
      expect(mapFormatToRoute('shamble')).toBe('shamble');
      expect(mapRouteToFormat('shamble')).toBe('shamble');
    });

    test('handles format that needs no mapping (foursomes)', () => {
      expect(mapFormatToRoute('foursomes')).toBe('foursomes');
      expect(mapRouteToFormat('foursomes')).toBe('foursomes');
    });
  });
});
