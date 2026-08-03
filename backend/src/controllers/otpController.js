import { otpService } from '../services/otpService.js';
import { emergencyOtpModel } from '../models/emergencyOtp.js';
import { env } from '../config/env.js';
import { models } from '../models/schema.js';

const publicOtp = otp => {
  if (!otp) return otp;
  const { otp_code, ...safeOtp } = otp;
  return safeOtp;
};

export const requestEmergencyOtp = async (req, res, next) => {
  try {
    const { student_id, pickup_person_id } = req.body;
    const schoolId = req.schoolId;

    if (!student_id || !pickup_person_id) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'ID Siswa dan Penjemput wajib diisi' });
    }

    const otp = await otpService.requestOtp({ studentId: student_id, pickupPersonId: pickup_person_id, schoolId });
    res.json({
      success: true,
      message: 'Permintaan pengiriman OTP diterima gateway WhatsApp dan berlaku selama 10 menit',
      data: {
        ...publicOtp(otp),
        expires_in_seconds: 600,
        ...(env.NODE_ENV !== 'production' ? { debug_otp_code: otp.otp_code } : {})
      }
    });
  } catch (err) {
    next(err);
  }
};

export const approveEmergencyOtp = async (req, res, next) => {
  try {
    const { otp_id, otp_code } = req.body;
    const teacherId = req.user?.id || 'usr-teacher-1';

    const parentOneClickApproval = req.user?.role === 'PARENT' && !req.user.isDevelopmentMock;
    if (
      !otp_id
      || (!parentOneClickApproval && !/^\d{6}$/.test(String(otp_code || '')))
    ) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'ID OTP dan kode OTP 6 digit wajib diisi'
      });
    }

    const approved = await otpService.approveOtp({
      otpId: otp_id,
      otpCode: parentOneClickApproval ? null : String(otp_code),
      schoolId: req.schoolId,
      user: req.user,
      teacherId
    });
    if (!approved) {
      return res.status(400).json({
        error: 'OTP_INVALID_OR_EXPIRED',
        message: 'Kode OTP salah, sudah digunakan, atau kedaluwarsa'
      });
    }

    res.json({
      success: true,
      status: approved.verification.status,
      message: approved.verification.message,
      data: approved.verification.data
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingOtps = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const pending = await emergencyOtpModel.findPendingBySchool(schoolId);
    let visible = pending;
    if (req.user?.role === 'PARENT' && !req.user.isDevelopmentMock) {
      const ownership = await Promise.all(
        pending.map(async otp => (
          (await models.students.findById(otp.student_id, schoolId))?.parent_id === req.user.id
        ))
      );
      visible = pending.filter((_, index) => ownership[index]);
    }
    res.json({ success: true, data: visible.map(publicOtp) });
  } catch (err) {
    next(err);
  }
};
