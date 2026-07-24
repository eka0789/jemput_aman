import { scheduleModel } from '../models/schedule.js';

export const getStudentSchedule = async (req, res, next) => {
  try {
    const { studentId } = req.params;
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
    const updated = await scheduleModel.updateSchedule(studentId, schedules);
    res.json({ success: true, message: 'Jadwal penjemputan mingguan berhasil diperbarui', data: updated });
  } catch (err) {
    next(err);
  }
};
