import type { CircuitBreakerState } from "../../types";

/**
 * Metric types for OpenRouter service
 */
export interface ServiceMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestRate: number; // requests per minute

  // Response time metrics
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimePercentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };

  // Error metrics
  errorRate: number;
  errorBreakdown: Record<string, number>;

  // Circuit breaker metrics
  circuitBreakerState: CircuitBreakerState;
  circuitBreakerTransitions: number;
  timeInCurrentState: number;

  // Cache metrics
  cacheHitRate: number;
  cacheSize: number;
  cacheEvictions: number;

  // Retry metrics
  retryRate: number;
  averageRetriesPerRequest: number;

  // System metrics
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    service: HealthCheck;
    circuitBreaker: HealthCheck;
    api: HealthCheck;
    cache: HealthCheck;
  };
  overall: {
    message: string;
    details: string[];
  };
}

/**
 * Individual health check
 */
export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: Record<string, unknown>;
  lastCheck: string;
}

/**
 * Metrics collector for OpenRouter service
 */
export class OpenRouterMetricsCollector {
  private readonly startTime: number;
  private readonly requestTimes: number[] = [];
  private readonly errorCounts: Record<string, number> = {};
  private readonly maxRequestTimes = 1000;
  private lastRequestCount = 0;
  private lastRequestTime = Date.now();

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record successful request
   */
  recordSuccess(responseTime: number): void {
    this.recordRequestTime(responseTime);
  }

  /**
   * Record failed request
   */
  recordFailure(errorCode: string, responseTime: number): void {
    this.recordRequestTime(responseTime);
    this.errorCounts[errorCode] = (this.errorCounts[errorCode] || 0) + 1;
  }

