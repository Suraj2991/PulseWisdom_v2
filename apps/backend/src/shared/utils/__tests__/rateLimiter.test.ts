import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('refresh_token rate limiting', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isRateLimited('refresh_token')).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited('refresh_token');
      }
      expect(rateLimiter.isRateLimited('refresh_token')).toBe(true);
    });

    it('should reset after window period', () => {
      // Simulate time passing
      jest.useFakeTimers();
      
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited('refresh_token');
      }
      
      // Advance time by 2 minutes (beyond the 1-minute window)
      jest.advanceTimersByTime(120000);
      
      expect(rateLimiter.isRateLimited('refresh_token')).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('login rate limiting', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isRateLimited('login')).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited('login');
      }
      expect(rateLimiter.isRateLimited('login')).toBe(true);
    });
  });

  describe('register rate limiting', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.isRateLimited('register')).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 3; i++) {
        rateLimiter.isRateLimited('register');
      }
      expect(rateLimiter.isRateLimited('register')).toBe(true);
    });
  });

  describe('custom rate limiting', () => {
    it('should apply custom configuration', () => {
      rateLimiter.setConfig('custom', { maxAttempts: 2, windowMs: 1000 });
      
      expect(rateLimiter.isRateLimited('custom')).toBe(false);
      expect(rateLimiter.isRateLimited('custom')).toBe(false);
      expect(rateLimiter.isRateLimited('custom')).toBe(true);
    });
  });

  describe('reset functionality', () => {
    it('should reset rate limiting for a key', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited('refresh_token');
      }
      
      rateLimiter.reset('refresh_token');
      expect(rateLimiter.isRateLimited('refresh_token')).toBe(false);
    });
  });

  describe('remaining attempts', () => {
    it('should return correct remaining attempts', () => {
      expect(rateLimiter.getRemainingAttempts('refresh_token')).toBe(5);
      
      rateLimiter.isRateLimited('refresh_token');
      expect(rateLimiter.getRemainingAttempts('refresh_token')).toBe(4);
      
      rateLimiter.isRateLimited('refresh_token');
      expect(rateLimiter.getRemainingAttempts('refresh_token')).toBe(3);
    });

    it('should return 0 when rate limited', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited('refresh_token');
      }
      expect(rateLimiter.getRemainingAttempts('refresh_token')).toBe(0);
    });
  });

  describe('reset time', () => {
    it('should return correct reset time', () => {
      rateLimiter.isRateLimited('refresh_token');
      const resetTime = rateLimiter.getResetTime('refresh_token');
      expect(resetTime).toBeGreaterThan(Date.now());
    });

    it('should return 0 for non-existent key', () => {
      expect(rateLimiter.getResetTime('non_existent')).toBe(0);
    });
  });
}); 