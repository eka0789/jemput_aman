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
    return unwrapSupabase(
      await client().rpc('replace_weekly_schedule', {
        p_student_id: studentId,
        p_schedules: schedules
      }),
      'mengganti jadwal mingguan secara atomik'
    );
  }
};
