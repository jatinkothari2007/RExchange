import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      const retrySecs = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retrySecs);
      return res.status(429).json({
        success: false,
        error: {
          type: 'TooManyRequests',
          message: options.message || 'Too many requests, please try again later.',
          retryAfterSeconds: retrySecs,
        },
      });
    }

    record.count += 1;
    return next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

export const listingRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Listing creation limit exceeded. Please slow down.',
});
