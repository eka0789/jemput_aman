import { supabase } from '../src/config/supabase.js';
import { normalizeStoragePath, storageService } from '../src/services/storageService.js';

const { data: rows, error } = await supabase
  .from('pickup_logs')
  .select('id, school_id, verification_photo')
  .not('verification_photo', 'is', null);

if (error) throw error;

let migrated = 0;
let uploadedDataUrls = 0;
let skipped = 0;
for (const row of rows) {
  let normalized = normalizeStoragePath(row.verification_photo);
  let uploadedPath = null;

  if (/^data:image\//i.test(row.verification_photo)) {
    const uploaded = await storageService.uploadVerificationPhoto({
      schoolId: row.school_id,
      pickupLogId: row.id,
      dataUrl: row.verification_photo
    });
    normalized = uploaded.path;
    uploadedPath = uploaded.path;
  }

  if (!normalized || normalized === row.verification_photo || /^https?:\/\//i.test(normalized)) {
    skipped += 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from('pickup_logs')
    .update({ verification_photo: normalized })
    .eq('id', row.id)
    .eq('school_id', row.school_id);
  if (updateError) {
    if (uploadedPath) await storageService.remove(uploadedPath);
    throw updateError;
  }
  if (uploadedPath) uploadedDataUrls += 1;
  migrated += 1;
}

console.log(JSON.stringify({
  success: true,
  scanned: rows.length,
  migrated,
  uploadedDataUrls,
  skipped
}));
