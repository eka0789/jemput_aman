import { nfcService } from '../services/nfcService.js';
import { whatsappService } from '../services/whatsappService.js';
import { pushNotificationService } from '../services/pushNotificationService.js';
import { models } from '../models/schema.js';

const dispatchPickupNotifications = async ({
  schoolId,
  studentName,
  pickupPersonName,
  parentPhone,
  timestamp
}) => {
  const notifPayload = {
    studentName,
    pickupPersonName,
    timestamp: new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  const [whatsapp, push] = await Promise.all([
    whatsappService.sendPickupNotification(parentPhone, notifPayload),
    pushNotificationService.sendPushAlert(schoolId, notifPayload)
  ]);
  return {
    notification_sent: whatsapp.success || push.success,
    notification_status: { whatsapp, push }
  };
};

const skippedSimulationNotifications = () => ({
  notification_sent: false,
  notification_status: {
    whatsapp: {
      success: false,
      status: 'SKIPPED',
      message: 'Notifikasi tidak dikirim untuk mode simulasi'
    },
    push: {
      success: false,
      status: 'SKIPPED',
      message: 'Notifikasi tidak dikirim untuk mode simulasi'
    }
  }
});

export const verifyNfcTap = async (req, res, next) => {
  try {
    const { card_uid, student_id, simulation } = req.body;
    const schoolId = req.schoolId;
    const teacherId = req.user?.id || 'usr-teacher-1';
    const simulationMode = simulation === true;

    if (req.user?.role === 'FOUNDATION' && !simulationMode) {
      return res.status(403).json({
        error: 'FOUNDATION_SIMULATION_ONLY',
        message: 'Akun Yayasan hanya dapat menggunakan reader dalam mode simulasi'
      });
    }

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
      teacherId,
      simulationMode
    });

    if (result.status === 'VERIFIED') {
      // Trigger automatic real-time notifications to Parent (US2 integration)
      const { student, pickup_person, parent, timestamp } = result.data;
      Object.assign(
        result.data,
        simulationMode
          ? skippedSimulationNotifications()
          : await dispatchPickupNotifications({
              schoolId,
              studentName: student.full_name,
              pickupPersonName: `${pickup_person.full_name} (${pickup_person.relationship})`,
              parentPhone: parent?.phone_number,
              timestamp
            })
      );

      return res.status(200).json(result);
    } else if (result.status === 'PENDING_PHOTO') {
      return res.status(202).json(result);
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

    const student = await models.students.findById(data.student_id, req.schoolId);
    const parent = student?.parent_id
      ? await models.users.findById(student.parent_id, req.schoolId)
      : null;
    const isSimulation = data.verification_method === 'NFC_SIMULATION';
    const notification = isSimulation
      ? skippedSimulationNotifications()
      : await dispatchPickupNotifications({
          schoolId: req.schoolId,
          studentName: data.student_name,
          pickupPersonName: data.pickup_person_name,
          parentPhone: parent?.phone_number,
          timestamp: data.timestamp
        });

    return res.status(200).json({
      success: true,
      status: 'VERIFIED',
      message: isSimulation
        ? 'Simulasi berhasil. Foto wajah tersimpan tanpa mengirim notifikasi.'
        : 'Foto wajah tersimpan pada data verifikasi penjemputan',
      data: { ...data, ...notification }
    });
  } catch (err) {
    next(err);
  }
};
