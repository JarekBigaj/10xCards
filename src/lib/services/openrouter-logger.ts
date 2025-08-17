import type { ErrorCode } from "../../types";
import { CircuitBreakerState } from "../../types";

/**
 * Log levels for OpenRouter service
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    code: ErrorCode;
    message: string;
    stack?: string;
    isRetryable: boolean;
  };
  metadata?: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    duration?: number;
    retryCount?: number;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize: number; // in MB
  maxFiles: number;
  format: "json" | "text";
}

/**
 * Structured logger for OpenRouter service
 */
export class OpenRouterLogger {
  private readonly config: LoggerConfig;
  private readonly serviceName: string;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor(serviceName: string, config: Partial<LoggerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      maxFileSize: 10,
      maxFiles: 5,
      format: "json",
      ...config,
    };
  }

  /**
   * Log debug message
   */
  debug(operation: string, message: string, data?: Record<string, unknown>, metadata?: LogEntry["metadata"]): void {
    this.log(LogLevel.DEBUG, operation, message, data, metadata);
  }

  /**
   * Log info message
   */
  info(operation: string, message: string, data?: Record<string, unknown>, metadata?: LogEntry["metadata"]): void {
    this.log(LogLevel.INFO, operation, message, data, metadata);
  }

  /**
   * Log warning message
   */
  warn(operation: string, message: string, data?: Record<string, unknown>, metadata?: LogEntry["metadata"]): void {
    this.log(LogLevel.WARN, operation, message, data, metadata);
  }

  /**
   * Log error message
   */
  error(operation: string, message: string, error?: Error | unknown, metadata?: LogEntry["metadata"]): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.ERROR, operation, message, undefined, metadata, errorData);
  }

  /**
   * Log fatal message
   */
  fatal(operation: string, message: string, error?: Error | unknown, metadata?: LogEntry["metadata"]): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.FATAL, operation, message, undefined, metadata, errorData);
  }

  /**
   * Log API request
   */
  logRequest(operation: string, request: Record<string, unknown>, metadata?: LogEntry["metadata"]): void {
    this.info(operation, "API request received", { request }, metadata);
  }

  /**
   * Log API response
   */
  logResponse(
    operation: string,
    response: Record<string, unknown>,
    duration: number,
    metadata?: LogEntry["metadata"]
  ): void {
    this.info(operation, "API response sent", { response, duration }, { ...metadata, duration });
  }

  /**
   * Log circuit breaker state change
   */
  logCircuitBreakerChange(
    from: CircuitBreakerState,
    to: CircuitBreakerState,
    reason: string,
    metadata?: LogEntry["metadata"]
  ): void {
    const level = to === CircuitBreakerState.OPEN ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, "circuit_breaker", `State changed from ${from} to ${to}`, { reason, from, to }, metadata);
  }

  /**
   * Log retry attempt
   */
  logRetryAttempt(
    operation: string,
    attempt: number,
    error: Error,
    delay: number,
    metadata?: LogEntry["metadata"]
  ): void {
    this.warn(operation, `Retry attempt ${attempt}`, { attempt, delay, error: error.message }, metadata);
  }

  /**
   * Log cache hit/miss
   */
  logCache(operation: string, hit: boolean, key: string, metadata?: LogEntry["metadata"]): void {
    const level = hit ? LogLevel.DEBUG : LogLevel.INFO;
    this.log(level, operation, `Cache ${hit ? "hit" : "miss"}`, { hit, key }, metadata);
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(limit = 100): LogEntry[] {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer.length = 0;
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    operation: string,
    message: string,
    data?: Record<string, unknown>,
    metadata?: LogEntry["metadata"],
    error?: LogEntry["error"]
  ): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      operation,
      message,
      data,
      error,
      metadata,
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // Output to file if enabled
    if (this.config.enableFile && this.config.filePath) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const prefix = `[${timestamp}] [${levelName}] [${entry.service}:${entry.operation}]`;

    if (entry.error) {
      // eslint-disable-next-line no-console
      console.error(`${prefix} ${entry.message}`, {
        error: entry.error,
        data: entry.data,
        metadata: entry.metadata,
      });
    } else if (entry.level >= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(`${prefix} ${entry.message}`, {
        data: entry.data,
        metadata: entry.metadata,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${entry.message}`, {
        data: entry.data,
        metadata: entry.metadata,
      });
    }
  }

  /**
   * Output log entry to file
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private outputToFile(_entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just simulate it
    if (this.config.format === "json") {
      // TODO: Implement actual file writing
      // fs.appendFileSync(this.config.filePath!, logLine);
    } else {
      // TODO: Implement actual file writing
      // fs.appendFileSync(this.config.filePath!, logLine);
    }
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): LogEntry["error"] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        code: "UNKNOWN_ERROR" as ErrorCode,
        message: error.message,
        stack: error.stack,
        isRetryable: false,
      };
    }

    if (typeof error === "object" && error !== null && "code" in error) {
      const errorObj = error as Record<string, unknown>;
      return {
        code: (errorObj.code as ErrorCode) || "UNKNOWN_ERROR",
        message: (errorObj.message as string) || String(error),
        isRetryable: (errorObj.isRetryable as boolean) || false,
      };
    }

    return {
      code: "UNKNOWN_ERROR" as ErrorCode,
      message: String(error),
      isRetryable: false,
    };
  }
}

/**
 * Factory function to create logger instance
 */
export function createOpenRouterLogger(serviceName: string, config?: Partial<LoggerConfig>): OpenRouterLogger {
  return new OpenRouterLogger(serviceName, config);
}

/**
 * Default logger instance
 */
export const defaultLogger = createOpenRouterLogger("OpenRouterService");
