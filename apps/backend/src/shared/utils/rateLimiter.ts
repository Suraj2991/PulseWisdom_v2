import { config } from '../config';

export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }>;
  private windowMs: number;
  private maxRequests: number;

  constructor(
    windowMs: number = config.rateLimitWindowMs,
    maxRequests: number = config.rateLimitMax
  ) {
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