import { emergencyOtpModel } from '../models/emergencyOtp.js';
import { pickupLogModel } from '../models/pickupLog.js';

export const otpService = {
  requestOtp: async ({ studentId, pickupPersonId, schoolId }) => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = await emergencyOtpModel.create({
      school_id: schoolId,
      student_id: studentId,
      pickup_person_id: pickupPersonId,
      otp_code: randomOtp
    });
    return otp;
  },
  approveOtp: async (otpId, teacherId = 'usr-teacher-1') => {
    const otp = await emergencyOtpModel.approve(otpId);
    if (!otp) return null;

    // Log verified emergency pickup
    await pickupLogModel.create({
      school_id: otp.school_id,
      student_id: otp.student_id,
      student_name: otp.student_name,
      pickup_person_id: otp.pickup_person_id,
      pickup_person_name: otp.pickup_person_name,
      nfc_card_id: null,
      duty_teacher_id: teacherId,
      verification_method: 'EMERGENCY_OTP',
      status: 'VERIFIED',
      notes: `Verifikasi darurat tanpa kartu NFC disetujui via OTP [${otp.otp_code}]`
    });

    return otp;
  }
};
