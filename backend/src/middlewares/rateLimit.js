const buckets = new Map();

export const rateLimit = ({ windowMs, max, key = req => req.ip }) => (
  (req, res, next) => {
    const now = Date.now();
    const bucketKey = key(req);
    const current = buckets.get(bucketKey);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
    bucket.count += 1;
    buckets.set(bucketKey, bucket);

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan. Silakan tunggu sebelum mencoba kembali.'
      });
    }
    return next();
  }
);

