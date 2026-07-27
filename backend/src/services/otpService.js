import { emergencyOtpModel } from '../models/emergencyOtp.js';
import { pickupLogModel } from '../models/pickupLog.js';
import { models } from '../models/schema.js';
import { createHash, randomInt } from 'crypto';
import { whatsappService } from './whatsappService.js';

const hashOtp = code => createHash('sha256').update(String(code)).digest('hex');

export const otpService = {
  requestOtp: async ({ studentId, pickupPersonId, schoolId }) => {
    const [student, pickupPerson, authorization] = await Promise.all([
      models.students.findById(studentId, schoolId),
      models.pickupPersons.findById(pickupPersonId, schoolId),
      models.authorizations.findValidAuth(studentId, pickupPersonId)
    ]);
    if (
      !student
      || student.status !== 'ACTIVE'
      || !pickupPerson
      || pickupPerson.status !== 'ACTIVE'
      || !authorization
    ) {
      const error = new Error('Siswa dan penjemput harus aktif serta memiliki otorisasi yang sah');
      error.statusCode = 400;
      error.code = 'INVALID_OTP_REQUEST';
      throw error;
    }

    const randomOtp = randomInt(100000, 1000000).toString();
    const otp = await emergencyOtpModel.create({
      school_id: schoolId,
      student_id: studentId,
      pickup_person_id: pickupPersonId,
      otp_code: hashOtp(randomOtp)
    });
    const parent = await models.users.findById(student.parent_id, schoolId);
    const notification = await whatsappService.sendOtpNotification(parent?.phone_number, {
      studentName: student.full_name,
      pickupPersonName: pickupPerson.full_name,
      otpCode: randomOtp,
      expiresInMinutes: 10
    });
    return { ...otp, otp_code: randomOtp, notification };
  },
  approveOtp: async ({
    otpId,
    otpCode,
    schoolId,
    user,
    teacherId = 'usr-teacher-1'
  }) => {
    const pendingOtp = await emergencyOtpModel.findById(otpId, schoolId);
    if (!pendingOtp || pendingOtp.status !== 'PENDING' || new Date(pendingOtp.expires_at) <= new Date()) {
      return null;
    }

    if (user?.role === 'PARENT' && !user.isDevelopmentMock) {
      const student = await models.students.findById(pendingOtp.student_id, schoolId);
      if (!student || student.parent_id !== user.id) {
        const error = new Error('Orang tua tidak berhak menyetujui OTP siswa ini');
        error.statusCode = 403;
        error.code = 'OTP_ACCESS_DENIED';
        throw error;
      }
    }

    const parentOneClickApproval = user?.role === 'PARENT' && !user.isDevelopmentMock;
    const otp = await emergencyOtpModel.approve({
      id: otpId,
      schoolId,
      otpCodeHash: parentOneClickApproval ? null : hashOtp(otpCode)
    });
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
      notes: 'Verifikasi darurat tanpa kartu NFC disetujui menggunakan OTP valid'
    });

    return otp;
  }
};
