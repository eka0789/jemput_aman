import { supabase } from '../src/config/supabase.js';
import { env } from '../src/config/env.js';
import { nfcService } from '../src/services/nfcService.js';
import { storageService } from '../src/services/storageService.js';

const schoolId = '1001-tk-ceria-salatiga';
let logId;
let verificationStatus;
let photoStored = false;
let storagePath;

try {
  const verification = await nfcService.verifyTap({
    cardUid: '04:A2:8B:12:FE:67:80',
    studentId: '1111',
    schoolId,
    teacherId: 'usr-teacher-1'
  });

  if (verification.status !== 'VERIFIED') {
    throw new Error(`Verifikasi gagal dengan status ${verification.status}`);
  }

  logId = verification.data.pickup_log_id;
  const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const attached = await nfcService.attachVerificationPhoto({
    pickupLogId: logId,
    schoolId,
    facePhoto: photo
  });

  const { data: storedLog, error } = await supabase
    .from('pickup_logs')
    .select('id, status, verification_photo')
    .eq('id', logId)
    .single();

  if (error) throw error;
  const publicPrefix = `/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/`;
  const photoUrl = new URL(storedLog.verification_photo);
  const prefixIndex = photoUrl.pathname.indexOf(publicPrefix);
  if (prefixIndex === -1 || attached.verification_photo !== storedLog.verification_photo) {
    throw new Error('Kolom verification_photo tidak berisi URL Supabase Storage');
  }
  storagePath = decodeURIComponent(photoUrl.pathname.slice(prefixIndex + publicPrefix.length));

  const { data: storedObject, error: storageError } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .download(storagePath);
  if (storageError || !storedObject?.size) {
    throw storageError || new Error('Objek foto verifikasi kosong di Storage');
  }

  verificationStatus = storedLog.status;
  photoStored = true;
} finally {
  if (logId) {
    const { error } = await supabase.from('pickup_logs').delete().eq('id', logId);
    if (error) {
      console.error(`Cleanup log ${logId} gagal: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (storagePath) {
    try {
      await storageService.remove(storagePath);
    } catch (error) {
      console.error(`Cleanup foto ${storagePath} gagal: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

console.log(JSON.stringify({
  success: true,
  verificationStatus,
  photoStored,
  cleanupSucceeded: true
}));
