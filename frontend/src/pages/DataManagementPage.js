import { escapeHtml as h } from '../utils/html.js';

export function renderDataManagementPage(state) {
  const cards = state.cards || [];
  const students = state.students || [
    { id: '1111', name: 'Ananda Bintang', class_name: 'TK-A1', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890' },
    { id: '1112', name: 'Siti Rahma', class_name: 'TK-B2', parent_name: 'Ibu Dewi Kurnia', phone: '081234567890' }
  ];
  const pickupPersons = state.pickupPersons || [];
  const staff = state.staff || [
    { id: 'usr-teacher-1', name: 'Pak Ahmad, S.Pd', role: 'Guru Piket Gerbang', phone: '081122334456' },
    { id: 'usr-admin-1', name: 'Ibu Ratna, S.Pd', role: 'Admin Sekolah', phone: '081122334455' },
    { id: 'usr-foundation-1', name: 'Drs. H. Bambang', role: 'Pengurus Yayasan', phone: '081999888777' }
  ];

  const subTab = state.dataSubTab || 'nfc_bind'; // nfc_bind, students, staff

  return `
    <div class="container">
      
      <!-- Header -->
      <div class="edu-card" style="background: white; margin-bottom: 1.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-size: 1.5rem;">⚙️</span>
              <h3 class="text-heading" style="margin: 0; font-size: 1.35rem;">Pusat Input Data & Tap-to-Bind NFC</h3>
            </div>
            <p style="font-size: 0.88rem; color: #64748b; margin: 0;">
              Input data Siswa, Orang Tua, Supir/Penjemput, Guru Piket, serta Penautan Otomatis Kartu NFC.
            </p>
          </div>

          <!-- Sub-Tab Navigators -->
          <div style="display: flex; gap: 0.4rem; background: #f1f5f9; padding: 0.35rem; border-radius: 9999px;">
            <button class="btn ${subTab === 'nfc_bind' ? 'btn-primary' : 'btn-secondary'}" onclick="window.switchDataSubTab('nfc_bind')" style="font-size: 0.82rem; padding: 0.45rem 0.9rem;">
              🎴 Registrasi NFC & Penjemput
            </button>
            <button class="btn ${subTab === 'students' ? 'btn-primary' : 'btn-secondary'}" onclick="window.switchDataSubTab('students')" style="font-size: 0.82rem; padding: 0.45rem 0.9rem;">
              👶 Data Siswa & Ortum
            </button>
            <button class="btn ${subTab === 'staff' ? 'btn-primary' : 'btn-secondary'}" onclick="window.switchDataSubTab('staff')" style="font-size: 0.82rem; padding: 0.45rem 0.9rem;">
              👨‍🏫 Guru Piket & Yayasan
            </button>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 1: REGISTRASI KARTU NFC & PENJEMPUT -->
      ${subTab === 'nfc_bind' ? `
        <div class="edu-card" style="background: white; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">✨</span>
              <h4 style="color: #0f766e; margin: 0; font-size: 1.2rem;">Form Registrasi Penjemput + Auto-Scan NFC (Tap-to-Bind)</h4>
            </div>
            <span class="badge badge-amber">Otomatis Terdeteksi NFC</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
            
            <!-- Sensor Tap Reader Target -->
            <div style="background: linear-gradient(135deg, #0f172a, #0f766e); border-radius: 18px; padding: 1.75rem; text-align: center; color: white;">
              <div style="font-size: 3.5rem; margin-bottom: 0.5rem;" class="animate-float">📡</div>
              <h4 style="color: #5eead4; margin-bottom: 0.35rem; font-size: 1.15rem;">Tap Kartu NFC Baru Di Sini</h4>
              <p style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 1.25rem;">
                Tempelkan kartu NFC ke bagian belakang tablet/HP atau klik tombol simulasi tap otomatis di bawah:
              </p>
              <button class="btn btn-amber" onclick="window.autoFillNewNfcUid()" style="width: 100%; font-size: 0.85rem;">
                ⚡ Tap Simulasi Kartu Baru (Auto-Detect UID)
              </button>
            </div>

            <!-- Input Form for Pickup Person + NFC -->
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div>
                <label style="font-size: 0.85rem; font-weight: bold; color: #0f766e; display: block; margin-bottom: 0.25rem;">UID Kartu NFC (Hasil Scan Tap):</label>
                  <input type="text" id="reg_nfc_uid" value="${h(state.newCardUid || '')}" placeholder="Scan kartu NFC untuk isi otomatis..." style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 10px; border: 2px solid #2dd4bf; font-family: monospace; font-weight: bold; color: #0f766e; background: #e6f4f1;" readonly />
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: bold; color: #334155; display: block; margin-bottom: 0.25rem;">Penjemput Sah Terdaftar:</label>
                <select id="reg_pickup_person_id" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                  ${pickupPersons.map(person => `
                    <option value="${h(person.id)}">${h(person.name)} (${h(person.relationship)})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: bold; color: #334155; display: block; margin-bottom: 0.25rem;">Terikat pada Murid (Siswa):</label>
                <select id="reg_student_id" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1.5px solid #cbd5e1;">
                  ${students.map(s => `<option value="${h(s.id)}">${h(s.name)} (${h(s.class_name)})</option>`).join('')}
                </select>
              </div>

              <button class="btn btn-primary" onclick="window.submitFullNfcRegistration()" style="width: 100%; margin-top: 0.5rem;">
                💾 Simpan & Terbitkan Kartu NFC Terikat
              </button>
            </div>

          </div>
        </div>

        <div class="edu-card" style="background: white; margin-bottom: 1.5rem;">
          <div style="margin-bottom: 1rem;">
            <h4 style="color: #0f766e; margin: 0;">Foto Penjemput / Orang Tua</h4>
            <p style="font-size: 0.82rem; color: #64748b; margin-top: 0.2rem;">Foto ini akan tampil sebagai identitas pembanding setelah kartu NFC terverifikasi.</p>
          </div>
          <div class="profile-photo-grid">
            ${pickupPersons.map(person => `
              <div class="profile-photo-item">
                <img src="${h(person.photo_url)}" alt="Foto ${h(person.name)}" />
                <div class="profile-photo-copy">
                  <strong>${h(person.name)}</strong>
                  <span>${h(person.relationship)}</span>
                </div>
                <button class="btn btn-secondary profile-photo-button" onclick="window.selectProfilePhoto('pickup_person', '${person.id}')">Unggah Foto</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Table of Existing Active Cards -->
        <div class="edu-card" style="background: white;">
          <h4 style="color: #0f766e; margin-bottom: 1rem;">🎴 Daftar Kartu NFC Terikat Aktif</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${cards.map(c => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1.5px solid ${c.status === 'ACTIVE' ? '#e2e8f0' : '#fca5a5'}; border-radius: 12px; background: ${c.status === 'ACTIVE' ? '#ffffff' : '#fef2f2'};">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <code style="background: #e6f4f1; border: 1px solid #2dd4bf; padding: 2px 8px; border-radius: 6px; font-weight: bold; color: #0f766e;">${h(c.uid)}</code>
                    <span class="badge ${c.status === 'ACTIVE' ? 'badge-verified' : 'badge-blocked'}">${h(c.status)}</span>
                  </div>
                  <div style="font-size: 0.9rem; font-weight: bold;">Penjemput: ${h(c.holder)}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">Siswa: <strong>${h(c.student)}</strong></div>
                </div>
                <button class="btn btn-danger" onclick="window.toggleCardStatus('${c.uid}', '${c.status === 'ACTIVE' ? 'LOST' : 'ACTIVE'}')" style="font-size: 0.8rem;">
                  ${c.status === 'ACTIVE' ? '🚫 Laporkan Hilang' : '✅ Aktifkan Lagi'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- SUB-TAB 2: DATA SISWA & ORANG TUA -->
      ${subTab === 'students' ? `
        <div class="edu-card" style="background: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">👶</span>
              <h4 style="color: #0f766e; margin: 0; font-size: 1.2rem;">Manajemen Data Siswa PAUD/TK</h4>
            </div>
            <button class="btn btn-primary" onclick="window.openAddStudentForm()" style="font-size: 0.85rem;">
              ➕ Tambah Siswa Baru
            </button>
          </div>

          <!-- Add Student Form Inline -->
          ${state.showAddStudent ? `
            <div style="background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem;">
              <h5 style="color: #0f766e; margin-bottom: 0.75rem;">Form Pendaftaran Murid Baru:</h5>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                <input type="text" id="new_std_name" placeholder="Nama Lengkap Anak" style="padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
                <input type="text" id="new_std_class" placeholder="Kelas (contoh: TK-A1)" style="padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
                <input type="text" id="new_std_parent" placeholder="Nama Orang Tua / Wali" style="padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
              </div>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="window.closeAddStudentForm()" style="font-size: 0.8rem;">Batal</button>
                <button class="btn btn-primary" onclick="window.submitNewStudent()" style="font-size: 0.8rem;">💾 Simpan Data Siswa</button>
              </div>
            </div>
          ` : ''}

          <!-- Student List Table -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                  <th style="padding: 0.75rem 1rem;">FOTO</th>
                  <th style="padding: 0.75rem 1rem;">NAMA MURID</th>
                  <th style="padding: 0.75rem 1rem;">KELAS</th>
                  <th style="padding: 0.75rem 1rem;">ORANG TUA / WALI</th>
                  <th style="padding: 0.75rem 1rem;">NO. WHATSAPP NOTIFIKASI</th>
                  <th style="padding: 0.75rem 1rem;">STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(s => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.75rem 1rem;">
                      <div class="student-photo-control">
                        <img src="${h(s.photo_url)}" alt="Foto ${h(s.name)}" />
                        <button class="btn btn-secondary profile-photo-button" onclick="window.selectProfilePhoto('student', '${s.id}')">Unggah Foto</button>
                      </div>
                    </td>
                    <td style="padding: 0.75rem 1rem; font-weight: bold; color: #0f172a;">${h(s.name)}</td>
                    <td style="padding: 0.75rem 1rem;"><span class="badge badge-sky">${h(s.class_name)}</span></td>
                    <td style="padding: 0.75rem 1rem;">${h(s.parent_name)}</td>
                    <td style="padding: 0.75rem 1rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span style="font-family: monospace; font-weight: bold; color: #0f766e;">${h(s.phone)}</span>
                        <button class="btn btn-secondary profile-photo-button" onclick="window.editParentWhatsapp('${s.id}')">Edit Nomor</button>
                      </div>
                    </td>
                    <td style="padding: 0.75rem 1rem;"><span class="badge badge-verified">Aktif</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- SUB-TAB 3: DATA GURU PIKET & YAYASAN -->
      ${subTab === 'staff' ? `
        <div class="edu-card" style="background: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">👨‍🏫</span>
              <h4 style="color: #0f766e; margin: 0; font-size: 1.2rem;">Data Guru Piket, Admin & Pengurus Yayasan</h4>
            </div>
            <span class="badge badge-amber">Petugas Gerbang & Verifikator</span>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                  <th style="padding: 0.75rem 1rem;">NAMA PETUGAS</th>
                  <th style="padding: 0.75rem 1rem;">JABATAN / PERAN</th>
                  <th style="padding: 0.75rem 1rem;">KONTAK</th>
                  <th style="padding: 0.75rem 1rem;">HAK AKSES APPS</th>
                </tr>
              </thead>
              <tbody>
                ${staff.map(st => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.75rem 1rem; font-weight: bold; color: #0f172a;">${st.name}</td>
                    <td style="padding: 0.75rem 1rem;">${st.role}</td>
                    <td style="padding: 0.75rem 1rem; font-family: monospace;">${st.phone}</td>
                    <td style="padding: 0.75rem 1rem;"><span class="badge badge-verified">Aktif</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}
