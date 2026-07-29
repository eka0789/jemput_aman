import './styles/theme.css';
import { renderPageShell } from './components/PageShell.js';
import { renderGateReaderPage } from './pages/GateReaderPage.js';
import { renderParentPortalPage } from './pages/ParentPortalPage.js';
import { renderAdminDashboardPage } from './pages/AdminDashboardPage.js';
import { renderDataManagementPage } from './pages/DataManagementPage.js';
import { renderFoundationDashboardPage } from './pages/FoundationDashboardPage.js';
import { renderScheduleConfigPage } from './pages/ScheduleConfigPage.js';
import { offlineQueue } from './services/offlineQueueService.js';
import { webNfc } from './services/webNfcService.js';
import { registerServiceWorker } from './serviceWorker.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1');
const SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID || '1001-tk-ceria-salatiga';

const getAuthToken = () => localStorage.getItem('jemput_aman_access_token');
const getTokenRole = () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role;
  } catch {
    return null;
  }
};

const apiFetch = (path, options = {}, developmentRole = 'TEACHER') => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('X-School-ID', SCHOOL_ID);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (import.meta.env.DEV && !token) headers.set('X-Mock-Role', developmentRole);
  return fetch(`${API_BASE}${path}`, { ...options, headers });
};

const readJsonResponse = async (response, fallbackMessage) => {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!response.ok) throw new Error(result.message || fallbackMessage);
  return result;
};

const state = {
  activeTab: 'reader', // reader, parent, admin, data, foundation
  dataSubTab: 'nfc_bind',
  scheduleStudentId: '1111',
  weeklySchedules: [],
  isKioskLocked: true, // DEFAULT TRUE FOR GATE TABLET SECURITY!
  securityPin: import.meta.env.VITE_KIOSK_PIN || (import.meta.env.DEV ? '1234' : ''),
  showAddStudent: false,
  lastVerification: null,
  cameraError: '',
  showBindModal: false,
  newCardUid: '',
  pickupLogs: [
    {
      id: 'log-001',
      student_name: 'Ananda Bintang',
      pickup_person_name: 'Budi Santoso (Ayah Kandung)',
      verification_method: 'NFC_TAP',
      status: 'VERIFIED',
      timestamp: new Date().toISOString(),
      notes: 'Penjemputan rutin terverifikasi sah'
    }
  ],
  pendingOtps: [],
  cards: [
    { uid: '04:A2:8B:12:FE:67:80', pickup_person_id: '2222', holder: 'Budi Santoso (Ayah Kandung)', status: 'ACTIVE', student: 'Ananda Bintang (TK-A1)' },
    { uid: '04:B3:9C:23:FF:78:91', pickup_person_id: '2223', holder: 'Pak Joko (Supir Keluarga)', status: 'ACTIVE', student: 'Ananda Bintang (TK-A1)' },
    { uid: '99:99:99:99:99:99:99', holder: 'Kartu Lama (Telah Dilaporkan Hilang)', status: 'LOST', student: 'Siti Rahma (TK-B2)' }
  ],
  students: [
    { id: '1111', parent_id: 'usr-parent-1', name: 'Ananda Bintang', class_name: 'TK-A1', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890', photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' },
    { id: '1112', parent_id: 'usr-parent-1', name: 'Siti Rahma', class_name: 'TK-B2', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890', photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' }
  ],
  pickupPersons: [
    { id: '2222', name: 'Budi Santoso', relationship: 'Ayah Kandung', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: '2223', name: 'Pak Joko', relationship: 'Supir Keluarga', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
  ],
  staff: [
    { id: 'usr-teacher-1', name: 'Pak Ahmad, S.Pd', role: 'Guru Piket Gerbang', phone: '081122334456' },
    { id: 'usr-admin-1', name: 'Ibu Ratna, S.Pd', role: 'Admin Sekolah', phone: '081122334455' },
    { id: 'usr-foundation-1', name: 'Drs. H. Bambang', role: 'Pengurus Yayasan', phone: '081999888777' }
  ]
};

function render() {
  const app = document.getElementById('app');
  let contentHtml = '';

  // Enforce kiosk mode restriction
  if (state.isKioskLocked) {
    state.activeTab = 'reader';
  }

  if (state.activeTab === 'reader') {
    contentHtml = renderGateReaderPage(state);
  } else if (state.activeTab === 'parent') {
    contentHtml = renderParentPortalPage(state);
  } else if (state.activeTab === 'admin') {
    contentHtml = renderAdminDashboardPage(state);
  } else if (state.activeTab === 'data') {
    contentHtml = renderDataManagementPage(state);
  } else if (state.activeTab === 'foundation') {
    contentHtml = renderFoundationDashboardPage(state);
  } else if (state.activeTab === 'schedule') {
    contentHtml = renderScheduleConfigPage(state);
  }

  app.innerHTML = `
    ${renderPageShell(state.activeTab, state.isKioskLocked)}
    <main style="padding-bottom: 3rem;">${contentHtml}</main>
  `;

  // Attach Navigation Click Listeners
  document.querySelectorAll('nav button[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.isKioskLocked) {
        alert('🔒 Mode Kiosk Gerbang Terkunci! Hanya menu Reader Gerbang yang dapat diakses. Masukkan PIN Admin untuk membuka kunci.');
        return;
      }
      state.activeTab = e.currentTarget.getAttribute('data-tab');
      render();
      if (state.activeTab === 'schedule') loadStudentSchedule();
      if (state.activeTab === 'parent') loadPendingOtps();
    });
  });
}

