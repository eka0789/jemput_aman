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
  findBySchool: async (schoolId, { limit } = {}) => {
    let query = client()
        .from('pickup_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false });
    if (limit) query = query.limit(limit);
    return unwrapSupabase(
      await query,
      'membaca log penjemputan'
    );
  },
  countVerifiedSince: async (schoolId, sinceIso) => {
    const { count, error } = await client()
      .from('pickup_logs')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'VERIFIED')
      .gte('timestamp', sinceIso);
    if (error) return unwrapSupabase({ data: null, error }, 'menghitung kepulangan hari ini');
    return count || 0;
  },
  findById: async (logId, schoolId) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .select('*')
        .eq('id', logId)
        .eq('school_id', schoolId)
        .maybeSingle(),
      'membaca log penjemputan'
    )
  ),
  finalizeVerificationPhoto: async (logId, schoolId, verificationPhoto) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .update({ verification_photo: verificationPhoto, status: 'VERIFIED' })
        .eq('id', logId)
        .eq('school_id', schoolId)
        .in('status', ['PENDING_PHOTO', 'VERIFIED'])
        .select()
        .maybeSingle(),
      'menyimpan foto dan menyelesaikan verifikasi'
    )
  ),
  findAll: async () => (
    unwrapSupabase(
      await client().from('pickup_logs').select('*').order('timestamp', { ascending: false }),
      'membaca seluruh log penjemputan'
    )
  ),
  findOldestBySchool: async (schoolId) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .select('timestamp')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: true })
        .limit(1)
        .maybeSingle(),
      'membaca log penjemputan terlama'
    )
  ),
  findExpired: async (cutoffIso, limit = 500) => (
    unwrapSupabase(
      await client()
        .from('pickup_logs')
        .select('id, school_id, verification_photo, timestamp')
        .lt('timestamp', cutoffIso)
        .order('timestamp', { ascending: true })
        .limit(limit),
      'membaca log yang melewati masa retensi'
    )
  ),
  deleteByIds: async (ids) => {
    if (!ids.length) return [];
    return unwrapSupabase(
      await client()
        .from('pickup_logs')
        .delete()
        .in('id', ids)
        .select('id'),
      'menghapus log yang melewati masa retensi'
    );
  },
  countBySchool: async (schoolId) => {
    const { count, error } = await client()
      .from('pickup_logs')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);
    if (error) return unwrapSupabase({ data: null, error }, 'menghitung log penjemputan');
    return count || 0;
  }
};
