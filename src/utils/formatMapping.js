/**
 * Format Mapping Utility
 *
 * Handles mapping between database format identifiers (using underscores)
 * and route path segments (using hyphens for readability).
 *
 * Database formats use underscores (e.g., 'best_ball', 'team_stableford')
 * Route paths use hyphens (e.g., 'bestball', 'team-stableford')
 */

/**
 * Mapping from database format identifiers to route path segments
 */
export const FORMAT_MAPPINGS = {
  DATABASE_TO_ROUTE: {
    'best_ball': 'bestball',
    'team_stableford': 'team-stableford',
    'individual_stableford': 'stableford',
    'match_play_singles': 'singles',
    'four_ball': 'fourball',
    'foursomes': 'foursomes',
    'scramble': 'scramble',
    'shamble': 'shamble',
    'individual_stroke': 'stroke'
  },
  ROUTE_TO_DATABASE: {
    'bestball': 'best_ball',
    'team-stableford': 'team_stableford',
    'stableford': 'individual_stableford',
    'singles': 'match_play_singles',
    'fourball': 'four_ball',
    'foursomes': 'foursomes',
    'scramble': 'scramble',
    'shamble': 'shamble',
    'stroke': 'individual_stroke'
  }
};

/**
 * Maps a database format identifier to its corresponding route path segment
 *
 * @param {string} dbFormat - Format from Firestore (e.g., 'best_ball', 'team_stableford')
 * @returns {string} Route-compatible format (e.g., 'bestball', 'team-stableford')
 *
 * @example
 * mapFormatToRoute('best_ball')       // returns 'bestball'
 * mapFormatToRoute('team_stableford') // returns 'team-stableford'
 * mapFormatToRoute('scramble')        // returns 'scramble' (no mapping needed)
 */
export const mapFormatToRoute = (dbFormat) => {
  if (!dbFormat) return '';
  return FORMAT_MAPPINGS.DATABASE_TO_ROUTE[dbFormat] || dbFormat;
};

/**
 * Maps a route path segment to its corresponding database format identifier
 *
 * @param {string} routeFormat - Format from URL route (e.g., 'bestball', 'team-stableford')
 * @returns {string} Database-compatible format (e.g., 'best_ball', 'team_stableford')
 *
 * @example
 * mapRouteToFormat('bestball')        // returns 'best_ball'
 * mapRouteToFormat('team-stableford') // returns 'team_stableford'
 * mapRouteToFormat('scramble')        // returns 'scramble' (no mapping needed)
 */
export const mapRouteToFormat = (routeFormat) => {
  if (!routeFormat) return '';
  return FORMAT_MAPPINGS.ROUTE_TO_DATABASE[routeFormat] || routeFormat;
};

/**
 * Gets a user-friendly display name for a format
 *
 * @param {string} format - Format identifier (database or route format)
 * @returns {string} Display name for the format
 *
 * @example
 * getFormatDisplayName('best_ball')  // returns 'Best Ball'
 * getFormatDisplayName('bestball')   // returns 'Best Ball'
 */
export const getFormatDisplayName = (format) => {
  const displayNames = {
    'best_ball': 'Best Ball',
    'bestball': 'Best Ball',
    'team_stableford': 'Team Stableford',
    'team-stableford': 'Team Stableford',
    'individual_stableford': 'Individual Stableford',
    'stableford': 'Individual Stableford',
    'match_play_singles': 'Match Play Singles',
    'singles': 'Match Play Singles',
    'four_ball': 'Four-Ball',
    'fourball': 'Four-Ball',
    'foursomes': 'Foursomes',
    'scramble': 'Scramble',
    'shamble': 'Shamble',
    'individual_stroke': 'Stroke Play',
    'stroke': 'Stroke Play'
  };

  return displayNames[format] || format;
};
