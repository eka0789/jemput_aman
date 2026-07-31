import { assertSupabaseConfigured, unwrapSupabase } from '../config/supabase.js';
import { models } from './schema.js';

const client = () => assertSupabaseConfigured();

export const emergencyOtpModel = {
  create: async ({ school_id, student_id, pickup_person_id, otp_code }) => {
    const [student, pickupPerson] = await Promise.all([
      models.students.findById(student_id, school_id),
      models.pickupPersons.findById(pickup_person_id, school_id)
    ]);

    const otpEntry = {
      id: `otp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      school_id,
      student_id,
      student_name: student?.full_name || 'Siswa',
      pickup_person_id,
      pickup_person_name: pickupPerson
        ? `${pickupPerson.full_name} (${pickupPerson.relationship})`
        : 'Penjemput',
      otp_code,
      status: 'PENDING',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      created_at: new Date().toISOString()
    };

    return unwrapSupabase(
      await client().from('emergency_otps').insert(otpEntry).select().single(),
      'membuat OTP darurat'
    );
  },
  findById: async (id, schoolId) => {
    let query = client().from('emergency_otps').select('*').eq('id', id);
    if (schoolId) query = query.eq('school_id', schoolId);
    return (
    unwrapSupabase(
      await query.maybeSingle(),
      'membaca OTP darurat'
    )
    );
  },
  findPendingBySchool: async (schoolId) => (
    unwrapSupabase(
      await client()
        .from('emergency_otps')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'PENDING')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      'membaca OTP tertunda'
    )
  ),
  approve: async ({ id, schoolId, otpCodeHash }) => {
    let query = client()
        .from('emergency_otps')
        .update({ status: 'APPROVED' })
        .eq('id', id)
        .eq('school_id', schoolId)
        .eq('status', 'PENDING')
        .gt('expires_at', new Date().toISOString());
    if (otpCodeHash) query = query.eq('otp_code', otpCodeHash);
    return unwrapSupabase(
      await query.select().maybeSingle(),
      'menyetujui OTP'
    );
  },
  reject: async (id, schoolId) => (
    unwrapSupabase(
      await client()
        .from('emergency_otps')
        .update({ status: 'REJECTED' })
        .eq('id', id)
        .eq('school_id', schoolId)
        .eq('status', 'PENDING')
        .select()
        .maybeSingle(),
      'membatalkan OTP yang gagal dikirim'
    )
  )
};
