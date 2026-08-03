import { timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';
import { auditRetentionService } from '../services/auditRetentionService.js';

export const purgeExpiredAuditLogs = async (req, res, next) => {
  try {
    const supplied = Buffer.from(String(req.headers.authorization || ''));
    const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
    const authorized = env.CRON_SECRET.length >= 32
      && supplied.length === expected.length
      && timingSafeEqual(supplied, expected);
    if (!authorized) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED_CRON' });
    }

    const batches = [];
    for (let index = 0; index < 10; index += 1) {
      const result = await auditRetentionService.purgeExpired();
      batches.push(result);
      if (!result.has_more) break;
    }
    const storageFailures = batches.reduce((total, batch) => total + batch.storage_failures, 0);
    const incomplete = Boolean(batches.at(-1)?.has_more);
    const statusCode = storageFailures > 0 ? 503 : incomplete ? 202 : 200;
    return res.status(statusCode).json({
      success: statusCode === 200,
      retention_days: 60,
      deleted: batches.reduce((total, batch) => total + batch.deleted, 0),
      storage_failures: storageFailures,
      batches: batches.length,
      incomplete
    });
  } catch (error) {
    next(error);
  }
};
