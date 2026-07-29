import { models } from '../models/schema.js';
import { pickupLogModel } from '../models/pickupLog.js';
import { storageService } from './storageService.js';
import { scheduleModel } from '../models/schedule.js';
import { env } from '../config/env.js';

const DAY_CODES = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN'
};

const dayCodeFor = date => DAY_CODES[
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: env.APP_TIME_ZONE
  }).format(date)
];

const storeVerificationPhoto = async ({ pickupLogId, schoolId, facePhoto }) => {
  const uploaded = await storageService.uploadVerificationPhoto({
    schoolId,
    pickupLogId,
    dataUrl: facePhoto
  });

  try {
    const log = await pickupLogModel.finalizeVerificationPhoto(
      pickupLogId,
      schoolId,
      uploaded.path
    );

    if (!log) {
      await storageService.remove(uploaded.path);
      return null;
    }

    return log;
  } catch (error) {
    try {
      await storageService.remove(uploaded.path);
    } catch {
      // Keep the original database error as the actionable failure.
    }
    throw error;
  }
};

export const nfcService = {
  verifyTap: async ({
    cardUid,
    studentId,
    schoolId,
    teacherId = 'usr-teacher-1',
    facePhoto = null,
    verificationDate = new Date(),
    simulationMode = false
  }) => {
    // 1. Find NFC card in store
    const card = await models.nfcCards.findByUid(cardUid, schoolId);

    if (!card) {
      // Record unknown card attempt log
      await pickupLogModel.create({
        school_id: schoolId,
        student_id: studentId || 'UNKNOWN',
        student_name: studentId ? 'Siswa ' + studentId : 'Tidak Diketahui',
        pickup_person_id: null,
        pickup_person_name: 'Penjemput Tak Dikenal',
        nfc_card_id: null,
        duty_teacher_id: teacherId,
        verification_method: 'NFC_TAP',
        status: 'BLOCKED',
        notes: `Kartu NFC UID [${cardUid}] tidak terdaftar di sistem`
      });

      return {
        status: 'BLOCKED',
        code: 'CARD_UNREGISTERED',
        message: 'AKSES DITOLAK: Kartu NFC Tidak Terdaftar di Sistem Sekolah',
        alert_dispatched: true
      };
    }

    if (card.status !== 'ACTIVE') {
      await pickupLogModel.create({
        school_id: schoolId,
        student_id: studentId || 'UNKNOWN',
        student_name: 'Siswa ' + (studentId || 'Terikat'),
        pickup_person_id: card.pickup_person_id,
        pickup_person_name: 'Kartu Nonaktif/Hilang',
        nfc_card_id: card.id,
        duty_teacher_id: teacherId,
        verification_method: 'NFC_TAP',
        status: 'BLOCKED',
        notes: `Percobaan pengetapan kartu berstatus [${card.status}]`
      });

      return {
        status: 'BLOCKED',
        code: 'CARD_DISABLED',
        message: `AKSES DITOLAK: Kartu NFC Telah Berstatus ${card.status.toUpperCase()}`,
        alert_dispatched: true
      };
    }

    // 2. Find linked Pickup Person
    const pickupPerson = await models.pickupPersons.findById(card.pickup_person_id, schoolId);
    if (!pickupPerson || pickupPerson.status !== 'ACTIVE') {
      return {
        status: 'BLOCKED',
        code: 'PICKUP_PERSON_INACTIVE',
        message: 'AKSES DITOLAK: Profil Penjemput Terkait Tidak Aktif',
        alert_dispatched: true
      };
    }

    // 3. Find authorized students for this pickup person
    const auths = await models.authorizations.findByPickupPerson(pickupPerson.id);
    if (!auths || auths.length === 0) {
      return {
        status: 'BLOCKED',
        code: 'NO_AUTHORIZED_STUDENT',
        message: 'AKSES DITOLAK: Penjemput Tidak Memiliki Siswa Terikat yang Sah',
        alert_dispatched: true
      };
    }

    // If specific student ID passed, verify link
    let targetStudent = null;
    if (studentId) {
      targetStudent = await models.students.findById(studentId, schoolId);
      const isLinked = auths.some(a => a.student_id === studentId);
      if (!isLinked || !targetStudent) {
        await pickupLogModel.create({
          school_id: schoolId,
          student_id: studentId,
          student_name: targetStudent ? targetStudent.full_name : 'Siswa Tidak Cocok',
          pickup_person_id: pickupPerson.id,
          pickup_person_name: `${pickupPerson.full_name} (${pickupPerson.relationship})`,
          nfc_card_id: card.id,
          duty_teacher_id: teacherId,
          verification_method: 'NFC_TAP',
          status: 'BLOCKED',
          notes: 'Kartu NFC valid tapi tidak berhak menjemput siswa ini'
        });

        return {
          status: 'BLOCKED',
          code: 'UNAUTHORIZED_FOR_STUDENT',
          message: `AKSES DITOLAK: ${pickupPerson.full_name} Tidak Berhak Menjemput Siswa Ini`,
          alert_dispatched: true
        };
      }
    } else {
      // Auto-select first authorized student
      targetStudent = await models.students.findById(auths[0].student_id, schoolId);
    }

    // 4. Enforce the configured weekly pickup assignment.
    const schedules = await scheduleModel.findByStudent(targetStudent.id);
    const currentDay = dayCodeFor(verificationDate);
    const scheduledToday = schedules.find(item => item.day_of_week === currentDay);
    if (!simulationMode && schedules.length > 0 && scheduledToday?.pickup_person_id !== pickupPerson.id) {
      await pickupLogModel.create({
        school_id: schoolId,
        student_id: targetStudent.id,
        student_name: targetStudent.full_name,
        pickup_person_id: pickupPerson.id,
        pickup_person_name: `${pickupPerson.full_name} (${pickupPerson.relationship})`,
        nfc_card_id: card.id,
        duty_teacher_id: teacherId,
        verification_method: 'NFC_TAP',
        status: 'OUT_OF_SCHEDULE',
        notes: `Penjemput tidak sesuai jadwal ${currentDay}`
      });
      return {
        status: 'OUT_OF_SCHEDULE',
        code: 'PICKUP_PERSON_OUT_OF_SCHEDULE',
        message: 'Penjemput Tidak Sesuai Jadwal Hari Ini',
        alert_dispatched: true
      };
    }

    // 5. Record successful audit log
    const parent = await models.users.findById(targetStudent.parent_id, schoolId);
    let log = await pickupLogModel.create({
      school_id: schoolId,
      student_id: targetStudent.id,
      student_name: targetStudent.full_name,
      pickup_person_id: pickupPerson.id,
      pickup_person_name: `${pickupPerson.full_name} (${pickupPerson.relationship})`,
      nfc_card_id: card.id,
      duty_teacher_id: teacherId,
      verification_method: simulationMode ? 'NFC_SIMULATION' : 'NFC_TAP',
      status: 'PENDING_PHOTO',
      notes: simulationMode
        ? 'Simulasi verifikasi NFC berhasil; jadwal harian dan notifikasi dilewati'
        : 'Verifikasi pengetapan NFC berhasil di gerbang sekolah',
      verification_photo: null
    });

    if (facePhoto) {
      log = await storeVerificationPhoto({
        pickupLogId: log.id,
        schoolId,
        facePhoto
      });
    }

    const verificationCompleted = log.status === 'VERIFIED' && Boolean(log.verification_photo);

    return {
      status: verificationCompleted ? 'VERIFIED' : 'PENDING_PHOTO',
      message: verificationCompleted
        ? 'Penjemputan Terverifikasi Sah'
        : 'Kartu NFC sah. Foto wajah wajib diambil sebelum penjemputan disahkan.',
      data: {
        pickup_log_id: log.id,
        student: {
          id: targetStudent.id,
          full_name: targetStudent.full_name,
          class_name: targetStudent.class_name,
          photo_url: targetStudent.photo_url
        },
        pickup_person: {
          id: pickupPerson.id,
          full_name: pickupPerson.full_name,
          relationship: pickupPerson.relationship,
          phone_number: pickupPerson.phone_number,
          photo_url: pickupPerson.photo_url
        },
        parent: parent ? {
          id: parent.id,
          full_name: parent.full_name,
          phone_number: parent.phone_number
        } : null,
        timestamp: log.timestamp,
        notification_sent: false,
        simulation_mode: simulationMode,
        verification_photo: log.verification_photo
          ? await storageService.getSignedUrl(log.verification_photo)
          : null
      }
    };
  },
  attachVerificationPhoto: async ({
    pickupLogId,
    schoolId,
    facePhoto,
    simulationOnly = false
  }) => {
    if (simulationOnly) {
      const pendingLog = await pickupLogModel.findById(pickupLogId, schoolId);
      if (!pendingLog) return null;
      if (pendingLog.verification_method !== 'NFC_SIMULATION') {
        const error = new Error('Akun Yayasan hanya dapat menyimpan foto untuk mode simulasi NFC');
        error.statusCode = 403;
        error.code = 'FOUNDATION_SIMULATION_ONLY';
        throw error;
      }
    }

    const log = await storeVerificationPhoto({ pickupLogId, schoolId, facePhoto });

    if (!log) {
      return null;
    }

    return {
      pickup_log_id: log.id,
      student_id: log.student_id,
      student_name: log.student_name,
      pickup_person_id: log.pickup_person_id,
      pickup_person_name: log.pickup_person_name,
      timestamp: log.timestamp,
      status: log.status,
      verification_method: log.verification_method,
      verification_photo: await storageService.getSignedUrl(log.verification_photo)
    };
  }
};
