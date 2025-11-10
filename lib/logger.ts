/**
 * Centralized logging utility
 * Provides structured logging with different levels
 * In production, integrate with logging service (e.g., Winston, Pino)
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: unknown;
  correlationId?: string;
}

/**
 * Logger class for structured logging
 * Redacts sensitive information and provides context
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

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
    const timestamp = new Date().toISOString();
    const sanitizedContext = context
      ? this.redactSensitiveData(context)
      : undefined;

    const logEntry = {
      timestamp,
      level,
      message,
      ...(sanitizedContext && { context: sanitizedContext }),
    };

    // In development, use console methods for better DX
    if (this.isDevelopment) {
      switch (level) {
        case "error":
        case "fatal":
          console.error(JSON.stringify(logEntry, null, 2));
          break;
        case "warn":
          console.warn(JSON.stringify(logEntry, null, 2));
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(logEntry, null, 2));
      }
    } else {
      // In production, use structured JSON logging
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(logEntry));
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

