import { otpService } from '../services/otpService.js';
import { emergencyOtpModel } from '../models/emergencyOtp.js';

export const requestEmergencyOtp = (req, res) => {
  const { student_id, pickup_person_id } = req.body;
  const schoolId = req.schoolId;

  if (!student_id || !pickup_person_id) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'ID Siswa dan Penjemput wajib diisi' });
  }

  const otp = otpService.requestOtp({ studentId: student_id, pickupPersonId: pickup_person_id, schoolId });
  res.json({ success: true, message: 'Permintaan OTP Darurat berhasil dikirim ke Orang Tua', data: otp });
};

export const approveEmergencyOtp = (req, res) => {
  const { otp_id } = req.body;
  const teacherId = req.user?.id || 'usr-teacher-1';

  const approved = otpService.approveOtp(otp_id, teacherId);
  if (!approved) {
    return res.status(404).json({ error: 'OTP_NOT_FOUND', message: 'Permintaan OTP tidak ditemukan' });
  }

  res.json({ success: true, message: 'Verifikasi Darurat OTP Disetujui', data: approved });
};

export const getPendingOtps = (req, res) => {
  const schoolId = req.schoolId;
  const pending = emergencyOtpModel.findPendingBySchool(schoolId);
  res.json({ success: true, data: pending });
};
