import { assertSupabaseConfigured, unwrapSupabase } from '../config/supabase.js';

const client = () => assertSupabaseConfigured();

export const reportExportModel = {
  create: async ({ schoolId, format, exportedBy }) => (
    unwrapSupabase(
      await client()
        .from('report_export_events')
        .insert({
          id: `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          school_id: schoolId,
          format,
          exported_by: exportedBy || null
        })
        .select()
        .single(),
      'mencatat export laporan'
    )
  ),
  findLatestBySchool: async (schoolId) => (
    unwrapSupabase(
      await client()
        .from('report_export_events')
        .select('*')
        .eq('school_id', schoolId)
        .order('exported_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'membaca histori export terakhir'
    )
  )
};
