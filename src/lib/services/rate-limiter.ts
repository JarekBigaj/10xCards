/**
 * Simple in-memory rate limiter for AI generation endpoint
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed for given user
   */
  isAllowed(userId: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const key = `ai_generation:${userId}`;

    // Clean up expired entries periodically
    this.cleanup(now);

    const entry = this.limits.get(key);

    if (!entry) {
      // First request for this user
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
      };
    }

    if (now >= entry.resetTime) {
      // Window has expired, reset counter
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(now: number): void {
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get current status for user (for debugging)
   */
  getStatus(userId: string): { count: number; resetTime: number } | null {
    const key = `ai_generation:${userId}`;
    return this.limits.get(key) || null;
  }

  /**
   * Reset limits for user (for testing)
   */
  reset(userId: string): void {
    const key = `ai_generation:${userId}`;
    this.limits.delete(key);
  }

  /**
   * Clear all limits (for testing)
   */
  clear(): void {
    this.limits.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

export { rateLimiter, RateLimiter };
