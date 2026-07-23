import { scheduleModel } from '../models/schedule.js';

export const getStudentSchedule = (req, res) => {
  const { studentId } = req.params;
  const schedules = scheduleModel.findByStudent(studentId);
  res.json({ success: true, data: schedules });
};

export const updateStudentSchedule = (req, res) => {
  const { studentId } = req.params;
  const { schedules } = req.body;
  if (!Array.isArray(schedules)) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'Schedules harus berupa array' });
  }
  const updated = scheduleModel.updateSchedule(studentId, schedules);
  res.json({ success: true, message: 'Jadwal penjemputan mingguan berhasil diperbarui', data: updated });
};