  /**
   * Record circuit breaker state change
   */
  recordCircuitBreakerChange(from: CircuitBreakerState, to: CircuitBreakerState): void {
    // This would typically be stored in a more persistent way
    // For now, we'll just track it in memory
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(hit: boolean): void {
    // Cache metrics would be tracked here
  }

  /**
   * Record retry attempt
   */
  recordRetryAttempt(attempt: number): void {
    // Retry metrics would be tracked here
  }

  /**
   * Get current metrics
   */
  getMetrics(): ServiceMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;
    const totalRequests = this.requestTimes.length;
    const successfulRequests = totalRequests - Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
    const failedRequests = totalRequests - successfulRequests;

    // Calculate request rate (requests per minute)
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requestRate =
      timeSinceLastRequest > 0 ? (totalRequests - this.lastRequestCount) / (timeSinceLastRequest / 60000) : 0;

    // Calculate response time percentiles
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    const percentiles = this.calculatePercentiles(sortedTimes);

    // Calculate error rate
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      requestRate,
      averageResponseTime:
        this.requestTimes.length > 0 ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length : 0,
      minResponseTime: this.requestTimes.length > 0 ? Math.min(...this.requestTimes) : 0,
      maxResponseTime: this.requestTimes.length > 0 ? Math.max(...this.requestTimes) : 0,
      responseTimePercentiles: percentiles,
      errorRate,
      errorBreakdown: { ...this.errorCounts },
      circuitBreakerState: "CLOSED" as CircuitBreakerState, // This would come from circuit breaker
      circuitBreakerTransitions: 0, // This would be tracked
      timeInCurrentState: 0, // This would be calculated
      cacheHitRate: 0, // This would come from cache
      cacheSize: 0, // This would come from cache
      cacheEvictions: 0, // This would be tracked
      retryRate: 0, // This would be calculated
      averageRetriesPerRequest: 0, // This would be calculated
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0, // This would require system monitoring
      uptime,
    };
  }

  /**
   * Perform health check
   */
  performHealthCheck(): HealthCheckResult {
    const now = new Date().toISOString();
    const metrics = this.getMetrics();

    // Service health check
    const serviceCheck: HealthCheck = {
      name: "service",
      status: metrics.errorRate < 0.1 ? "pass" : metrics.errorRate < 0.3 ? "warn" : "fail",
      message: `Service is ${metrics.errorRate < 0.1 ? "healthy" : metrics.errorRate < 0.3 ? "degraded" : "unhealthy"}`,
      details: {
        errorRate: metrics.errorRate,
        requestRate: metrics.requestRate,
        uptime: metrics.uptime,
      },
      lastCheck: now,
    };

    // Circuit breaker health check
    const circuitBreakerCheck: HealthCheck = {
      name: "circuit_breaker",
      status: metrics.circuitBreakerState === "CLOSED" ? "pass" : "warn",
      message: `Circuit breaker is ${metrics.circuitBreakerState.toLowerCase()}`,
      details: {
        state: metrics.circuitBreakerState,
        transitions: metrics.circuitBreakerTransitions,
      },
      lastCheck: now,
    };

    // API health check
    const apiCheck: HealthCheck = {
      name: "api",
      status: metrics.averageResponseTime < 5000 ? "pass" : metrics.averageResponseTime < 10000 ? "warn" : "fail",
      message: `API response time is ${metrics.averageResponseTime < 5000 ? "good" : metrics.averageResponseTime < 10000 ? "acceptable" : "poor"}`,
      details: {
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.responseTimePercentiles.p95,
      },
      lastCheck: now,
    };

    // Cache health check
    const cacheCheck: HealthCheck = {
      name: "cache",
      status: metrics.cacheHitRate > 0.7 ? "pass" : metrics.cacheHitRate > 0.5 ? "warn" : "fail",
      message: `Cache hit rate is ${metrics.cacheHitRate > 0.7 ? "good" : metrics.cacheHitRate > 0.5 ? "acceptable" : "poor"}`,
      details: {
        hitRate: metrics.cacheHitRate,
        size: metrics.cacheSize,
      },
      lastCheck: now,
    };

    // Determine overall status
    const checks = [serviceCheck, circuitBreakerCheck, apiCheck, cacheCheck];
    const failedChecks = checks.filter((check) => check.status === "fail");
    const warningChecks = checks.filter((check) => check.status === "warn");

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    let overallMessage: string;
    const details: string[] = [];

    if (failedChecks.length > 0) {
      overallStatus = "unhealthy";
      overallMessage = `${failedChecks.length} health check(s) failed`;
      failedChecks.forEach((check) => details.push(`${check.name}: ${check.message}`));
    } else if (warningChecks.length > 0) {
      overallStatus = "degraded";
      overallMessage = `${warningChecks.length} health check(s) have warnings`;
      warningChecks.forEach((check) => details.push(`${check.name}: ${check.message}`));
    } else {
      overallStatus = "healthy";
      overallMessage = "All health checks passed";
    }

    return {
      status: overallStatus,
      timestamp: now,
      checks: {
        service: serviceCheck,
        circuitBreaker: circuitBreakerCheck,
        api: apiCheck,
        cache: cacheCheck,
      },
      overall: {
        message: overallMessage,
        details,
      },
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.requestTimes.length = 0;
    Object.keys(this.errorCounts).forEach((key) => delete this.errorCounts[key]);
    this.lastRequestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Record request time
   */
  private recordRequestTime(responseTime: number): void {
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift();
    }
  }

  /**
   * Calculate percentiles from sorted array
   */
  private calculatePercentiles(sortedTimes: number[]): ServiceMetrics["responseTimePercentiles"] {
    if (sortedTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const p50 = this.getPercentile(sortedTimes, 50);
    const p90 = this.getPercentile(sortedTimes, 90);
    const p95 = this.getPercentile(sortedTimes, 95);
    const p99 = this.getPercentile(sortedTimes, 99);

    return { p50, p90, p95, p99 };
  }

  /**
   * Get percentile value from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get memory usage (simplified)
   */
  private getMemoryUsage(): number {
    // In a real implementation, this would use process.memoryUsage() or similar
    // For now, return a placeholder value
    return 0;
  }
}

/**
 * Factory function to create metrics collector
 */
export function createOpenRouterMetricsCollector(): OpenRouterMetricsCollector {
  return new OpenRouterMetricsCollector();
}
