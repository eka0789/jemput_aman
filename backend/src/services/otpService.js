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
    if (!notification.success) {
      await emergencyOtpModel.reject(otp.id, schoolId);
      const error = new Error(`OTP tidak dikirim ke WhatsApp orang tua: ${notification.message}`);
      error.statusCode = 502;
      error.code = 'OTP_DELIVERY_FAILED';
      error.notification = notification;
      throw error;
    }
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

    // Fetch fresh student/pickup_person/parent for the gate reader photo UI.
    const [student, pickupPerson, parent] = await Promise.all([
      models.students.findById(otp.student_id, otp.school_id),
      models.pickupPersons.findById(otp.pickup_person_id, otp.school_id),
      models.students.findById(otp.student_id, otp.school_id).then(s => (
        s?.parent_id ? models.users.findById(s.parent_id, otp.school_id) : null
      ))
    ]);

    // Create pickup log in PENDING_PHOTO state: the face verification photo
    // must still be captured at the gate before the student may leave, exactly
    // like the NFC tap flow (nfcService.verifyTap). Notifikasi penjemputan
    // di-dispatch oleh attachVerificationPhoto saat foto terlampir.
    const log = await pickupLogModel.create({
      school_id: otp.school_id,
      student_id: otp.student_id,
      student_name: otp.student_name,
      pickup_person_id: otp.pickup_person_id,
      pickup_person_name: otp.pickup_person_name,
      nfc_card_id: null,
      duty_teacher_id: teacherId,
      verification_method: 'EMERGENCY_OTP',
      status: 'PENDING_PHOTO',
      notes: 'Verifikasi darurat tanpa kartu NFC — OTP valid, menunggu foto wajah penjemput'
    });

    return {
      ...otp,
      pickup_log_id: log.id,
      verification: {
        status: log.status,
        message: 'OTP valid. Foto wajah penjemput wajib diambil untuk menyelesaikan verifikasi.',
        data: {
          pickup_log_id: log.id,
          student: student
            ? { id: student.id, full_name: student.full_name, class_name: student.class_name, photo_url: student.photo_url }
            : { id: otp.student_id, full_name: otp.student_name, class_name: '', photo_url: null },
          pickup_person: pickupPerson
            ? { id: pickupPerson.id, full_name: pickupPerson.full_name, relationship: pickupPerson.relationship, phone_number: pickupPerson.phone_number, photo_url: pickupPerson.photo_url }
            : { id: otp.pickup_person_id, full_name: otp.pickup_person_name, relationship: '', phone_number: null, photo_url: null },
          parent: parent ? { id: parent.id, full_name: parent.full_name, phone_number: parent.phone_number } : null,
          timestamp: log.timestamp,
          notification_sent: false,
          verification_photo: null
        }
      }
    };
  }
};
