import { otpService } from '../services/otpService.js';
import { emergencyOtpModel } from '../models/emergencyOtp.js';

export const requestEmergencyOtp = async (req, res, next) => {
  try {
    const { student_id, pickup_person_id } = req.body;
    const schoolId = req.schoolId;

    if (!student_id || !pickup_person_id) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'ID Siswa dan Penjemput wajib diisi' });
    }

    const otp = await otpService.requestOtp({ studentId: student_id, pickupPersonId: pickup_person_id, schoolId });
    res.json({ success: true, message: 'Permintaan OTP Darurat berhasil dikirim ke Orang Tua', data: otp });
  } catch (err) {
    next(err);
  }
};

export const approveEmergencyOtp = async (req, res, next) => {
  try {
    const { otp_id } = req.body;
    const teacherId = req.user?.id || 'usr-teacher-1';

    const approved = await otpService.approveOtp(otp_id, teacherId);
    if (!approved) {
      return res.status(404).json({ error: 'OTP_NOT_FOUND', message: 'Permintaan OTP tidak ditemukan' });
    }

    res.json({ success: true, message: 'Verifikasi Darurat OTP Disetujui', data: approved });
  } catch (err) {
    next(err);
  }
};

export const getPendingOtps = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const pending = await emergencyOtpModel.findPendingBySchool(schoolId);
    res.json({ success: true, data: pending });
  } catch (err) {
    next(err);
  }
};
