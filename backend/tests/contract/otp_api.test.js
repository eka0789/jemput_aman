import { beforeEach, describe, expect, it, vi } from 'vitest';
import { models } from '../../src/models/schema.js';
import { emergencyOtpModel } from '../../src/models/emergencyOtp.js';
import { pickupLogModel } from '../../src/models/pickupLog.js';
import { otpService } from '../../src/services/otpService.js';
import { whatsappService } from '../../src/services/whatsappService.js';

describe('emergency OTP security contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requires a valid active authorization before creating an OTP', async () => {
    vi.spyOn(models.students, 'findById').mockResolvedValue({ id: 'student-1', status: 'ACTIVE' });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({ id: 'person-1', status: 'ACTIVE' });
    vi.spyOn(models.authorizations, 'findValidAuth').mockResolvedValue(null);

    await expect(otpService.requestOtp({
      studentId: 'student-1',
      pickupPersonId: 'person-1',
      schoolId: 'school-1'
    })).rejects.toMatchObject({ code: 'INVALID_OTP_REQUEST', statusCode: 400 });
  });

  it('does not approve an expired OTP', async () => {
    vi.spyOn(emergencyOtpModel, 'findById').mockResolvedValue({
      id: 'otp-1',
      status: 'PENDING',
      expires_at: '2020-01-01T00:00:00.000Z'
    });
    const approve = vi.spyOn(emergencyOtpModel, 'approve');

    const result = await otpService.approveOtp({
      otpId: 'otp-1',
      otpCode: '123456',
      schoolId: 'school-1',
      user: { role: 'TEACHER' }
    });

    expect(result).toBeNull();
    expect(approve).not.toHaveBeenCalled();
  });

  it('rejects the stored OTP when WhatsApp delivery fails', async () => {
    vi.spyOn(models.students, 'findById').mockResolvedValue({
      id: 'student-1', parent_id: 'parent-1', full_name: 'Anak', status: 'ACTIVE'
    });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({
      id: 'person-1', full_name: 'Ayah', status: 'ACTIVE'
    });
    vi.spyOn(models.authorizations, 'findValidAuth').mockResolvedValue({ id: 'auth-1' });
    vi.spyOn(models.users, 'findById').mockResolvedValue({ id: 'parent-1', phone_number: '081234567890' });
    vi.spyOn(emergencyOtpModel, 'create').mockResolvedValue({ id: 'otp-1' });
    const reject = vi.spyOn(emergencyOtpModel, 'reject').mockResolvedValue({ id: 'otp-1', status: 'REJECTED' });
    vi.spyOn(whatsappService, 'sendOtpNotification').mockResolvedValue({
      success: false, status: 'FAILED', message: 'Gateway unavailable'
    });

    await expect(otpService.requestOtp({
      studentId: 'student-1', pickupPersonId: 'person-1', schoolId: 'school-1'
    })).rejects.toMatchObject({ code: 'OTP_DELIVERY_FAILED', statusCode: 502 });
    expect(reject).toHaveBeenCalledWith('otp-1', 'school-1');
  });

  it('approves only through the scoped code check and never logs the OTP value', async () => {
    const otp = {
      id: 'otp-1',
      school_id: 'school-1',
      student_id: 'student-1',
      student_name: 'Anak',
      pickup_person_id: 'person-1',
      pickup_person_name: 'Ayah',
      otp_code: '123456',
      status: 'PENDING',
      expires_at: '2099-01-01T00:00:00.000Z'
    };
    vi.spyOn(emergencyOtpModel, 'findById').mockResolvedValue(otp);
    vi.spyOn(emergencyOtpModel, 'approve').mockResolvedValue({ ...otp, status: 'APPROVED' });
    const createLog = vi.spyOn(pickupLogModel, 'create').mockResolvedValue({
      id: 'log-1',
      status: 'PENDING_PHOTO',
      timestamp: '2026-01-01T00:00:00.000Z'
    });
    vi.spyOn(models.students, 'findById').mockResolvedValue({
      id: 'student-1', full_name: 'Anak', class_name: '1A', photo_url: 's.jpg', parent_id: 'parent-1'
    });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({
      id: 'person-1', full_name: 'Ayah', relationship: 'Ayah', phone_number: '081', photo_url: 'p.jpg'
    });
    vi.spyOn(models.users, 'findById').mockResolvedValue({
      id: 'parent-1', full_name: 'Bunda', phone_number: '081'
    });

    const result = await otpService.approveOtp({
      otpId: 'otp-1',
      otpCode: '123456',
      schoolId: 'school-1',
      user: { role: 'TEACHER' }
    });

    expect(emergencyOtpModel.approve).toHaveBeenCalledWith({
      id: 'otp-1',
      schoolId: 'school-1',
      otpCodeHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect(result.status).toBe('APPROVED');
    expect(createLog.mock.calls[0][0].notes).not.toContain('123456');
  });

  it('creates a PENDING_PHOTO log and surfaces pickup_log_id for the face capture step', async () => {
    const otp = {
      id: 'otp-1',
      school_id: 'school-1',
      student_id: 'student-1',
      student_name: 'Anak',
      pickup_person_id: 'person-1',
      pickup_person_name: 'Ayah (Ayah)',
      status: 'PENDING',
      expires_at: '2099-01-01T00:00:00.000Z'
    };
    vi.spyOn(emergencyOtpModel, 'findById').mockResolvedValue(otp);
    vi.spyOn(emergencyOtpModel, 'approve').mockResolvedValue({ ...otp, status: 'APPROVED' });
    const createLog = vi.spyOn(pickupLogModel, 'create').mockResolvedValue({
      id: 'log-otp-1',
      status: 'PENDING_PHOTO',
      timestamp: '2026-01-01T00:00:00.000Z'
    });
    vi.spyOn(models.students, 'findById').mockResolvedValue({
      id: 'student-1', full_name: 'Anak', class_name: '1A', photo_url: 's.jpg', parent_id: 'parent-1'
    });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({
      id: 'person-1', full_name: 'Ayah', relationship: 'Ayah', phone_number: '081', photo_url: 'p.jpg'
    });
    vi.spyOn(models.users, 'findById').mockResolvedValue({
      id: 'parent-1', full_name: 'Bunda', phone_number: '081'
    });

    const result = await otpService.approveOtp({
      otpId: 'otp-1',
      otpCode: '123456',
      schoolId: 'school-1',
      user: { role: 'TEACHER' }
    });

    expect(createLog.mock.calls[0][0]).toMatchObject({
      verification_method: 'EMERGENCY_OTP',
      status: 'PENDING_PHOTO'
    });
    expect(result.pickup_log_id).toBe('log-otp-1');
    expect(result.verification.status).toBe('PENDING_PHOTO');
    expect(result.verification.data.pickup_log_id).toBe('log-otp-1');
    expect(result.verification.data.student.full_name).toBe('Anak');
    expect(result.verification.data.pickup_person.full_name).toBe('Ayah');
    expect(result.verification.data.verification_photo).toBeNull();
  });
});
