/**
 * Tournament theming system
 * Handles color schemes and styling for different tournament types
 */

// Ryder Cup theme - Blue vs Red teams
export const ryderCupTheme = {
  type: 'ryder_cup',
  name: 'Ryder Cup',
  team1: {
    name: 'Tawa Lads',
    color: '#DC2626', // red-600
    lightColor: '#FEE2E2', // red-100
    darkColor: '#991B1B', // red-800
    gradient: 'from-red-500 to-red-700'
  },
  team2: {
    name: 'Rest of World',
    color: '#2563EB', // blue-600
    lightColor: '#DBEAFE', // blue-100
    darkColor: '#1E40AF', // blue-800
    gradient: 'from-blue-500 to-blue-700'
  },
  background: 'bg-gradient-to-br from-red-50 via-white to-blue-50',
  headerGradient: 'from-red-600 via-purple-600 to-blue-600'
};

// Neutral theme - For all other tournaments
export const neutralTheme = {
  type: 'neutral',
  name: 'Neutral',
  primary: {
    color: '#667eea', // primary-500
    lightColor: '#ebf0fe', // primary-100
    darkColor: '#4451b8', // primary-700
    gradient: 'from-primary-500 to-secondary-500'
  },
  secondary: {
    color: '#764ba2', // secondary-500
    lightColor: '#f3e8ff', // secondary-100
    darkColor: '#5e367c', // secondary-700
    gradient: 'from-secondary-500 to-primary-500'
  },
  background: 'bg-gradient-to-br from-primary-50 to-secondary-50',
  headerGradient: 'from-primary-600 to-secondary-600'
};

// Honours board theme - Classic golf club aesthetic
export const honoursBoardTheme = {
  type: 'honours_board',
  name: 'Honours Board',
  gold: '#d4af37',
  brass: '#b5a642',
  wood: '#2c1810',
  green: '#1e4d2b',
  cream: '#faf8f3',
  fontFamily: 'Playfair Display, Georgia, serif',
  background: 'bg-gradient-to-br from-amber-50 to-yellow-50',
  cardBackground: 'bg-gradient-to-b from-amber-100 to-amber-50'
};

/**
 * Get theme by tournament type
 * @param {string} tournamentType - 'ryder_cup', 'individual_stableford', 'scramble', etc.
 * @returns {Object} Theme configuration
 */
export const getThemeByType = (tournamentType) => {
  switch (tournamentType) {
    case 'ryder_cup':
      return ryderCupTheme;
    case 'honours_board':
      return honoursBoardTheme;
    default:
      return neutralTheme;
  }
};

/**
 * Get theme by series theming setting
 * @param {string} theming - 'ryder_cup' or 'neutral'
 * @returns {Object} Theme configuration
 */
export const getThemeByTheming = (theming) => {
  switch (theming) {
    case 'ryder_cup':
      return ryderCupTheme;
    case 'honours_board':
      return honoursBoardTheme;
    default:
      return neutralTheme;
  }
};

/**
 * Apply theme classes to component
 * @param {Object} theme - Theme configuration
 * @param {string} element - Element type ('background', 'header', 'card', etc.)
 * @returns {string} Tailwind CSS classes
 */
export const getThemeClasses = (theme, element = 'background') => {
  switch (element) {
    case 'background':
      return theme.background;
    case 'header':
      return `bg-gradient-to-r ${theme.headerGradient}`;
    case 'card':
      return theme.cardBackground || 'bg-white';
    default:
      return '';
  }
};

/**
 * Get team color for scoring display
 * @param {Object} theme - Theme configuration
 * @param {string} teamKey - 'team1' or 'team2'
 * @returns {string} Hex color code
 */
export const getTeamColor = (theme, teamKey) => {
  if (theme.type === 'ryder_cup') {
    return theme[teamKey]?.color || theme.primary.color;
  }
  return teamKey === 'team1' ? theme.primary.color : theme.secondary.color;
};

/**
 * Format tournament series name with icon
 * @param {string} format - Tournament format
 * @returns {Object} { name, icon }
 */
export const getTournamentFormatInfo = (format) => {
  const formats = {
    ryder_cup: {
      name: 'Ryder Cup',
      icon: '🏆',
      description: 'Team match play competition'
    },
    individual_stableford: {
      name: 'Individual Stableford',
      icon: '⛳',
      description: 'Points-based individual competition'
    },
    scramble: {
      name: 'Scramble',
      icon: '🤝',
      description: 'Team scramble/ambrose format'
    },
    team_stableford: {
      name: 'Team Stableford',
      icon: '👥',
      description: 'Best ball team Stableford'
    },
    best_ball: {
      name: 'Best Ball',
      icon: '🏌️',
      description: 'Four-ball best ball format'
    },
    shamble: {
      name: 'Shamble',
      icon: '🎯',
      description: 'Scramble drive, individual play after'
    },
    multi_day: {
      name: 'Multi-Day Stroke Play',
      icon: '📅',
      description: 'Multi-day stroke play tournament'
    }
  };

  return formats[format] || {
    name: format,
    icon: '⛳',
    description: 'Golf tournament'
  };
};

/**
 * Check if tournament uses team-based scoring
 * @param {string} format - Tournament format
 * @returns {boolean}
 */
export const isTeamFormat = (format) => {
  return ['ryder_cup', 'scramble', 'team_stableford', 'best_ball', 'shamble'].includes(format);
};

/**
 * Check if tournament uses Stableford scoring
 * @param {string} format - Tournament format
 * @returns {boolean}
 */
export const isStablefordFormat = (format) => {
  return ['individual_stableford', 'team_stableford'].includes(format);
};

/**
 * Check if tournament uses match play
 * @param {string} format - Tournament format
 * @returns {boolean}
 */
export const isMatchPlayFormat = (format) => {
  return format === 'ryder_cup';
};
