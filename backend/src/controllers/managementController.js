import { models } from '../models/schema.js';
import { cardManagementService } from '../services/cardManagementService.js';

export const getStudents = (req, res) => {
  const schoolId = req.schoolId;
  const students = models.students.findBySchool(schoolId).map(student => {
    const parent = models.users.findById(student.parent_id, schoolId);
    return {
      ...student,
      parent_name: parent?.full_name || 'Orang Tua / Wali',
      parent_phone_number: parent?.phone_number || null
    };
  });
  res.json({ success: true, data: students });
};

export const getPickupPersons = (req, res) => {
  const people = models.pickupPersons.findBySchool(req.schoolId);
  res.json({ success: true, data: people });
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

const validatePhoto = (photoUrl) => (
  typeof photoUrl === 'string'
  && /^data:image\/(jpeg|png|webp);base64,/i.test(photoUrl)
);

export const updateStudentPhoto = (req, res) => {
  const { photo_url } = req.body;
  if (!validatePhoto(photo_url)) {
    return res.status(400).json({ error: 'INVALID_PHOTO', message: 'File foto siswa tidak valid' });
  }

  const student = models.students.updatePhoto(req.params.studentId, req.schoolId, photo_url);
  if (!student) {
    return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Data siswa tidak ditemukan' });
  }

  return res.json({ success: true, message: 'Foto siswa berhasil diperbarui', data: student });
};

export const updatePickupPersonPhoto = (req, res) => {
  const { photo_url } = req.body;
  if (!validatePhoto(photo_url)) {
    return res.status(400).json({ error: 'INVALID_PHOTO', message: 'File foto penjemput tidak valid' });
  }

  const person = models.pickupPersons.updatePhoto(req.params.personId, req.schoolId, photo_url);
  if (!person) {
    return res.status(404).json({ error: 'PICKUP_PERSON_NOT_FOUND', message: 'Data penjemput tidak ditemukan' });
  }

  return res.json({ success: true, message: 'Foto penjemput berhasil diperbarui', data: person });
};

export const updateStudentParentPhone = (req, res) => {
  const phoneNumber = String(req.body.phone_number || '').replace(/[\s()-]/g, '');
  if (!/^(?:\+62|62|0)8\d{8,12}$/.test(phoneNumber)) {
    return res.status(400).json({
      error: 'INVALID_PHONE',
      message: 'Nomor WhatsApp harus berupa nomor seluler Indonesia yang valid'
    });
  }

  const student = models.students.findById(req.params.studentId, req.schoolId);
  if (!student) {
    return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Data siswa tidak ditemukan' });
  }

  const parent = models.users.updatePhone(student.parent_id, req.schoolId, phoneNumber);
  if (!parent) {
    return res.status(404).json({ error: 'PARENT_NOT_FOUND', message: 'Data orang tua siswa tidak ditemukan' });
  }

  return res.json({
    success: true,
    message: 'Nomor WhatsApp orang tua berhasil diperbarui',
    data: { student_id: student.id, parent_id: parent.id, phone_number: parent.phone_number }
  });
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
