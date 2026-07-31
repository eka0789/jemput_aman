import { models } from '../models/schema.js';
import { cardManagementService } from '../services/cardManagementService.js';

const normalizeText = (value, field, maxLength = 120) => {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if (!normalized || normalized.length > maxLength || /[<>]/.test(normalized)) {
    const error = new Error(`${field} wajib diisi, maksimal ${maxLength} karakter, dan tidak boleh memuat tag HTML`);
    error.statusCode = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }
  return normalized;
};

const normalizeCardUid = value => {
  const uid = String(value || '').trim().toUpperCase();
  if (!/^[0-9A-F]{2}(?::[0-9A-F]{2}){3,9}$/.test(uid)) {
    const error = new Error('UID kartu NFC tidak valid');
    error.statusCode = 400;
    error.code = 'INVALID_CARD_UID';
    throw error;
  }
  return uid;
};

const normalizePhone = value => {
  const phoneNumber = String(value || '').replace(/[\s()-]/g, '');
  if (!/^(?:\+62|62|0)8\d{8,12}$/.test(phoneNumber)) {
    const error = new Error('Nomor WhatsApp penjemput harus berupa nomor seluler Indonesia yang valid');
    error.statusCode = 400;
    error.code = 'INVALID_PHONE';
    throw error;
  }
  return phoneNumber;
};

export const getStudents = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const allStudents = await models.students.findBySchool(schoolId);
    const students = req.user?.role === 'PARENT' && !req.user.isDevelopmentMock
      ? allStudents.filter(student => student.parent_id === req.user.id)
      : allStudents;
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
    const allPeople = await models.pickupPersons.findBySchool(req.schoolId);
    const people = req.user?.role === 'PARENT' && !req.user.isDevelopmentMock
      ? allPeople.filter(person => person.parent_id === req.user.id)
      : allPeople;
    res.json({ success: true, data: people });
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const fullName = normalizeText(req.body.full_name, 'Nama siswa');
    const className = normalizeText(req.body.class_name, 'Kelas', 40);
    const studentNumber = normalizeText(req.body.student_number, 'Nomor siswa', 60);
    const parentId = String(req.body.parent_id || 'usr-parent-1');
    const parent = await models.users.findById(parentId, schoolId);
    if (!parent || parent.role !== 'PARENT') {
      return res.status(400).json({
        error: 'INVALID_PARENT',
        message: 'Akun orang tua tidak ditemukan pada sekolah ini'
      });
    }
    const newStudent = await models.students.create({
      school_id: schoolId,
      parent_id: parentId,
      full_name: fullName,
      class_name: className,
      student_number: studentNumber,
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
    if (req.user?.role === 'PARENT' && !req.user.isDevelopmentMock && student.parent_id !== req.user.id) {
      return res.status(403).json({
        error: 'STUDENT_ACCESS_DENIED',
        message: 'Orang tua tidak berhak mengubah data siswa ini'
      });
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
    const cardUid = normalizeCardUid(card_uid);
    const normalizedStatus = String(status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE', 'LOST'].includes(normalizedStatus)) {
      return res.status(400).json({
        error: 'INVALID_CARD_STATUS',
        message: 'Status kartu harus ACTIVE, INACTIVE, atau LOST'
      });
    }
    const card = await cardManagementService.updateCardStatus(cardUid, normalizedStatus, req.schoolId);
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
    const { card_uid, pickup_person_id, student_id, new_pickup_person } = req.body;
    if (!card_uid || !student_id || (!pickup_person_id && !new_pickup_person)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'UID kartu NFC, siswa, dan data penjemput wajib diisi'
      });
    }

    const cardUid = normalizeCardUid(card_uid);
    const existingCard = await models.nfcCards.findByUid(cardUid, schoolId);
    if (existingCard) {
      return res.status(409).json({
        error: 'CARD_ALREADY_EXISTS',
        message: 'UID kartu NFC sudah terdaftar'
      });
    }

    const student = await models.students.findById(String(student_id), schoolId);
    if (!student || student.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'INVALID_STUDENT',
        message: 'Siswa aktif tidak ditemukan pada sekolah ini'
      });
    }

    let pickupPerson;
    if (new_pickup_person) {
      pickupPerson = await models.pickupPersons.create({
        school_id: schoolId,
        parent_id: student.parent_id || null,
        full_name: normalizeText(new_pickup_person.full_name, 'Nama penjemput'),
        relationship: normalizeText(new_pickup_person.relationship, 'Hubungan dengan siswa', 60),
        phone_number: normalizePhone(new_pickup_person.phone_number),
        photo_url: '/avatar-placeholder.svg'
      });
    } else {
      pickupPerson = await models.pickupPersons.findById(String(pickup_person_id), schoolId);
    }

    if (!pickupPerson || pickupPerson.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'INVALID_PICKUP_PERSON',
        message: 'Penjemput aktif tidak ditemukan pada sekolah ini'
      });
    }

    const authorization = await models.authorizations.createOrActivate(student.id, pickupPerson.id);
    const newCard = await cardManagementService.bindCardToPerson(cardUid, pickupPerson.id, schoolId);
    res.status(201).json({
      success: true,
      message: `Kartu NFC [${cardUid}] berhasil ditautkan ke ${pickupPerson.full_name} dan langsung aktif!`,
      data: {
        ...newCard,
        pickup_person: pickupPerson,
        student,
        authorization
      }
    });
  } catch (err) {
    next(err);
  }
};
