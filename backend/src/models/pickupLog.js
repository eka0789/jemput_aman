import { db, saveDb } from '../config/database.js';

export const pickupLogModel = {
  create: (data) => {
    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      school_id: data.school_id,
      student_id: data.student_id,
      student_name: data.student_name,
      pickup_person_id: data.pickup_person_id,
      pickup_person_name: data.pickup_person_name,
      nfc_card_id: data.nfc_card_id || null,
      duty_teacher_id: data.duty_teacher_id || 'usr-teacher-1',
      verification_method: data.verification_method || 'NFC_TAP',
      status: data.status,
      timestamp: data.timestamp || new Date().toISOString(),
      notes: data.notes || '',
      verification_photo: data.verification_photo || null
    };
    db.pickupLogs.unshift(logEntry);
    saveDb();
    return logEntry;
  },
  findBySchool: (schoolId) => {
    return db.pickupLogs.filter(log => log.school_id === schoolId);
  },
  attachVerificationPhoto: (logId, schoolId, verificationPhoto) => {
    const log = db.pickupLogs.find(entry => entry.id === logId && entry.school_id === schoolId);
    if (!log || log.status !== 'VERIFIED') {
      return null;
    }

    log.verification_photo = verificationPhoto;
    saveDb();
    return log;
  },
  findAll: () => db.pickupLogs
};
