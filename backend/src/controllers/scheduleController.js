import { scheduleModel } from '../models/schedule.js';
import { models } from '../models/schema.js';

const assertStudentAccess = async (studentId, schoolId, user) => {
  const student = await models.students.findById(studentId, schoolId);
  if (!student) {
    const error = new Error('Data siswa tidak ditemukan pada sekolah ini');
    error.statusCode = 404;
    error.code = 'STUDENT_NOT_FOUND';
    throw error;
  }
  if (user.role === 'PARENT' && student.parent_id !== user.id && !user.isDevelopmentMock) {
    const error = new Error('Orang tua tidak memiliki akses ke jadwal siswa ini');
    error.statusCode = 403;
    error.code = 'STUDENT_ACCESS_DENIED';
    throw error;
  }
  return student;
};

export const getStudentSchedule = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    await assertStudentAccess(studentId, req.schoolId, req.user);
    const schedules = await scheduleModel.findByStudent(studentId);
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

export const updateStudentSchedule = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { schedules } = req.body;
    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Schedules harus berupa array' });
    }
    await assertStudentAccess(studentId, req.schoolId, req.user);

    const allowedDays = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    const normalized = schedules.map(item => ({
      day_of_week: String(item?.day_of_week || '').toUpperCase(),
      pickup_person_id: String(item?.pickup_person_id || '')
    }));
    if (
      normalized.some(item => !allowedDays.has(item.day_of_week) || !item.pickup_person_id)
      || new Set(normalized.map(item => item.day_of_week)).size !== normalized.length
    ) {
      return res.status(400).json({
        error: 'INVALID_SCHEDULE',
        message: 'Setiap hari hanya boleh memiliki satu penjemput dengan kode hari yang valid'
      });
    }

    const people = await Promise.all(
      normalized.map(item => models.pickupPersons.findById(item.pickup_person_id, req.schoolId))
    );
    const authorizations = await Promise.all(
      normalized.map(item => models.authorizations.findValidAuth(studentId, item.pickup_person_id))
    );
    if (people.some(person => !person || person.status !== 'ACTIVE') || authorizations.some(auth => !auth)) {
      return res.status(400).json({
        error: 'INVALID_PICKUP_ASSIGNMENT',
        message: 'Penjemput jadwal harus aktif, berada di sekolah yang sama, dan terotorisasi untuk siswa'
      });
    }
    const updated = await scheduleModel.updateSchedule(studentId, normalized);
    res.json({ success: true, message: 'Jadwal penjemputan mingguan berhasil diperbarui', data: updated });
  } catch (err) {
    next(err);
  }
};
