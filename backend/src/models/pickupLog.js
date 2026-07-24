import { assertSupabaseConfigured, unwrapSupabase } from '../config/supabase.js';

const client = () => assertSupabaseConfigured();

export const pickupLogModel = {
  create: async (data) => {
    const logEntry = {
      id: data.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

    return unwrapSupabase(
      await client().from('pickup_logs').insert(logEntry).select().single(),
      'menyimpan log penjemputan'
    );
  },
  findBySchool: async (schoolId) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false }),
      'membaca log penjemputan'
    )
  ),
  attachVerificationPhoto: async (logId, schoolId, verificationPhoto) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .update({ verification_photo: verificationPhoto })
        .eq('id', logId)
        .eq('school_id', schoolId)
        .eq('status', 'VERIFIED')
        .select()
        .maybeSingle(),
      'menyimpan foto verifikasi'
    )
  ),
  findAll: async () => (
    unwrapSupabase(
      await client().from('pickup_logs').select('*').order('timestamp', { ascending: false }),
      'membaca seluruh log penjemputan'
    )
  )
};
