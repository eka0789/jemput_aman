import { db, saveDb } from '../config/database.js';

export const emergencyOtpModel = {
  create: ({ school_id, student_id, pickup_person_id, otp_code }) => {
    const student = db.students.find(s => s.id === student_id);
    const pickupPerson = db.pickupPersons.find(p => p.id === pickup_person_id);

    const otpEntry = {
      id: `otp-${Date.now()}`,
      school_id,
      student_id,
      student_name: student ? student.full_name : 'Siswa',
      pickup_person_id,
      pickup_person_name: pickupPerson ? `${pickupPerson.full_name} (${pickupPerson.relationship})` : 'Penjemput',
      otp_code,
      status: 'PENDING',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      created_at: new Date().toISOString()
    };
    db.emergencyOtps.unshift(otpEntry);
    saveDb();
    return otpEntry;
  },
  findById: (id) => db.emergencyOtps.find(o => o.id === id),
  findPendingBySchool: (schoolId) => db.emergencyOtps.filter(o => o.school_id === schoolId && o.status === 'PENDING'),
  approve: (id) => {
    const otp = db.emergencyOtps.find(o => o.id === id);
    if (otp) {
      otp.status = 'APPROVED';
      saveDb();
    }
    return otp;
  }
};
