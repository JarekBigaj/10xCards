import type { ErrorCode } from "../../types";

/**
 * Base error class for OpenRouter service
 */
export class OpenRouterServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public isRetryable = false,
    public retryAfter?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerError extends OpenRouterServiceError {
  constructor(message: string) {
    super("TIMEOUT_ERROR", message, false);
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends OpenRouterServiceError {
  constructor(message = "Invalid API key") {
    super("AUTHENTICATION_ERROR", message, false);
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends OpenRouterServiceError {
  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super("RATE_LIMIT_ERROR", message, true, retryAfter);
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends OpenRouterServiceError {
  constructor(message = "Request timed out") {
    super("TIMEOUT_ERROR", message, true);
  }
}

/**
 * Error thrown when AI model returns invalid response
 */
export class ModelError extends OpenRouterServiceError {
  constructor(message = "AI model service error") {
    super("MODEL_ERROR", message, true);
  }
}

/**
 * Error thrown when network connection fails
 */
export class NetworkError extends OpenRouterServiceError {
  constructor(message = "Network connection error") {
    super("NETWORK_ERROR", message, true);
  }
}

/**
 * Error thrown when response validation fails
 */
export class ValidationError extends OpenRouterServiceError {
  constructor(message = "Response validation failed") {
    super("VALIDATION_ERROR", message, false);
  }
}

/**
 * Error thrown for unknown/unexpected errors
 */
export class UnknownError extends OpenRouterServiceError {
  constructor(message = "Unknown error occurred") {
    super("UNKNOWN_ERROR", message, false);
  }
}

/**
 * Error factory for creating appropriate error types
 */
export const OpenRouterErrorFactory = {
  /**
   * Create error based on HTTP status code
   */
  fromHttpStatus(status: number, message?: string): OpenRouterServiceError {
    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 429:
        return new RateLimitError(message, 60);
      case 408:
      case 504:
        return new TimeoutError(message);
      case 500:
      case 502:
      case 503:
        return new ModelError(message);
      default:
        return new UnknownError(message || `HTTP ${status}`);
    }
  },

  /**
   * Create error based on error message content
   */
  fromMessage(message: string): OpenRouterServiceError {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("rate limit") || lowerMessage.includes("429")) {
      return new RateLimitError(message, 60);
    }

    if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
      return new TimeoutError(message);
    }

    if (lowerMessage.includes("500") || lowerMessage.includes("502") || lowerMessage.includes("503")) {
      return new ModelError(message);
    }

    if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
      return new NetworkError(message);
    }

    if (lowerMessage.includes("invalid") || lowerMessage.includes("validation")) {
      return new ValidationError(message);
    }

    return new UnknownError(message);
  },

  /**
   * Create retryable error with exponential backoff
   */
  createRetryableError(code: ErrorCode, message: string, retryAfter?: number): OpenRouterServiceError {
    return new OpenRouterServiceError(code, message, true, retryAfter);
  },

  /**
   * Create non-retryable error
   */
  createNonRetryableError(code: ErrorCode, message: string): OpenRouterServiceError {
    return new OpenRouterServiceError(code, message, false);
  },
};
