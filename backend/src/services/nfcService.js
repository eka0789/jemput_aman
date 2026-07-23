import { models } from '../models/schema.js';
import { pickupLogModel } from '../models/pickupLog.js';

export const nfcService = {
  verifyTap: async ({ cardUid, studentId, schoolId, teacherId = 'usr-teacher-1' }) => {
    // 1. Find NFC card in store
    const card = models.nfcCards.findByUid(cardUid, schoolId);

    if (!card) {
      // Record unknown card attempt log
      pickupLogModel.create({
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
      pickupLogModel.create({
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
    const pickupPerson = models.pickupPersons.findById(card.pickup_person_id);
    if (!pickupPerson || pickupPerson.status !== 'ACTIVE') {
      return {
        status: 'BLOCKED',
        code: 'PICKUP_PERSON_INACTIVE',
        message: 'AKSES DITOLAK: Profil Penjemput Terkait Tidak Aktif',
        alert_dispatched: true
      };
    }

    // 3. Find authorized students for this pickup person
    const auths = models.authorizations.findByPickupPerson(pickupPerson.id);
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
      targetStudent = models.students.findById(studentId, schoolId);
      const isLinked = auths.some(a => a.student_id === studentId);
      if (!isLinked || !targetStudent) {
        pickupLogModel.create({
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
      targetStudent = models.students.findById(auths[0].student_id, schoolId);
    }

    // 4. Record successful audit log
    const log = pickupLogModel.create({
      school_id: schoolId,
      student_id: targetStudent.id,
      student_name: targetStudent.full_name,
      pickup_person_id: pickupPerson.id,
      pickup_person_name: `${pickupPerson.full_name} (${pickupPerson.relationship})`,
      nfc_card_id: card.id,
      duty_teacher_id: teacherId,
      verification_method: 'NFC_TAP',
      status: 'VERIFIED',
      notes: 'Verifikasi pengetapan NFC berhasil di gerbang sekolah'
    });

    return {
      status: 'VERIFIED',
      message: 'Penjemputan Terverifikasi Sah',
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
        timestamp: log.timestamp,
        notification_sent: true
      }
    };
  }
};
