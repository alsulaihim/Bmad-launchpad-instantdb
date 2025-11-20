import winston from "winston";

/**
 * Centralized logging utility
 * Provides structured logging with different levels using Winston
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: unknown;
  correlationId?: string;
}

// Define custom levels if needed, but standard npm levels are fine.
// Winston levels: error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
// We map:
// fatal -> error (with metadata)
// error -> error
// warn -> warn
// info -> info
// debug -> debug
// trace -> silly

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

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

    switch (level) {
      case "fatal":
        winstonLogger.error(message, { ...meta, fatal: true });
        break;
      case "error":
        winstonLogger.error(message, meta);
        break;
      case "warn":
        winstonLogger.warn(message, meta);
        break;
      case "info":
        winstonLogger.info(message, meta);
        break;
      case "debug":
        winstonLogger.debug(message, meta);
        break;
      case "trace":
        winstonLogger.silly(message, meta);
        break;
      default:
        winstonLogger.info(message, meta);
    }
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
