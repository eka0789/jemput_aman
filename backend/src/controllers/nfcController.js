import { nfcService } from '../services/nfcService.js';
import { whatsappService } from '../services/whatsappService.js';
import { pushNotificationService } from '../services/pushNotificationService.js';

export const verifyNfcTap = async (req, res, next) => {
  try {
    const { card_uid, student_id } = req.body;
    const schoolId = req.schoolId;
    const teacherId = req.user?.id || 'usr-teacher-1';

    if (!card_uid) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'UID Kartu NFC wajib dikirimkan dalam payload'
      });
    }

    const result = await nfcService.verifyTap({
      cardUid: card_uid,
      studentId: student_id,
      schoolId,
      teacherId
    });

    if (result.status === 'VERIFIED') {
      // Trigger automatic real-time notifications to Parent (US2 integration)
      const { student, pickup_person, timestamp } = result.data;
      const notifPayload = {
        studentName: student.full_name,
        pickupPersonName: `${pickup_person.full_name} (${pickup_person.relationship})`,
        timestamp: new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      whatsappService.sendPickupNotification(pickup_person.phone_number, notifPayload).catch(console.error);
      pushNotificationService.sendPushAlert(schoolId, notifPayload).catch(console.error);

      return res.status(200).json(result);
    } else {
      return res.status(403).json(result);
    }
  } catch (err) {
    next(err);
  }
};
