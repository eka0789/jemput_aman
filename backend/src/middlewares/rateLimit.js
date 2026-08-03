import { env } from '../config/env.js';
import { assertSupabaseConfigured } from '../config/supabase.js';

const buckets = new Map();

const checkMemoryLimit = ({ bucketKey, windowMs, max }) => {
  const now = Date.now();
  const current = buckets.get(bucketKey);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  buckets.set(bucketKey, bucket);
  return {
    allowed: bucket.count <= max,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
};

export const rateLimit = ({ windowMs, max, key = req => req.ip }) => (
  async (req, res, next) => {
    try {
      const bucketKey = key(req);
      let result;
      if (env.NODE_ENV === 'production') {
        const { data, error } = await assertSupabaseConfigured().rpc('check_api_rate_limit', {
          p_key: bucketKey,
          p_window_seconds: Math.ceil(windowMs / 1000),
          p_max: max
        });
        if (error) throw new Error(`Rate limiter tidak tersedia: ${error.message}`);
        const row = Array.isArray(data) ? data[0] : data;
        result = {
          allowed: Boolean(row?.allowed),
          retryAfter: Math.max(1, Number(row?.retry_after || 1))
        };
      } else {
        result = checkMemoryLimit({ bucketKey, windowMs, max });
      }

      if (result.allowed) return next();
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan. Silakan tunggu sebelum mencoba kembali.'
      });
    } catch (error) {
      error.statusCode = 503;
      error.code = 'RATE_LIMIT_UNAVAILABLE';
      return next(error);
    }
  }
);
