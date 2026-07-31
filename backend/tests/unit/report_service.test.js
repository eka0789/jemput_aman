import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportService } from '../../src/services/reportService.js';
import { pickupLogModel } from '../../src/models/pickupLog.js';

const sampleLog = {
  id: 'log-1',
  timestamp: '2026-08-01T08:00:00.000Z',
  student_name: 'Siswa Uji',
  pickup_person_name: 'Penjemput Uji',
  verification_method: 'NFC_TAP',
  status: 'VERIFIED',
  notes: 'Lulus verifikasi'
};

describe('report exports', () => {
  afterEach(() => vi.restoreAllMocks());

  it('generates a readable Excel workbook with the production dependency overrides', async () => {
    vi.spyOn(pickupLogModel, 'findBySchool').mockResolvedValue([sampleLog]);
    const buffer = await reportService.generateExcelReport('school-1');
    expect(Buffer.from(buffer).subarray(0, 2).toString()).toBe('PK');
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('generates a PDF report', async () => {
    vi.spyOn(pickupLogModel, 'findBySchool').mockResolvedValue([sampleLog]);
    const buffer = await reportService.generatePdfReport('school-1');
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
