import { db, saveDb } from '../config/database.js';

export const models = {
  schools: {
    findById: (id) => db.schools.find(s => s.id === id),
    findAll: () => db.schools
  },
  students: {
    findBySchool: (schoolId) => db.students.filter(s => s.school_id === schoolId),
    findById: (id, schoolId) => db.students.find(s => s.id === id && (!schoolId || s.school_id === schoolId)),
    create: (data) => {
      const newStudent = { id: `std-${Date.now()}`, ...data, status: 'ACTIVE' };
      db.students.push(newStudent);
      saveDb();
      return newStudent;
    },
    updatePhoto: (id, schoolId, photoUrl) => {
      const student = db.students.find(s => s.id === id && s.school_id === schoolId);
      if (student) {
        student.photo_url = photoUrl;
        saveDb();
      }
      return student;
    }
  },
  pickupPersons: {
    findBySchool: (schoolId) => db.pickupPersons.filter(p => p.school_id === schoolId),
    findById: (id) => db.pickupPersons.find(p => p.id === id),
    create: (data) => {
      const newPerson = { id: `pick-${Date.now()}`, ...data, status: 'ACTIVE' };
      db.pickupPersons.push(newPerson);
      saveDb();
      return newPerson;
    },
    updatePhoto: (id, schoolId, photoUrl) => {
      const person = db.pickupPersons.find(p => p.id === id && p.school_id === schoolId);
      if (person) {
        person.photo_url = photoUrl;
        saveDb();
      }
      return person;
    }
  },
  nfcCards: {
    findByUid: (uid, schoolId) => {
      const formattedUid = uid.trim().toUpperCase();
      return db.nfcCards.find(c => c.card_uid.toUpperCase() === formattedUid && (!schoolId || c.school_id === schoolId));
    },
    findByPickupPerson: (pickupPersonId) => db.nfcCards.filter(c => c.pickup_person_id === pickupPersonId),
    create: (data) => {
      const newCard = { id: `card-${Date.now()}`, ...data, issued_at: new Date().toISOString() };
      db.nfcCards.push(newCard);
      saveDb();
      return newCard;
    },
    updateStatus: (cardUid, status) => {
      const card = db.nfcCards.find(c => c.card_uid.toUpperCase() === cardUid.trim().toUpperCase());
      if (card) {
        card.status = status;
        saveDb();
      }
      return card;
    }
  },
  authorizations: {
    findValidAuth: (studentId, pickupPersonId) => {
      return db.authorizations.find(a => a.student_id === studentId && a.pickup_person_id === pickupPersonId && a.is_active);
    },
    findByStudent: (studentId) => {
      return db.authorizations.filter(a => a.student_id === studentId && a.is_active);
    },
    findByPickupPerson: (pickupPersonId) => {
      return db.authorizations.filter(a => a.pickup_person_id === pickupPersonId && a.is_active);
    }
  }
};
