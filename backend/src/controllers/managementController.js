import { models } from '../models/schema.js';
import { cardManagementService } from '../services/cardManagementService.js';

export const getStudents = (req, res) => {
  const schoolId = req.schoolId;
  const students = models.students.findBySchool(schoolId);
  res.json({ success: true, data: students });
};

export const createStudent = (req, res) => {
  const schoolId = req.schoolId;
  const { full_name, class_name, student_number } = req.body;

  const newStudent = models.students.create({
    school_id: schoolId,
    parent_id: 'usr-parent-1',
    full_name,
    class_name,
    student_number,
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
  });

  res.status(201).json({ success: true, message: 'Data siswa berhasil ditambahkan', data: newStudent });
};

export const updateCardStatus = (req, res) => {
  const { card_uid, status } = req.body;
  const card = cardManagementService.updateCardStatus(card_uid, status);
  if (!card) {
    return res.status(404).json({ error: 'CARD_NOT_FOUND', message: 'Kartu NFC tidak ditemukan' });
  }
  res.json({ success: true, message: `Status kartu NFC berhasil diubah menjadi ${status}`, data: card });
};

export const bindNfcCard = (req, res) => {
  const schoolId = req.schoolId;
  const { card_uid, pickup_person_id } = req.body;

  if (!card_uid || !pickup_person_id) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'UID Kartu NFC dan ID Penjemput wajib diisi' });
  }

  const newCard = cardManagementService.bindCardToPerson(card_uid, pickup_person_id, schoolId);
  res.status(201).json({ success: true, message: `Kartu NFC [${card_uid}] berhasil ditautkan dan langsung aktif!`, data: newCard });
};
