import { db, saveDb } from '../config/database.js';

export const scheduleModel = {
  findByStudent: (studentId) => {
    return db.weeklySchedules.filter(s => s.student_id === studentId);
  },
  getScheduleForDay: (studentId, dayOfWeek) => {
    return db.weeklySchedules.find(s => s.student_id === studentId && s.day_of_week === dayOfWeek);
  },
  updateSchedule: (studentId, schedules) => {
    db.weeklySchedules = db.weeklySchedules.filter(s => s.student_id !== studentId);
    schedules.forEach(s => {
      db.weeklySchedules.push({
        id: `sch-${Date.now()}-${Math.floor(Math.random()*100)}`,
        student_id: studentId,
        pickup_person_id: s.pickup_person_id,
        day_of_week: s.day_of_week
      });
    });
    saveDb();
    return db.weeklySchedules.filter(s => s.student_id === studentId);
  }
};
