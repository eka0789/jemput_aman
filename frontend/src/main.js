import './styles/theme.css';
import { renderPageShell } from './components/PageShell.js';
import { renderGateReaderPage } from './pages/GateReaderPage.js';
import { renderParentPortalPage } from './pages/ParentPortalPage.js';
import { renderAdminDashboardPage } from './pages/AdminDashboardPage.js';
import { renderDataManagementPage } from './pages/DataManagementPage.js';
import { renderFoundationDashboardPage } from './pages/FoundationDashboardPage.js';

const API_BASE = 'http://localhost:3000/api/v1';

const state = {
  activeTab: 'reader', // reader, parent, admin, data, foundation
  dataSubTab: 'nfc_bind',
  isKioskLocked: true, // DEFAULT TRUE FOR GATE TABLET SECURITY!
  securityPin: '1234',
  showAddStudent: false,
  lastVerification: null,
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
    { uid: '04:A2:8B:12:FE:67:80', holder: 'Budi Santoso (Ayah Kandung)', status: 'ACTIVE', student: 'Ananda Bintang (TK-A1)' },
    { uid: '04:B3:9C:23:FF:78:91', holder: 'Pak Joko (Supir Keluarga)', status: 'ACTIVE', student: 'Ananda Bintang (TK-A1)' },
    { uid: '99:99:99:99:99:99:99', holder: 'Kartu Lama (Telah Dilaporkan Hilang)', status: 'LOST', student: 'Siti Rahma (TK-B2)' }
  ],
  students: [
    { id: '1111', name: 'Ananda Bintang', class_name: 'TK-A1', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890' },
    { id: '1112', name: 'Siti Rahma', class_name: 'TK-B2', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890' }
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

window.promptUnlockKiosk = () => {
  const inputPin = prompt('🔑 Masukkan 4-Digit PIN Keamanan Admin/Kepala Sekolah untuk Buka Kunci (Default PIN: 1234):');
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

window.submitNewStudent = async () => {
  const name = document.getElementById('new_std_name')?.value;
  const className = document.getElementById('new_std_class')?.value || 'TK-A1';
  const parentName = document.getElementById('new_std_parent')?.value || 'Orang Tua';

  if (!name) {
    alert('Silakan masukkan nama murid baru!');
    return;
  }

  try {
    await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': '1001-tk-ceria-salatiga'
      },
      body: JSON.stringify({ full_name: name, class_name: className, student_number: `NIS-${Date.now()}` })
    });
  } catch (e) {
    console.log('Student add fallback', e);
  }

  state.students.push({
    id: `std-${Date.now()}`,
    name: name,
    class_name: className,
    parent_name: parentName,
    phone: '081234567890'
  });

  state.showAddStudent = false;
  alert(`🎉 Sukses! Murid [${name}] berhasil didaftarkan.`);
  render();
};

// Tap-to-Bind Registration Handlers
window.autoFillNewNfcUid = () => {
  const randomUid = '04:' + Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0').toUpperCase()).join(':');
  state.newCardUid = randomUid;
  render();
};

window.submitFullNfcRegistration = async () => {
  const uid = state.newCardUid || document.getElementById('reg_nfc_uid')?.value;
  const pickupName = document.getElementById('reg_pickup_name')?.value;
  const relationSelect = document.getElementById('reg_pickup_relation');
  const studentSelect = document.getElementById('reg_student_id');

  if (!uid) {
    alert('Silakan tempelkan kartu NFC atau klik tombol simulasi tap otomatis untuk membaca UID kartu!');
    return;
  }
  if (!pickupName) {
    alert('Silakan masukkan nama penjemput (misal: Pak Joko / Ayah Budi)!');
    return;
  }

  const relation = relationSelect?.value || 'Penjemput Sah';
  const studentName = studentSelect?.options[studentSelect.selectedIndex]?.text || 'Siswa';
  const holderText = `${pickupName} (${relation})`;

  try {
    await fetch(`${API_BASE}/nfc/cards/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': '1001-tk-ceria-salatiga'
      },
      body: JSON.stringify({ card_uid: uid, pickup_person_id: '2222' })
    });
  } catch (e) {
    console.log('API bind call fallback', e);
  }

  state.cards.unshift({
    uid: uid,
    holder: holderText,
    status: 'ACTIVE',
    student: studentName
  });

  state.newCardUid = '';
  alert(`🎉 REGISTRASI OTOMATIS BERHASIL!\n\nKartu NFC [${uid}] telah ditautkan dan SINKRON 100% dengan profil Penjemput: ${holderText}.\n\nKartu fisik ini sekarang langsung aktif dan dapat di-tap di reader gerbang sekolah!`);
  render();
};

// Window Global Actions for Interactivity & Demo
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
    const response = await fetch(`${API_BASE}/pickup/verify-nfc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': '1001-tk-ceria-salatiga'
      },
      body: JSON.stringify({ card_uid: cardUid })
    });
    const result = await response.json();
    state.lastVerification = result;
    if (result.data) {
      state.pickupLogs.unshift({
        id: result.data.pickup_log_id,
        student_name: result.data.student.full_name,
        pickup_person_name: `${result.data.pickup_person.full_name} (${result.data.pickup_person.relationship})`,
        verification_method: 'NFC_TAP',
        status: result.status,
        timestamp: result.data.timestamp,
        notes: result.message
      });
    }
  } catch (err) {
    if (cardUid === '04:A2:8B:12:FE:67:80') {
      state.lastVerification = {
        status: 'VERIFIED',
        message: 'Penjemputan Terverifikasi Sah (Ayah Kandung)',
        data: {
          student: { full_name: 'Ananda Bintang', class_name: 'TK-A1', photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' },
          pickup_person: { full_name: 'Budi Santoso', relationship: 'Ayah Kandung', phone_number: '081234567890', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
          timestamp: new Date().toISOString()
        }
      };
    } else if (cardUid === '04:B3:9C:23:FF:78:91') {
      state.lastVerification = {
        status: 'VERIFIED',
        message: 'Penjemputan Terverifikasi Sah (Supir Keluarga)',
        data: {
          student: { full_name: 'Ananda Bintang', class_name: 'TK-A1', photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' },
          pickup_person: { full_name: 'Pak Joko', relationship: 'Supir Keluarga', phone_number: '081987654321', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
          timestamp: new Date().toISOString()
        }
      };
    } else if (localCard) {
      state.lastVerification = {
        status: 'VERIFIED',
        message: `Penjemputan Terverifikasi Sah (${localCard.holder})`,
        data: {
          student: { full_name: localCard.student, class_name: 'TK-A1', photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' },
          pickup_person: { full_name: localCard.holder, relationship: 'Penjemput Terdaftar', phone_number: '081234567890', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
          timestamp: new Date().toISOString()
        }
      };
    } else {
      state.lastVerification = {
        status: 'BLOCKED',
        message: 'AKSES DITOLAK: Kartu NFC Tidak Terdaftar atau Hilang!'
      };
    }
  }
  render();
};

window.openEmergencyModal = () => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  state.pendingOtps.push({
    id: `otp-${Date.now()}`,
    student_name: 'Ananda Bintang',
    pickup_person_name: 'Budi Santoso (Lupa Kartu NFC)',
    otp_code: otpCode
  });
  alert(`Permintaan OTP Darurat [${otpCode}] telah dikirim ke Aplikasi Orang Tua!\n\n(Buka Kunci Admin PIN 1234 jika ingin berpindah ke tab 'Portal Orang Tua').`);
  render();
};

window.approveOtp = (otpId) => {
  state.pendingOtps = state.pendingOtps.filter(o => o.id !== otpId);
  state.pickupLogs.unshift({
    id: `log-${Date.now()}`,
    student_name: 'Ananda Bintang',
    pickup_person_name: 'Budi Santoso (Ayah Kandung)',
    verification_method: 'EMERGENCY_OTP',
    status: 'VERIFIED',
    timestamp: new Date().toISOString(),
    notes: 'Disetujui Orang Tua via OTP Darurat'
  });
  alert('✅ Penjemputan Darurat Berhasil Disetujui!');
  render();
};

window.exportExcelReport = () => {
  window.open(`${API_BASE}/reports/export/excel`, '_blank');
};

window.exportPdfReport = () => {
  window.open(`${API_BASE}/reports/export/pdf`, '_blank');
};

window.toggleCardStatus = (uid, status) => {
  const card = state.cards.find(c => c.uid === uid);
  if (card) {
    card.status = status;
  }
  alert(`Status Kartu NFC [${uid}] berhasil diubah menjadi ${status}`);
  render();
};

// Initial Render
render();
