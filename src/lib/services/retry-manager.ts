import type { ErrorCode } from "../../types";

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors: ErrorCode[];
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  delay: number;
  error: Error;
  timestamp: number;
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalTime: number;
  lastError?: Error;
}

/**
 * Cache entry for retry operations
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Advanced retry manager with multiple strategies and caching
 */
export class RetryManager {
  private readonly strategies: Map<string, RetryStrategy>;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly attemptHistory: RetryAttempt[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.strategies = new Map();
    this.setupDefaultStrategies();
  }

  /**
   * Execute operation with retry mechanism
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    strategyName = "default",
    cacheKey?: string,
    cacheTtl = 300000 // 5 minutes
  ): Promise<RetryResult<T>> {
    const strategy = this.strategies.get(strategyName) || this.strategies.get("default");
    if (!strategy) {
      throw new Error(`No retry strategy found for: ${strategyName}`);
    }

    const startTime = Date.now();
    let lastError: Error | undefined;

    // Check cache first if cacheKey is provided
    if (cacheKey) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          attempts: 1,
          totalTime: Date.now() - startTime,
        };
      }
    }

    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Cache successful result
        if (cacheKey) {
          this.setCache(cacheKey, result, cacheTtl);
        }

        return {
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Record attempt
        this.recordAttempt(attempt, 0, lastError);

        if (attempt === strategy.maxAttempts) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError, strategy.retryableErrors)) {
          throw lastError;
        }

        // Calculate delay with backpressure
        const delay = this.calculateDelay(attempt, strategy);

        // Apply backpressure if too many recent failures
        if (this.shouldApplyBackpressure()) {
          const backpressureDelay = delay * 2;
          await this.sleep(backpressureDelay);
        } else {
          await this.sleep(delay);
        }
      }
    }

    if (!lastError) {
      throw new Error("Unexpected error: no error recorded during retry attempts");
    }
    throw lastError;
  }

  /**
   * Add custom retry strategy
   */
  addStrategy(name: string, strategy: RetryStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageAttemptsPerOperation: number;
    recentFailures: number;
  } {
    const totalAttempts = this.attemptHistory.length;
    const recentFailures = this.attemptHistory.filter((attempt) => Date.now() - attempt.timestamp < 60000).length; // Last minute

    return {
      totalAttempts,
      successfulAttempts: totalAttempts - recentFailures,
      failedAttempts: recentFailures,
      averageAttemptsPerOperation: totalAttempts > 0 ? totalAttempts / Math.max(1, totalAttempts - recentFailures) : 0,
      recentFailures,
    };
  }

  /**
   * Clear retry history
   */
  clearHistory(): void {
    this.attemptHistory.length = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    const totalRequests = this.totalCacheHits + this.totalCacheMisses;
    const hitRate = totalRequests > 0 ? this.totalCacheHits / totalRequests : 0;

    return {
      size: this.cache.size,
      hitRate,
      totalHits: this.totalCacheHits,
      totalMisses: this.totalCacheMisses,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.totalCacheHits = 0;
    this.totalCacheMisses = 0;
  }

  /**
   * Setup default retry strategies
   */
  private setupDefaultStrategies(): void {
    // Default strategy - balanced retry
    this.strategies.set("default", {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterFactor: 0.2,
      retryableErrors: ["RATE_LIMIT_ERROR", "TIMEOUT_ERROR", "MODEL_ERROR", "NETWORK_ERROR"],
    });

    // Aggressive strategy - more retries, longer delays
    this.strategies.set("aggressive", {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 3,
      jitterFactor: 0.3,
      retryableErrors: ["RATE_LIMIT_ERROR", "TIMEOUT_ERROR", "MODEL_ERROR", "NETWORK_ERROR"],
    });

    // Conservative strategy - fewer retries, shorter delays
    this.strategies.set("conservative", {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitterFactor: 0.1,
      retryableErrors: ["RATE_LIMIT_ERROR", "TIMEOUT_ERROR"],
    });

    // Quick strategy - minimal retries for fast operations
    this.strategies.set("quick", {
      maxAttempts: 1,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitterFactor: 0,
      retryableErrors: [],
    });
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    const baseDelay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(baseDelay, strategy.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * strategy.jitterFactor * (Math.random() * 2 - 1);

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Check if error is retryable based on strategy
   */
  private isRetryableError(error: Error, retryableErrors: ErrorCode[]): boolean {
    // Check if error has a code property that matches retryable errors
    if ("code" in error && typeof error.code === "string") {
      return retryableErrors.includes(error.code as ErrorCode);
    }

    // Fallback to message-based checking
    const errorMessage = error.message.toLowerCase();

    if (
      retryableErrors.includes("RATE_LIMIT_ERROR") &&
      (errorMessage.includes("rate limit") || errorMessage.includes("429"))
    ) {
      return true;
    }

    if (
      retryableErrors.includes("TIMEOUT_ERROR") &&
      (errorMessage.includes("timeout") || errorMessage.includes("timed out"))
    ) {
      return true;
    }

    if (
      retryableErrors.includes("MODEL_ERROR") &&
      (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503"))
    ) {
      return true;
    }

    if (
      retryableErrors.includes("NETWORK_ERROR") &&
      (errorMessage.includes("network") || errorMessage.includes("connection"))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if backpressure should be applied
   */
  private shouldApplyBackpressure(): boolean {
    const recentFailures = this.attemptHistory.filter((attempt) => Date.now() - attempt.timestamp < 10000).length; // Last 10 seconds

    return recentFailures > 5; // Apply backpressure if more than 5 failures in 10 seconds
  }

  /**
   * Record retry attempt
   */
  private recordAttempt(attempt: number, delay: number, error: Error): void {
    this.attemptHistory.push({
      attempt,
      delay,
      error,
      timestamp: Date.now(),
    });

    // Keep only recent history
    if (this.attemptHistory.length > this.maxHistorySize) {
      this.attemptHistory.shift();
    }
  }

  /**
   * Get value from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.totalCacheMisses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.totalCacheMisses++;
      return null;
    }

    this.totalCacheHits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  private setCache<T>(key: string, value: T, ttl: number): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Cache statistics
  private totalCacheHits = 0;
  private totalCacheMisses = 0;
}

/**
 * Factory function to create retry manager with default strategies
 */
export function createRetryManager(): RetryManager {
  return new RetryManager();
}
