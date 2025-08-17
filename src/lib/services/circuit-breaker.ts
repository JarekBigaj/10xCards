import { CircuitBreakerState } from "../../types";

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  threshold: number; // Number of failures before opening
  timeout: number; // Time in ms before attempting to close
  halfOpenMaxRequests: number; // Max requests in half-open state
  windowSize: number; // Time window for failure counting (ms)
  minRequestCount: number; // Min requests before considering failure rate
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  failureRate: number;
  averageResponseTime: number;
  stateChangeHistory: {
    from: CircuitBreakerState;
    to: CircuitBreakerState;
    timestamp: number;
    reason: string;
  }[];
}

/**
 * Advanced circuit breaker implementation with metrics and monitoring
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private lastStateChange = Date.now();
  private halfOpenRequestCount = 0;
  private responseTimes: number[] = [];
  private readonly config: CircuitBreakerConfig;
  private readonly stateChangeHistory: {
    from: CircuitBreakerState;
    to: CircuitBreakerState;
    timestamp: number;
    reason: string;
  }[] = [];

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      threshold: 5,
      timeout: 60000, // 1 minute
      halfOpenMaxRequests: 3,
      windowSize: 300000, // 5 minutes
      minRequestCount: 10,
      ...config,
    };
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Check if circuit breaker allows requests
   */
  canExecute(): boolean {
    this.updateState();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;
      case CircuitBreakerState.OPEN:
        return false;
      case CircuitBreakerState.HALF_OPEN:
        return this.halfOpenRequestCount < this.config.halfOpenMaxRequests;
      default:
        return false;
    }
  }

  /**
   * Record successful execution
   */
  onSuccess(responseTime?: number): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (responseTime !== undefined) {
      this.recordResponseTime(responseTime);
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.close("Successful request in half-open state");
    }
  }

  /**
   * Record failed execution
   */
  onFailure(responseTime?: number): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (responseTime !== undefined) {
      this.recordResponseTime(responseTime);
    }

    this.updateState();
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, timeoutMs?: number): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is ${this.state.toLowerCase()}`);
    }

    const startTime = Date.now();
    let responseTime: number;

    try {
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenRequestCount++;
      }

      const result = await this.executeWithTimeout(operation, timeoutMs);
      responseTime = Date.now() - startTime;

      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      responseTime = Date.now() - startTime;
      this.onFailure(responseTime);
      throw error;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const totalRequests = this.successCount + this.failureCount;
    const failureRate = totalRequests > 0 ? this.failureCount / totalRequests : 0;
    const averageResponseTime =
      this.responseTimes.length > 0 ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;

    return {
      totalRequests,
      successfulRequests: this.successCount,
      failedRequests: this.failureCount,
      lastFailureTime: this.lastFailureTime || undefined,
      lastSuccessTime: this.lastSuccessTime || undefined,
      failureRate,
      averageResponseTime,
      stateChangeHistory: [...this.stateChangeHistory],
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.changeState(CircuitBreakerState.CLOSED, "Manual reset");
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequestCount = 0;
    this.responseTimes = [];
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(reason = "Forced open"): void {
    this.changeState(CircuitBreakerState.OPEN, reason);
  }

  /**
   * Update circuit breaker state based on current conditions
   */
  private updateState(): void {
    const now = Date.now();
    const timeSinceLastFailure = now - this.lastFailureTime;
    const totalRequests = this.successCount + this.failureCount;

    // Check if we should close the circuit breaker
    if (this.state === CircuitBreakerState.OPEN && timeSinceLastFailure >= this.config.timeout) {
      this.changeState(CircuitBreakerState.HALF_OPEN, "Timeout expired, testing recovery");
      this.halfOpenRequestCount = 0;
      return;
    }

    // Check if we should open the circuit breaker
    if (
      this.state === CircuitBreakerState.CLOSED &&
      totalRequests >= this.config.minRequestCount &&
      this.failureCount >= this.config.threshold
    ) {
      const failureRate = this.failureCount / totalRequests;
      if (failureRate >= 0.5) {
        // 50% failure rate threshold
        this.changeState(CircuitBreakerState.OPEN, `High failure rate: ${(failureRate * 100).toFixed(1)}%`);
      }
    }

    // Check if we should close from half-open
    if (this.state === CircuitBreakerState.HALF_OPEN && this.halfOpenRequestCount >= this.config.halfOpenMaxRequests) {
      this.changeState(CircuitBreakerState.CLOSED, "Recovery successful");
      this.halfOpenRequestCount = 0;
    }
  }

  /**
   * Change circuit breaker state
   */
  private changeState(newState: CircuitBreakerState, reason: string): void {
    if (this.state === newState) {
      return;
    }

    const fromState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    this.stateChangeHistory.push({
      from: fromState,
      to: newState,
      timestamp: Date.now(),
      reason,
    });

    // Keep only last 100 state changes
    if (this.stateChangeHistory.length > 100) {
      this.stateChangeHistory.shift();
    }

    // Log state change (in production, use proper logging)
    // console.log(`Circuit breaker: ${fromState} → ${newState} (${reason})`);
  }

  /**
   * Close circuit breaker
   */
  private close(reason: string): void {
    this.changeState(CircuitBreakerState.CLOSED, reason);
    this.failureCount = 0;
    this.halfOpenRequestCount = 0;
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs?: number): Promise<T> {
    if (!timeoutMs) {
      return operation();
    }

    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out")), timeoutMs);
      }),
    ]);
  }

  /**
   * Get circuit breaker health status
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  /**
   * Get time until next state change attempt
   */
  getTimeUntilNextAttempt(): number {
    if (this.state !== CircuitBreakerState.OPEN) {
      return 0;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    const timeRemaining = this.config.timeout - timeSinceLastFailure;

    return Math.max(0, timeRemaining);
  }
}
