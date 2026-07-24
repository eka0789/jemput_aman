import { supabase } from '../src/config/supabase.js';
import { nfcService } from '../src/services/nfcService.js';

const schoolId = '1001-tk-ceria-salatiga';
let logId;
let verificationStatus;
let photoStored = false;

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
  const photo = 'data:image/jpeg;base64,c3VwYWJhc2UtaW50ZWdyYXRpb24tdGVzdA==';
  await nfcService.attachVerificationPhoto({
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
  if (storedLog.verification_photo !== photo) {
    throw new Error('Foto verifikasi tidak tersimpan sesuai payload');
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
}

console.log(JSON.stringify({
  success: true,
  verificationStatus,
  photoStored,
  cleanupSucceeded: true
}));
