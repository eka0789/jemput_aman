import { assertSupabaseConfigured, unwrapSupabase } from '../config/supabase.js';

const client = () => assertSupabaseConfigured();

export const scheduleModel = {
  findByStudent: async (studentId) => (
    unwrapSupabase(
      await client().from('weekly_schedules').select('*').eq('student_id', studentId).order('day_of_week'),
      'membaca jadwal siswa'
    )
  ),
  getScheduleForDay: async (studentId, dayOfWeek) => (
    unwrapSupabase(
      await client()
        .from('weekly_schedules')
        .select('*')
        .eq('student_id', studentId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle(),
      'membaca jadwal harian'
    )
  ),
  updateSchedule: async (studentId, schedules) => {
    unwrapSupabase(
      await client().from('weekly_schedules').delete().eq('student_id', studentId),
      'menghapus jadwal lama'
    );

    if (schedules.length) {
      const rows = schedules.map((schedule, index) => ({
        id: `sch-${Date.now()}-${index}-${Math.floor(Math.random() * 100)}`,
        student_id: studentId,
        pickup_person_id: schedule.pickup_person_id,
        day_of_week: schedule.day_of_week
      }));
      unwrapSupabase(
        await client().from('weekly_schedules').insert(rows),
        'menyimpan jadwal baru'
      );
    }

    return scheduleModel.findByStudent(studentId);
  }
};
