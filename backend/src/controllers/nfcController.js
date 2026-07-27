import { nfcService } from '../services/nfcService.js';
import { whatsappService } from '../services/whatsappService.js';
import { pushNotificationService } from '../services/pushNotificationService.js';

export const verifyNfcTap = async (req, res, next) => {
  try {
    const { card_uid, student_id } = req.body;
    const schoolId = req.schoolId;
    const teacherId = req.user?.id || 'usr-teacher-1';

    const normalizedCardUid = String(card_uid || '').trim().toUpperCase();
    if (!/^[0-9A-F]{2}(?::[0-9A-F]{2}){3,9}$/.test(normalizedCardUid)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'UID Kartu NFC wajib dikirimkan dalam format yang valid'
      });
    }

    const result = await nfcService.verifyTap({
      cardUid: normalizedCardUid,
      studentId: student_id,
      schoolId,
      teacherId
    });

    if (result.status === 'VERIFIED') {
      // Trigger automatic real-time notifications to Parent (US2 integration)
      const { student, pickup_person, parent, timestamp } = result.data;
      const notifPayload = {
        studentName: student.full_name,
        pickupPersonName: `${pickup_person.full_name} (${pickup_person.relationship})`,
        timestamp: new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      const [whatsapp, push] = await Promise.all([
        whatsappService.sendPickupNotification(parent?.phone_number, notifPayload),
        pushNotificationService.sendPushAlert(schoolId, notifPayload)
      ]);

      result.data.notification_sent = whatsapp.success || push.success;
      result.data.notification_status = {
        whatsapp,
        push
      };

      return res.status(200).json(result);
    } else {
      return res.status(403).json(result);
    }
  } catch (err) {
    next(err);
  }
};

export const attachVerificationPhoto = async (req, res, next) => {
  try {
    const { pickup_log_id, face_photo } = req.body;

    if (!pickup_log_id || !face_photo) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'ID log dan foto wajah verifikasi wajib dikirimkan'
      });
    }

    if (!/^data:image\/(jpeg|png|webp);base64,/i.test(face_photo)) {
      return res.status(400).json({
        error: 'INVALID_PHOTO',
        message: 'Format foto verifikasi tidak valid'
      });
    }

    const data = await nfcService.attachVerificationPhoto({
      pickupLogId: pickup_log_id,
      schoolId: req.schoolId,
      facePhoto: face_photo
    });

    if (!data) {
      return res.status(404).json({
        error: 'PICKUP_LOG_NOT_FOUND',
        message: 'Log verifikasi berhasil tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Foto wajah tersimpan pada data verifikasi penjemputan',
      data
    });
  } catch (err) {
    next(err);
  }
};
