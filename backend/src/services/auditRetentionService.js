import { pickupLogModel } from '../models/pickupLog.js';
import { reportExportModel } from '../models/reportExport.js';
import { storageService } from './storageService.js';

export const AUDIT_RETENTION_DAYS = 60;
export const EXPORT_REMINDER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const isStoragePath = value => (
  typeof value === 'string'
  && !value.startsWith('data:')
  && !/^https?:\/\//i.test(value)
);

export const auditRetentionService = {
  purgeExpired: async ({ now = new Date(), batchSize = 500 } = {}) => {
    const cutoff = addDays(now, -AUDIT_RETENTION_DAYS);
    const expired = await pickupLogModel.findExpired(cutoff.toISOString(), batchSize);
    const deletableIds = expired
      .filter(log => !isStoragePath(log.verification_photo))
      .map(log => log.id);
    const storageFailures = [];
    const logsWithPhotos = expired.filter(log => isStoragePath(log.verification_photo));
    for (let index = 0; index < logsWithPhotos.length; index += 100) {
      const chunk = logsWithPhotos.slice(index, index + 100);
      try {
        await storageService.removeMany(chunk.map(log => log.verification_photo));
        deletableIds.push(...chunk.map(log => log.id));
      } catch (error) {
        storageFailures.push(...chunk.map(log => ({ id: log.id, message: error.message })));
      }
    }

    const deleted = await pickupLogModel.deleteByIds(deletableIds);
    return {
      cutoff: cutoff.toISOString(),
      scanned: expired.length,
      deleted: deleted.length,
      storage_failures: storageFailures.length,
      has_more: expired.length === batchSize && deleted.length > 0
    };
  },

  getStatus: async ({ schoolId, now = new Date() }) => {
    const [latestExport, oldestLog, totalLogs] = await Promise.all([
      reportExportModel.findLatestBySchool(schoolId),
      pickupLogModel.findOldestBySchool(schoolId),
      pickupLogModel.countBySchool(schoolId)
    ]);
    const reminderBase = latestExport?.exported_at
      ? new Date(latestExport.exported_at)
      : oldestLog?.timestamp
        ? new Date(oldestLog.timestamp)
        : now;
    const nextExportDue = addDays(reminderBase, EXPORT_REMINDER_DAYS);
    const nextDeletionAt = oldestLog?.timestamp
      ? addDays(new Date(oldestLog.timestamp), AUDIT_RETENTION_DAYS)
      : null;

    return {
      retention_days: AUDIT_RETENTION_DAYS,
      export_reminder_days: EXPORT_REMINDER_DAYS,
      total_logs: totalLogs,
      oldest_log_at: oldestLog?.timestamp || null,
      last_export_at: latestExport?.exported_at || null,
      last_export_format: latestExport?.format || null,
      next_export_due_at: nextExportDue.toISOString(),
      export_due: totalLogs > 0 && now >= nextExportDue,
      next_deletion_at: nextDeletionAt?.toISOString() || null
    };
  }
};
