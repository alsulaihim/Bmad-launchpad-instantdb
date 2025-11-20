/**
 * Centralized logging utility
 * Provides structured logging with different levels
 * Browser-compatible implementation that works in both client and server environments
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: unknown;
  correlationId?: string;
}

// Browser-compatible logger implementation
const createBrowserLogger = () => {
  const shouldLog = (level: LogLevel): boolean => {
    const isProd = process.env.NODE_ENV === "production";
    const logLevels: LogLevel[] = ["fatal", "error", "warn", "info", "debug", "trace"];
    const minLevel = isProd ? "info" : "debug";
    const minLevelIndex = logLevels.indexOf(minLevel);
    const currentLevelIndex = logLevels.indexOf(level);
    return currentLevelIndex <= minLevelIndex;
  };

  return {
    log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
      if (!shouldLog(level)) return;

      const timestamp = new Date().toISOString();
      const logData = {
        timestamp,
        level,
        message,
        ...meta,
      };

      // Use appropriate console method
      /* eslint-disable no-console */
      switch (level) {
        case "fatal":
        case "error":
          console.error(JSON.stringify(logData));
          break;
        case "warn":
          console.warn(JSON.stringify(logData));
          break;
        case "trace":
        case "debug":
          console.debug(JSON.stringify(logData));
          break;
        default:
          console.log(JSON.stringify(logData));
      }
      /* eslint-enable no-console */
    },
  };
};

const browserLogger = createBrowserLogger();

/**
 * Logger class for structured logging
 * Redacts sensitive information and provides context
 */
class Logger {
  /**
   * Redacts sensitive information from log context
   * Add patterns for PII, secrets, tokens, etc.
   */
  private redactSensitiveData(context: LogContext): LogContext {
    const redacted = { ...context };
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "apiKey",
      "api_key",
      "authorization",
      "creditCard",
      "ssn",
    ];

    Object.keys(redacted).forEach((key) => {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        redacted[key] = "[REDACTED]";
      }
    });

    return redacted;
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const sanitizedContext = context
      ? this.redactSensitiveData(context)
      : undefined;

    const meta = {
      ...(sanitizedContext && { context: sanitizedContext }),
    };

    browserLogger.log(level, message, meta);
  }

  trace(message: string, context?: LogContext) {
    this.log("trace", message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };
    this.log("error", message, errorContext);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };
    this.log("fatal", message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();
