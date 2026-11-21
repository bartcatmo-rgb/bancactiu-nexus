/**
 * Limitador de taxa en memòria per a protecció contra atacs de força bruta (ENS / OWASP)
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count += 1;
    return { allowed: true, remaining: this.maxRequests - record.count, resetAt: record.resetAt };
  }

  public reset(key: string): void {
    this.store.delete(key);
  }
}

// Limitadors globals per endpoint
export const loginRateLimiter = new MemoryRateLimiter(5, 60 * 1000); // 5 intents/minut per IP
export const setupPasswordRateLimiter = new MemoryRateLimiter(5, 60 * 1000); // 5 intents/minut per IP
export const searchOnlineRateLimiter = new MemoryRateLimiter(30, 60 * 1000); // 30 req/minut per IP
export const reauthRateLimiter = new MemoryRateLimiter(5, 60 * 1000); // 5 intents/minut per IP
