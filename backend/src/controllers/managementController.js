import { models } from '../models/schema.js';
import { cardManagementService } from '../services/cardManagementService.js';

export const getStudents = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const students = await models.students.findBySchool(schoolId);
    const enrichedStudents = await Promise.all(students.map(async student => {
      const parent = student.parent_id
        ? await models.users.findById(student.parent_id, schoolId)
        : null;
      return {
        ...student,
        parent_name: parent?.full_name || 'Orang Tua / Wali',
        parent_phone_number: parent?.phone_number || null
      };
    }));
    res.json({ success: true, data: enrichedStudents });
  } catch (err) {
    next(err);
  }
};

export const getPickupPersons = async (req, res, next) => {
  try {
    const people = await models.pickupPersons.findBySchool(req.schoolId);
    res.json({ success: true, data: people });
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const { full_name, class_name, student_number } = req.body;
    const newStudent = await models.students.create({
      school_id: schoolId,
      parent_id: 'usr-parent-1',
      full_name,
      class_name,
      student_number,
      photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
    });
    res.status(201).json({ success: true, message: 'Data siswa berhasil ditambahkan', data: newStudent });
  } catch (err) {
    next(err);
  }
};

const validatePhoto = (photoUrl) => (
  typeof photoUrl === 'string'
  && /^data:image\/(jpeg|png|webp);base64,/i.test(photoUrl)
);

export const updateStudentPhoto = async (req, res, next) => {
  try {
    const { photo_url } = req.body;
    if (!validatePhoto(photo_url)) {
      return res.status(400).json({ error: 'INVALID_PHOTO', message: 'File foto siswa tidak valid' });
    }

    const student = await models.students.updatePhoto(req.params.studentId, req.schoolId, photo_url);
    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Data siswa tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Foto siswa berhasil diperbarui', data: student });
  } catch (err) {
    next(err);
  }
};

export const updatePickupPersonPhoto = async (req, res, next) => {
  try {
    const { photo_url } = req.body;
    if (!validatePhoto(photo_url)) {
      return res.status(400).json({ error: 'INVALID_PHOTO', message: 'File foto penjemput tidak valid' });
    }

    const person = await models.pickupPersons.updatePhoto(req.params.personId, req.schoolId, photo_url);
    if (!person) {
      return res.status(404).json({ error: 'PICKUP_PERSON_NOT_FOUND', message: 'Data penjemput tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Foto penjemput berhasil diperbarui', data: person });
  } catch (err) {
    next(err);
  }
};

export const updateStudentParentPhone = async (req, res, next) => {
  try {
    const phoneNumber = String(req.body.phone_number || '').replace(/[\s()-]/g, '');
    if (!/^(?:\+62|62|0)8\d{8,12}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: 'Nomor WhatsApp harus berupa nomor seluler Indonesia yang valid'
      });
    }

    const student = await models.students.findById(req.params.studentId, req.schoolId);
    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Data siswa tidak ditemukan' });
    }

    const parent = await models.users.updatePhone(student.parent_id, req.schoolId, phoneNumber);
    if (!parent) {
      return res.status(404).json({ error: 'PARENT_NOT_FOUND', message: 'Data orang tua siswa tidak ditemukan' });
    }

    return res.json({
      success: true,
      message: 'Nomor WhatsApp orang tua berhasil diperbarui',
      data: { student_id: student.id, parent_id: parent.id, phone_number: parent.phone_number }
    });
  } catch (err) {
    next(err);
  }
};

export const updateCardStatus = async (req, res, next) => {
  try {
    const { card_uid, status } = req.body;
    const card = await cardManagementService.updateCardStatus(card_uid, status, req.schoolId);
    if (!card) {
      return res.status(404).json({ error: 'CARD_NOT_FOUND', message: 'Kartu NFC tidak ditemukan' });
    }
    res.json({ success: true, message: `Status kartu NFC berhasil diubah menjadi ${status}`, data: card });
  } catch (err) {
    next(err);
  }
};

export const bindNfcCard = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const { card_uid, pickup_person_id } = req.body;
    if (!card_uid || !pickup_person_id) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'UID Kartu NFC dan ID Penjemput wajib diisi' });
    }

    const newCard = await cardManagementService.bindCardToPerson(card_uid, pickup_person_id, schoolId);
    res.status(201).json({
      success: true,
      message: `Kartu NFC [${card_uid}] berhasil ditautkan dan langsung aktif!`,
      data: newCard
    });
  } catch (err) {
    next(err);
  }
};
