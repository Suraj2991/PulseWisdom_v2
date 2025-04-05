interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.attempts = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key) || { count: 0, timestamp: now };

    if (now - attempt.timestamp > this.windowMs) {
      attempt.count = 0;
      attempt.timestamp = now;
    }

    attempt.count++;
    this.attempts.set(key, attempt);

    return attempt.count > this.maxRequests;
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }

  clearAll(): void {
    this.attempts.clear();
  }
} 