// Kiosk Gate Security Lock Handlers
window.lockKioskMode = () => {
  state.isKioskLocked = true;
  state.activeTab = 'reader';
  alert('🔒 MODE KIOSK GERBANG DIAKTIFKAN!\n\nTablet sekarang terkunci khusus untuk verifikasi tap NFC gerbang sekolah. Menu Admin & Data Siswa telah disembunyikan secara aman.');
  render();
};

const loadPendingOtps = async () => {
  try {
    const response = await apiFetch('/pickup/pending-otps', {}, 'PARENT');
    const result = await readJsonResponse(response, 'Permintaan OTP gagal dimuat.');
    state.pendingOtps = result.data;
    render();
  } catch (error) {
    console.warn('Pending OTP sync unavailable:', error);
  }
};

const loadStudentSchedule = async () => {
  try {
    const response = await apiFetch(`/schedules/${state.scheduleStudentId}`, {}, 'PARENT');
    const result = await readJsonResponse(response, 'Jadwal siswa gagal dimuat.');
    state.weeklySchedules = result.data;
    render();
  } catch (error) {
    alert(error.message || 'Jadwal siswa gagal dimuat.');
  }
};

window.changeScheduleStudent = async (studentId) => {
  state.scheduleStudentId = studentId;
  await loadStudentSchedule();
};

