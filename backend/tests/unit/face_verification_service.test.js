import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faceVerificationService } from '../../src/services/faceVerificationService.js';
import { models } from '../../src/models/schema.js';
import { pickupLogModel } from '../../src/models/pickupLog.js';

describe('faceVerificationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validDataUrl = 'data:image/jpeg;base64,' + Buffer.from('test-image-data-with-sufficient-length-for-entropy-and-variance-test-1234567890').toString('base64');

  it('rejects if student is inactive or missing', async () => {
    vi.spyOn(models.students, 'findById').mockResolvedValue(null);
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({ id: 'p1', status: 'ACTIVE' });
    vi.spyOn(models.authorizations, 'findValidAuth').mockResolvedValue({ id: 'auth1' });

    await expect(faceVerificationService.verifyLiveFaceAgainstReference({
      schoolId: 'sch-1',
      studentId: 'st-missing',
      pickupPersonId: 'p1',
      livePhoto: validDataUrl
    })).rejects.toThrow('Siswa tidak ditemukan atau status tidak aktif');
  });

  it('rejects if liveness detection anti-spoofing fails', async () => {
    vi.spyOn(models.students, 'findById').mockResolvedValue({ id: 'st1', status: 'ACTIVE', full_name: 'Budi' });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({ id: 'p1', status: 'ACTIVE', full_name: 'Ayah' });
    vi.spyOn(models.authorizations, 'findValidAuth').mockResolvedValue({ id: 'auth1' });

    const result = await faceVerificationService.verifyLiveFaceAgainstReference({
      schoolId: 'sch-1',
      studentId: 'st1',
      pickupPersonId: 'p1',
      livePhoto: validDataUrl,
      livenessData: { blinkCount: 0, motionScore: 0.01, passed: false }
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe('SPOOF_DETECTED');
    expect(result.message).toContain('Anti-Spoofing');
  });

  it('verifies successfully when liveness passes and face matches reference photo', async () => {
    vi.spyOn(models.students, 'findById').mockResolvedValue({ id: 'st1', status: 'ACTIVE', full_name: 'Budi' });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({
      id: 'p1',
      status: 'ACTIVE',
      full_name: 'Ayah',
      relationship: 'AYAH',
      photo_url: validDataUrl
    });
    vi.spyOn(models.authorizations, 'findValidAuth').mockResolvedValue({ id: 'auth1' });
    vi.spyOn(pickupLogModel, 'create').mockResolvedValue({
      id: 'log-face-1',
      timestamp: new Date().toISOString()
    });

    const result = await faceVerificationService.verifyLiveFaceAgainstReference({
      schoolId: 'sch-1',
      studentId: 'st1',
      pickupPersonId: 'p1',
      livePhoto: validDataUrl,
      livenessData: { blinkCount: 2, motionScore: 0.25, passed: true }
    });

    expect(result.verified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.data.verification_method).toBe('FACE_BIOMETRIC_LIVENESS');
    expect(pickupLogModel.create).toHaveBeenCalled();
  });
});
