import { assertSupabaseConfigured, unwrapSupabase } from '../config/supabase.js';

const client = () => assertSupabaseConfigured();
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const models = {
  users: {
    findByEmail: async (email) => (
      unwrapSupabase(
        await client()
          .from('app_users')
          .select('*')
          .ilike('email', email.trim())
          .in('role', ['ADMIN', 'FOUNDATION'])
          .maybeSingle(),
        'membaca akun pengelola'
      )
    ),
    findById: async (id, schoolId) => {
      let query = client().from('app_users').select('*').eq('id', id);
      if (schoolId) query = query.eq('school_id', schoolId);
      return unwrapSupabase(await query.maybeSingle(), 'membaca pengguna');
    },
    updatePhone: async (id, schoolId, phoneNumber) => (
      unwrapSupabase(
        await client()
          .from('app_users')
          .update({ phone_number: phoneNumber })
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .maybeSingle(),
        'memperbarui nomor pengguna'
      )
    )
  },
  schools: {
    findById: async (id) => (
      unwrapSupabase(
        await client().from('schools').select('*').eq('id', id).maybeSingle(),
        'membaca sekolah'
      )
    ),
    findAll: async () => (
      unwrapSupabase(await client().from('schools').select('*').order('name'), 'membaca sekolah')
    )
  },
  students: {
    findBySchool: async (schoolId) => (
      unwrapSupabase(
        await client().from('students').select('*').eq('school_id', schoolId).order('full_name'),
        'membaca siswa'
      )
    ),
    findById: async (id, schoolId) => {
      let query = client().from('students').select('*').eq('id', id);
      if (schoolId) query = query.eq('school_id', schoolId);
      return unwrapSupabase(await query.maybeSingle(), 'membaca siswa');
    },
    create: async (data) => (
      unwrapSupabase(
        await client()
          .from('students')
          .insert({ id: data.id || createId('std'), ...data, status: data.status || 'ACTIVE' })
          .select()
          .single(),
        'menambah siswa'
      )
    ),
    updatePhoto: async (id, schoolId, photoUrl) => (
      unwrapSupabase(
        await client()
          .from('students')
          .update({ photo_url: photoUrl })
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .maybeSingle(),
        'memperbarui foto siswa'
      )
    )
  },
  pickupPersons: {
    findBySchool: async (schoolId) => (
      unwrapSupabase(
        await client().from('pickup_persons').select('*').eq('school_id', schoolId).order('full_name'),
        'membaca penjemput'
      )
    ),
    findById: async (id, schoolId) => {
      let query = client().from('pickup_persons').select('*').eq('id', id);
      if (schoolId) query = query.eq('school_id', schoolId);
      return unwrapSupabase(await query.maybeSingle(), 'membaca penjemput');
    },
    create: async (data) => (
      unwrapSupabase(
        await client()
          .from('pickup_persons')
          .insert({ id: data.id || createId('pick'), ...data, status: data.status || 'ACTIVE' })
          .select()
          .single(),
        'menambah penjemput'
      )
    ),
    updatePhoto: async (id, schoolId, photoUrl) => (
      unwrapSupabase(
        await client()
          .from('pickup_persons')
          .update({ photo_url: photoUrl })
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .maybeSingle(),
        'memperbarui foto penjemput'
      )
    )
  },
  nfcCards: {
    findByUid: async (uid, schoolId) => (
      unwrapSupabase(
        await client()
          .from('nfc_cards')
          .select('*')
          .eq('school_id', schoolId)
          .ilike('card_uid', uid.trim())
          .maybeSingle(),
        'membaca kartu NFC'
      )
    ),
    findByPickupPerson: async (pickupPersonId) => (
      unwrapSupabase(
        await client().from('nfc_cards').select('*').eq('pickup_person_id', pickupPersonId),
        'membaca kartu penjemput'
      )
    ),
    create: async (data) => (
      unwrapSupabase(
        await client()
          .from('nfc_cards')
          .insert({
            id: data.id || createId('card'),
            ...data,
            issued_at: data.issued_at || new Date().toISOString()
          })
          .select()
          .single(),
        'menambah kartu NFC'
      )
    ),
    updateStatus: async (cardUid, status, schoolId) => (
      unwrapSupabase(
        await client()
          .from('nfc_cards')
          .update({ status })
          .eq('school_id', schoolId)
          .ilike('card_uid', cardUid.trim())
          .select()
          .maybeSingle(),
        'memperbarui status kartu NFC'
      )
    )
  },
  authorizations: {
    findValidAuth: async (studentId, pickupPersonId) => (
      unwrapSupabase(
        await client()
          .from('authorizations')
          .select('*')
          .eq('student_id', studentId)
          .eq('pickup_person_id', pickupPersonId)
          .eq('is_active', true)
          .maybeSingle(),
        'membaca otorisasi'
      )
    ),
    findByStudent: async (studentId) => (
      unwrapSupabase(
        await client().from('authorizations').select('*').eq('student_id', studentId).eq('is_active', true),
        'membaca otorisasi siswa'
      )
    ),
    findByPickupPerson: async (pickupPersonId) => (
      unwrapSupabase(
        await client()
          .from('authorizations')
          .select('*')
          .eq('pickup_person_id', pickupPersonId)
          .eq('is_active', true),
        'membaca otorisasi penjemput'
      )
    )
  }
};
