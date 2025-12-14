/**
 * Centralized Logger Utility
 *
 * Provides environment-aware logging that only outputs in development mode.
 * Replaces direct console.log calls throughout the application.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Logger class with environment-aware methods
 */
class Logger {
  constructor() {
    this.enabled = isDevelopment;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Debug level - detailed information for debugging
   */
  debug(...args) {
    if (this.enabled) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Info level - general information
   */
  info(...args) {
    if (this.enabled) {
      console.log('[INFO]', ...args);
    }
  }

  /**
   * Warn level - warning messages
   */
  warn(...args) {
    if (this.enabled) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Error level - error messages (always logged)
   */
  error(...args) {
    // Always log errors, even in production
    console.error('[ERROR]', ...args);
  }

  /**
   * Group related logs together
   */
  group(label, fn) {
    if (this.enabled) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Log with custom styling (Chrome DevTools)
   */
  styled(message, styles = 'color: blue; font-weight: bold') {
    if (this.enabled) {
      console.log(`%c${message}`, styles);
    }
  }

  /**
   * Table format for arrays/objects
   */
  table(data) {
    if (this.enabled) {
      console.table(data);
    }
  }

  /**
   * Time performance measurements
   */
  time(label) {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }

  /**
   * Assert conditions
   */
  assert(condition, message) {
    if (this.enabled) {
      console.assert(condition, message);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Convenience exports for common operations
export const log = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
