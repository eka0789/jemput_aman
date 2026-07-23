import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const initialData = {
  schools: [
    {
      id: '1001-tk-ceria-salatiga',
      foundation_id: 'found-01',
      name: 'PAUD/TK Ceria Salatiga',
      code: 'TK-SALATIGA-01',
      city: 'Salatiga',
      status: 'ACTIVE'
    },
    {
      id: '1002-tk-harapan-semarang',
      foundation_id: 'found-01',
      name: 'TK Harapan Bangsa Semarang',
      code: 'TK-SEMARANG-02',
      city: 'Semarang',
      status: 'ACTIVE'
    }
  ],
  users: [
    {
      id: 'usr-admin-1',
      school_id: '1001-tk-ceria-salatiga',
      role: 'ADMIN',
      full_name: 'Ibu Ratna S.Pd (Admin)',
      email: 'admin@tkceria-salatiga.sch.id',
      phone_number: '081122334455'
    },
    {
      id: 'usr-teacher-1',
      school_id: '1001-tk-ceria-salatiga',
      role: 'TEACHER',
      full_name: 'Pak Ahmad (Guru Piket)',
      email: 'ahmad@tkceria-salatiga.sch.id',
      phone_number: '081122334456'
    },
    {
      id: 'usr-parent-1',
      school_id: '1001-tk-ceria-salatiga',
      role: 'PARENT',
      full_name: 'Ibu Dewi Kurnia (Orang Tua)',
      email: 'dewi@gmail.com',
      phone_number: '081234567890'
    },
    {
      id: 'usr-foundation-1',
      school_id: '1001-tk-ceria-salatiga',
      role: 'FOUNDATION',
      full_name: 'Drs. H. Bambang (Yayasan Pendidikan)',
      email: 'bambang@yayasan.org',
      phone_number: '081999888777'
    }
  ],
  students: [
    {
      id: '1111',
      school_id: '1001-tk-ceria-salatiga',
      parent_id: 'usr-parent-1',
      full_name: 'Ananda Bintang',
      class_name: 'TK-A1',
      student_number: 'NIS-2025-014',
      photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'ACTIVE'
    },
    {
      id: '1112',
      school_id: '1001-tk-ceria-salatiga',
      parent_id: 'usr-parent-1',
      full_name: 'Siti Rahma',
      class_name: 'TK-B2',
      student_number: 'NIS-2024-089',
      photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'ACTIVE'
    }
  ],
  pickupPersons: [
    {
      id: '2222',
      school_id: '1001-tk-ceria-salatiga',
      parent_id: 'usr-parent-1',
      full_name: 'Budi Santoso',
      relationship: 'Ayah Kandung',
      phone_number: '081234567890',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'ACTIVE'
    },
    {
      id: '2223',
      school_id: '1001-tk-ceria-salatiga',
      parent_id: 'usr-parent-1',
      full_name: 'Pak Joko',
      relationship: 'Supir Keluarga',
      phone_number: '081987654321',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'ACTIVE'
    }
  ],
  nfcCards: [
    {
      id: 'card-001',
      school_id: '1001-tk-ceria-salatiga',
      pickup_person_id: '2222',
      card_uid: '04:A2:8B:12:FE:67:80',
      status: 'ACTIVE',
      issued_at: '2026-01-10T08:00:00Z'
    },
    {
      id: 'card-002',
      school_id: '1001-tk-ceria-salatiga',
      pickup_person_id: '2223',
      card_uid: '04:B3:9C:23:FF:78:91',
      status: 'ACTIVE',
      issued_at: '2026-01-15T08:00:00Z'
    },
    {
      id: 'card-lost',
      school_id: '1001-tk-ceria-salatiga',
      pickup_person_id: null,
      card_uid: '99:99:99:99:99:99:99',
      status: 'LOST',
      issued_at: '2025-12-01T08:00:00Z'
    }
  ],
  authorizations: [
    { id: 'auth-1', student_id: '1111', pickup_person_id: '2222', is_active: true },
    { id: 'auth-2', student_id: '1111', pickup_person_id: '2223', is_active: true },
    { id: 'auth-3', student_id: '1112', pickup_person_id: '2222', is_active: true }
  ],
  weeklySchedules: [
    { id: 'sch-1', student_id: '1111', pickup_person_id: '2222', day_of_week: 'MON' },
    { id: 'sch-2', student_id: '1111', pickup_person_id: '2222', day_of_week: 'TUE' },
    { id: 'sch-3', student_id: '1111', pickup_person_id: '2222', day_of_week: 'WED' },
    { id: 'sch-4', student_id: '1111', pickup_person_id: '2223', day_of_week: 'THU' },
    { id: 'sch-5', student_id: '1111', pickup_person_id: '2223', day_of_week: 'FRI' }
  ],
  pickupLogs: [
    {
      id: 'log-001',
      school_id: '1001-tk-ceria-salatiga',
      student_id: '1111',
      student_name: 'Ananda Bintang',
      pickup_person_id: '2222',
      pickup_person_name: 'Budi Santoso (Ayah Kandung)',
      nfc_card_id: 'card-001',
      duty_teacher_id: 'usr-teacher-1',
      verification_method: 'NFC_TAP',
      status: 'VERIFIED',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Penjemputan rutin terverifikasi'
    }
  ],
  emergencyOtps: []
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing persistent data file if present, or initialize
let dbStore;
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    dbStore = JSON.parse(rawData);
    console.log(`[Database Loaded] Persistent database loaded from ${DB_FILE}`);
  } catch (err) {
    console.error(`[Database Error] Failed to read ${DB_FILE}, using default seed.`, err);
    dbStore = JSON.parse(JSON.stringify(initialData));
  }
} else {
  dbStore = JSON.parse(JSON.stringify(initialData));
  fs.writeFileSync(DB_FILE, JSON.stringify(dbStore, null, 2), 'utf-8');
  console.log(`[Database Created] Persistent database created at ${DB_FILE}`);
}

export const db = dbStore;

export const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Database Save Error] Failed to persist changes to ${DB_FILE}:`, err);
  }
};
