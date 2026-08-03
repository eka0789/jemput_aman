import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pickupLogModel } from '../../src/models/pickupLog.js';
import { reportExportModel } from '../../src/models/reportExport.js';
import { auditRetentionService } from '../../src/services/auditRetentionService.js';
import { storageService } from '../../src/services/storageService.js';
import { purgeExpiredAuditLogs } from '../../src/controllers/cronController.js';
import { env } from '../../src/config/env.js';

describe('Audit retention service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes logs older than 60 days together with stored verification photos', async () => {
    vi.spyOn(pickupLogModel, 'findExpired').mockResolvedValue([
      { id: 'log-1', verification_photo: 'school/verification/log-1/photo.jpg' },
      { id: 'log-2', verification_photo: null }
    ]);
    const removeMany = vi.spyOn(storageService, 'removeMany').mockResolvedValue(undefined);
    vi.spyOn(pickupLogModel, 'deleteByIds').mockImplementation(async ids => ids.map(id => ({ id })));

    const result = await auditRetentionService.purgeExpired({
      now: new Date('2026-08-01T00:00:00.000Z')
    });

    expect(pickupLogModel.findExpired).toHaveBeenCalledWith('2026-06-02T00:00:00.000Z', 500);
    expect(removeMany).toHaveBeenCalledWith(['school/verification/log-1/photo.jpg']);
    expect(result.deleted).toBe(2);
    expect(result.storage_failures).toBe(0);
  });

  it('keeps a log for retry when its photo cannot be deleted', async () => {
    vi.spyOn(pickupLogModel, 'findExpired').mockResolvedValue([
      { id: 'log-1', verification_photo: 'school/verification/log-1/photo.jpg' }
    ]);
    vi.spyOn(storageService, 'removeMany').mockRejectedValue(new Error('Storage unavailable'));
    const deleteByIds = vi.spyOn(pickupLogModel, 'deleteByIds').mockResolvedValue([]);

    const result = await auditRetentionService.purgeExpired();

    expect(deleteByIds).toHaveBeenCalledWith([]);
    expect(result.deleted).toBe(0);
    expect(result.storage_failures).toBe(1);
  });

  it('raises the monthly reminder 30 days after the oldest unexported log', async () => {
    vi.spyOn(reportExportModel, 'findLatestBySchool').mockResolvedValue(null);
    vi.spyOn(pickupLogModel, 'findOldestBySchool').mockResolvedValue({
      timestamp: '2026-06-01T00:00:00.000Z'
    });
    vi.spyOn(pickupLogModel, 'countBySchool').mockResolvedValue(12);

    const status = await auditRetentionService.getStatus({
      schoolId: 'school-1',
      now: new Date('2026-07-01T00:00:01.000Z')
    });

    expect(status.export_due).toBe(true);
    expect(status.next_export_due_at).toBe('2026-07-01T00:00:00.000Z');
    expect(status.next_deletion_at).toBe('2026-07-31T00:00:00.000Z');
  });

  it('resets the monthly reminder after a successful export', async () => {
    vi.spyOn(reportExportModel, 'findLatestBySchool').mockResolvedValue({
      exported_at: '2026-07-20T00:00:00.000Z', format: 'excel'
    });
    vi.spyOn(pickupLogModel, 'findOldestBySchool').mockResolvedValue({
      timestamp: '2026-07-01T00:00:00.000Z'
    });
    vi.spyOn(pickupLogModel, 'countBySchool').mockResolvedValue(5);

    const status = await auditRetentionService.getStatus({
      schoolId: 'school-1',
      now: new Date('2026-08-01T00:00:00.000Z')
    });

    expect(status.export_due).toBe(false);
    expect(status.next_export_due_at).toBe('2026-08-19T00:00:00.000Z');
  });

  it('blocks retention cron calls without the dedicated bearer secret', async () => {
    const originalSecret = env.CRON_SECRET;
    env.CRON_SECRET = 'cron-secret-test';
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    try {
      await purgeExpiredAuditLogs({ headers: {} }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'UNAUTHORIZED_CRON' });
    } finally {
      env.CRON_SECRET = originalSecret;
    }
  });
});