window.saveWeeklySchedule = async () => {
  const schedules = [...document.querySelectorAll('[data-schedule-day]')]
    .filter(select => select.value)
    .map(select => ({
      day_of_week: select.dataset.scheduleDay,
      pickup_person_id: select.value
    }));
  try {
    const response = await apiFetch(`/schedules/${state.scheduleStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules })
    }, 'PARENT');
    const result = await readJsonResponse(response, 'Jadwal gagal disimpan.');
    state.weeklySchedules = result.data;
    alert(result.message);
    render();
  } catch (error) {
    alert(error.message || 'Jadwal gagal disimpan.');
  }
};

window.promptUnlockKiosk = () => {
  const role = getTokenRole();
  if (!import.meta.env.DEV && !['ADMIN', 'FOUNDATION'].includes(role)) {
    alert('Akses penuh hanya dapat dibuka oleh akun Admin atau Yayasan yang telah login.');
    return;
  }
  const inputPin = import.meta.env.DEV
    ? prompt('Masukkan PIN kiosk development:')
    : state.securityPin;
  if (inputPin === state.securityPin) {
    state.isKioskLocked = false;
    alert('🔓 AKSES DIBUKA! Seluruh menu Admin, Data Siswa, & Laporan Yayasan sekarang dapat diakses.');
    render();
  } else if (inputPin !== null) {
    alert('❌ PIN Salah! Akses menu tetap dikunci.');
  }
};

// Sub-Tab Switcher
window.switchDataSubTab = (tab) => {
  state.dataSubTab = tab;
  render();
};

window.openAddStudentForm = () => {
  state.showAddStudent = true;
  render();
};

window.closeAddStudentForm = () => {
  state.showAddStudent = false;
  render();
};

const resizeProfilePhoto = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Pilih file gambar JPG, PNG, atau WebP.'));
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    reject(new Error('Ukuran foto maksimal 8 MB.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('File foto tidak dapat dibaca.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Isi file gambar tidak valid.'));
    image.onload = () => {
      const maxDimension = 720;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

window.selectProfilePhoto = (profileType, profileId) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const photoUrl = await resizeProfilePhoto(file);
      const isStudent = profileType === 'student';
      const endpoint = isStudent
        ? `${API_BASE}/students/${profileId}/photo`
        : `${API_BASE}/pickup-persons/${profileId}/photo`;
      const response = await apiFetch(endpoint.replace(API_BASE, ''), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photo_url: photoUrl })
      }, 'ADMIN');
      const result = await readJsonResponse(response, 'Foto gagal disimpan.');

      const profiles = isStudent ? state.students : state.pickupPersons;
      const profile = profiles.find(item => item.id === profileId);
      if (profile) profile.photo_url = result.data.photo_url;
      alert(result.message);
      render();
    } catch (err) {
      alert(err.message || 'Foto gagal diproses.');
    }
  }, { once: true });

  input.click();
};

window.editParentWhatsapp = async (studentId) => {
  const student = state.students.find(item => item.id === studentId);
  if (!student) return;

  const phoneNumber = prompt(
    `Nomor WhatsApp orang tua/wali ${student.name}:`,
    student.phone || ''
  );
  if (phoneNumber === null) return;

  try {
    const response = await apiFetch(`/students/${studentId}/parent-phone`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    }, 'ADMIN');
    const result = await readJsonResponse(response, 'Nomor WhatsApp gagal disimpan.');

    state.students
      .filter(item => item.parent_id === result.data.parent_id)
      .forEach(item => { item.phone = result.data.phone_number; });
    alert(result.message);
    render();
  } catch (err) {
    alert(err.message || 'Nomor WhatsApp gagal disimpan.');
  }
};

window.submitNewStudent = async () => {
  const name = document.getElementById('new_std_name')?.value;
  const className = document.getElementById('new_std_class')?.value || 'TK-A1';
  const parentName = document.getElementById('new_std_parent')?.value || 'Orang Tua';

  if (!name) {
    alert('Silakan masukkan nama murid baru!');
    return;
  }

  try {
    const response = await apiFetch('/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name: name, class_name: className, student_number: `NIS-${Date.now()}` })
    }, 'ADMIN');
    const result = await readJsonResponse(response, 'Data siswa gagal disimpan.');
    const savedStudent = result.data;
    state.students.push({
      id: savedStudent.id,
      parent_id: savedStudent.parent_id,
      name: savedStudent.full_name,
      class_name: savedStudent.class_name,
      parent_name: parentName,
      phone: '-',
      photo_url: savedStudent.photo_url
    });
    state.showAddStudent = false;
    alert(result.message);
    render();
  } catch (error) {
    alert(error.message || 'Data siswa gagal disimpan.');
  }
};

// Tap-to-Bind Registration Handlers
window.autoFillNewNfcUid = () => {
  const randomUid = '04:' + Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0').toUpperCase()).join(':');
  state.newCardUid = randomUid;
  render();
};

window.submitFullNfcRegistration = async () => {
  const uid = state.newCardUid || document.getElementById('reg_nfc_uid')?.value;
  const pickupSelect = document.getElementById('reg_pickup_person_id');
  const studentSelect = document.getElementById('reg_student_id');

  if (!uid) {
    alert('Silakan tempelkan kartu NFC atau klik tombol simulasi tap otomatis untuk membaca UID kartu!');
    return;
  }
  if (!pickupSelect?.value) {
    alert('Silakan pilih penjemput terdaftar.');
    return;
  }

  const pickupPerson = state.pickupPersons.find(person => person.id === pickupSelect.value);
  const studentName = studentSelect?.options[studentSelect.selectedIndex]?.text || 'Siswa';
  const holderText = `${pickupPerson.name} (${pickupPerson.relationship})`;

  try {
    const response = await apiFetch('/nfc/cards/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ card_uid: uid, pickup_person_id: pickupPerson.id })
    }, 'ADMIN');
    const result = await readJsonResponse(response, 'Kartu NFC gagal ditautkan.');
    state.cards.unshift({
      uid: result.data.card_uid,
      pickup_person_id: result.data.pickup_person_id,
      holder: holderText,
      status: result.data.status,
      student: studentName
    });
    state.newCardUid = '';
    alert(result.message);
    render();
  } catch (error) {
    alert(error.message || 'Kartu NFC gagal ditautkan.');
  }
};

// Window Global Actions for Interactivity & Demo
const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

const captureFacePhoto = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Kamera tidak tersedia. Buka aplikasi melalui HTTPS atau localhost di browser yang mendukung kamera.');
  }

  const cameraDialog = document.createElement('div');
  cameraDialog.className = 'camera-capture-overlay';
  cameraDialog.innerHTML = `
    <section class="camera-capture-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <div class="camera-capture-header">
        <div>
          <h3 id="camera-title">Foto Verifikasi Penjemput</h3>
          <p id="camera-status">Meminta izin kamera...</p>
        </div>
        <span class="camera-live-badge">LIVE</span>
      </div>
      <div class="camera-preview-frame">
        <video autoplay muted playsinline aria-label="Preview kamera wajah penjemput"></video>
        <div class="camera-face-guide" aria-hidden="true"></div>
      </div>
      <p class="camera-privacy-note">Foto diambil otomatis dan disimpan sebagai bukti verifikasi penjemputan.</p>
    </section>
  `;
  document.body.appendChild(cameraDialog);

  const video = cameraDialog.querySelector('video');
  const status = cameraDialog.querySelector('#camera-status');
  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    if (!video.videoWidth) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Kamera tidak mengirimkan gambar.')), 5000);
        video.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }

    status.textContent = 'Posisikan wajah di dalam panduan. Foto diambil otomatis...';
    await wait(1200);

    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL('image/jpeg', 0.82);

    status.textContent = 'Foto berhasil diambil.';
    cameraDialog.classList.add('is-captured');
    await wait(500);
    return photo;
  } catch (err) {
    console.warn('Camera capture unavailable:', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Izin kamera ditolak. Izinkan akses kamera pada pengaturan browser lalu coba lagi.');
    }
    if (err.name === 'NotFoundError') {
      throw new Error('Kamera tidak ditemukan pada perangkat ini.');
    }
    throw err;
  } finally {
    stream?.getTracks().forEach(track => track.stop());
    cameraDialog.remove();
  }
};

const storeVerificationPhoto = async (verification, facePhoto) => {
  const pickupLogId = verification?.data?.pickup_log_id;
  if (!pickupLogId) {
    verification.data.verification_photo = facePhoto;
    return;
  }

  const response = await apiFetch('/pickup/verification-photo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pickup_log_id: pickupLogId, face_photo: facePhoto })
  }, 'TEACHER');
  const result = await readJsonResponse(response, 'Foto gagal disimpan ke data verifikasi.');

  verification.status = result.status;
  verification.message = result.message;
  verification.data = { ...verification.data, ...result.data };
  const localLog = state.pickupLogs.find(log => log.id === pickupLogId);
  if (localLog) {
    localLog.status = result.status;
    localLog.notes = result.message;
    localLog.verification_photo = result.data?.verification_photo || null;
  }
};

const captureVerificationPhoto = async () => {
  if (
    !['PENDING_PHOTO', 'VERIFIED'].includes(state.lastVerification?.status)
    || state.lastVerification?.data?.verification_photo
  ) return;

  state.cameraError = '';
  try {
    const facePhoto = await captureFacePhoto();
    await storeVerificationPhoto(state.lastVerification, facePhoto);
  } catch (err) {
    state.cameraError = err.message || 'Kamera gagal mengambil foto verifikasi.';
  }
  render();
};

window.retryVerificationPhoto = captureVerificationPhoto;

window.simulateNfcTap = async (cardUid) => {
  const localCard = state.cards.find(c => c.uid === cardUid);
  if (localCard && localCard.status !== 'ACTIVE') {
    state.lastVerification = {
      status: 'BLOCKED',
      message: 'AKSES DITOLAK: Kartu NFC Telah Dilaporkan Hilang / Nonaktif!'
    };
    state.pickupLogs.unshift({
      id: `log-${Date.now()}`,
      student_name: localCard.student,
      pickup_person_name: localCard.holder,
      verification_method: 'NFC_TAP',
      status: 'BLOCKED',
      timestamp: new Date().toISOString(),
      notes: 'Percobaan pengetapan kartu berstatus LOST'
    });
    render();
    return;
  }

  try {
    const response = await apiFetch('/pickup/verify-nfc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ card_uid: cardUid })
    }, 'TEACHER');
    const result = await response.json();
    state.lastVerification = result;
    state.cameraError = '';
    if (result.data) {
      state.pickupLogs.unshift({
        id: result.data.pickup_log_id,
        student_name: result.data.student.full_name,
        pickup_person_name: `${result.data.pickup_person.full_name} (${result.data.pickup_person.relationship})`,
        verification_method: 'NFC_TAP',
        status: result.status,
        timestamp: result.data.timestamp,
        notes: result.message,
        verification_photo: result.data.verification_photo || null
      });
    }
    render();
    if (response.ok && ['PENDING_PHOTO', 'VERIFIED'].includes(result.status)) {
      await captureVerificationPhoto();
    }
    return;
  } catch (err) {
    try {
      await offlineQueue.enqueueTap({ card_uid: cardUid, school_id: SCHOOL_ID });
    } catch {
      // The visible result remains blocked even if the local audit queue is unavailable.
    }
    state.lastVerification = {
      status: 'BLOCKED',
      code: 'VERIFICATION_SERVICE_UNAVAILABLE',
      message: `VERIFIKASI GAGAL: ${err.message || 'Backend tidak dapat dihubungi'}. Jangan izinkan siswa pulang sebelum pemeriksaan manual.`
    };
  }
  state.cameraError = '';
  render();
  if (state.lastVerification?.status === 'PENDING_PHOTO') {
    await captureVerificationPhoto();
  }
};

window.startNfcReader = async () => {
  const started = await webNfc.startScan(
    card => window.simulateNfcTap(card.serialNumber),
    message => alert(message)
  );
  if (started) alert('Reader NFC aktif. Tempelkan kartu pada perangkat.');
};

window.openEmergencyModal = async () => {
  try {
    const response = await apiFetch('/pickup/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: '1111', pickup_person_id: '2222' })
    }, 'TEACHER');
    const result = await readJsonResponse(response, 'Permintaan OTP gagal dibuat.');
    state.pendingOtps.unshift({
      ...result.data,
      student_name: 'Ananda Bintang',
      pickup_person_name: 'Budi Santoso (Lupa Kartu NFC)'
    });
    const debugCode = result.data.debug_otp_code
      ? `\nKode development: ${result.data.debug_otp_code}`
      : '';
    alert(`${result.message}${debugCode}`);
    render();
  } catch (error) {
    alert(error.message || 'Permintaan OTP gagal dibuat.');
  }
};

window.approveOtp = async (otpId) => {
  const otp = state.pendingOtps.find(item => item.id === otpId);
  const parentOneClickApproval = !import.meta.env.DEV && getTokenRole() === 'PARENT';
  const code = parentOneClickApproval
    ? null
    : prompt('Masukkan kode OTP 6 digit:', otp?.debug_otp_code || '');
  if (!parentOneClickApproval && code === null) return;
  try {
    const response = await apiFetch('/pickup/approve-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp_id: otpId, otp_code: code })
    }, 'PARENT');
    const result = await readJsonResponse(response, 'OTP gagal disetujui.');
    state.pendingOtps = state.pendingOtps.filter(item => item.id !== otpId);
    state.pickupLogs.unshift({
      id: `log-${Date.now()}`,
      student_name: otp?.student_name || 'Siswa',
      pickup_person_name: otp?.pickup_person_name || 'Penjemput',
      verification_method: 'EMERGENCY_OTP',
      status: 'VERIFIED',
      timestamp: new Date().toISOString(),
      notes: 'Disetujui menggunakan OTP valid'
    });
    alert(result.message);
    render();
  } catch (error) {
    alert(error.message || 'OTP gagal disetujui.');
  }
};

const downloadReport = async (format) => {
  try {
    const response = await apiFetch(`/reports/export/${format}`, {}, 'ADMIN');
    if (!response.ok) {
      await readJsonResponse(response, 'Laporan gagal diunduh.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Laporan_Kepulangan.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message || 'Laporan gagal diunduh.');
  }
};

window.exportExcelReport = () => downloadReport('excel');
window.exportPdfReport = () => downloadReport('pdf');

window.toggleCardStatus = async (uid, status) => {
  try {
    const response = await apiFetch('/nfc/cards/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_uid: uid, status })
    }, 'ADMIN');
    const result = await readJsonResponse(response, 'Status kartu gagal diperbarui.');
    const card = state.cards.find(item => item.uid === uid);
    if (card) card.status = result.data.status;
    alert(result.message);
    render();
  } catch (error) {
    alert(error.message || 'Status kartu gagal diperbarui.');
  }
};

const hydrateProfileData = async () => {
  try {
    const [studentsResponse, peopleResponse] = await Promise.all([
      apiFetch('/students', {}, 'TEACHER'),
      apiFetch('/pickup-persons', {}, 'TEACHER')
    ]);

    if (studentsResponse.ok) {
      const result = await studentsResponse.json();
      state.students = result.data.map(student => {
        const local = state.students.find(item => item.id === student.id);
        return {
          id: student.id,
          parent_id: student.parent_id,
          name: student.full_name,
          class_name: student.class_name,
          parent_name: student.parent_name || local?.parent_name || 'Orang Tua / Wali',
          phone: student.parent_phone_number || '-',
          photo_url: student.photo_url
        };
      });
    }

    if (peopleResponse.ok) {
      const result = await peopleResponse.json();
      state.pickupPersons = result.data.map(person => ({
        id: person.id,
        name: person.full_name,
        relationship: person.relationship,
        photo_url: person.photo_url
      }));
    }
    render();
  } catch (err) {
    console.warn('Profile data sync unavailable:', err);
  }
};

// Initial Render
render();
hydrateProfileData();
registerServiceWorker().catch(error => console.warn('Service worker registration failed:', error));
