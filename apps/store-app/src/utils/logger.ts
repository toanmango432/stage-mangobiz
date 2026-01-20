/**
 * Logger Utility
 *
 * A structured logging utility that replaces console.log/warn/error
 * with proper log levels and formatting. Designed for professional
 * logging without emoji characters.
 *
 * Log Levels:
 * - debug: Detailed diagnostic information (disabled in production)
 * - info: General operational information
 * - warn: Potentially harmful situations
 * - error: Error events that might still allow the app to continue
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Loading user data', { userId: '123' });
 * logger.info('User logged in successfully');
 * logger.warn('Rate limit approaching', { remaining: 5 });
 * logger.error('Failed to save data', { error: err.message });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Prefix for all log messages */
  prefix?: string;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Whether to output as JSON */
  jsonOutput: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env?.DEV ? 'debug' : 'info',
  prefix: '[Mango]',
  includeTimestamp: false,
  jsonOutput: false,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format the log message
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log at debug level (verbose, diagnostic information)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    if (this.config.jsonOutput) {
      console.debug(JSON.stringify({ level: 'debug', message, ...context }));
    } else if (context && Object.keys(context).length > 0) {
      console.debug(this.format('debug', message), context);
    } else {
      console.debug(this.format('debug', message));
    }
  }

  /**
   * Log at info level (general operational information)
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    if (this.config.jsonOutput) {
      console.info(JSON.stringify({ level: 'info', message, ...context }));
    } else if (context && Object.keys(context).length > 0) {
      console.info(this.format('info', message), context);
    } else {
      console.info(this.format('info', message));
    }
  }

  /**
   * Log at warn level (potentially harmful situations)
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    if (this.config.jsonOutput) {
      console.warn(JSON.stringify({ level: 'warn', message, ...context }));
    } else if (context && Object.keys(context).length > 0) {
      console.warn(this.format('warn', message), context);
    } else {
      console.warn(this.format('warn', message));
    }
  }

  /**
   * Log at error level (error events)
   */
  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    if (this.config.jsonOutput) {
      console.error(JSON.stringify({ level: 'error', message, ...context }));
    } else if (context && Object.keys(context).length > 0) {
      console.error(this.format('error', message), context);
    } else {
      console.error(this.format('error', message));
    }
  }

  /**
   * Create a child logger with a specific prefix/module name
   */
  child(moduleName: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}[${moduleName}]` : `[${moduleName}]`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating child loggers or custom instances
export { Logger };

// Export a pre-configured logger for auth module
export const authLogger = logger.child('Auth');
