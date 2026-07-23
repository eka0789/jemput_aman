export function renderScheduleConfigPage() {
  const days = [
    { key: 'MON', label: 'Senin', defaultPerson: 'Budi Santoso (Ayah Kandung)' },
    { key: 'TUE', label: 'Selasa', defaultPerson: 'Budi Santoso (Ayah Kandung)' },
    { key: 'WED', label: 'Rabu', defaultPerson: 'Budi Santoso (Ayah Kandung)' },
    { key: 'THU', label: 'Kamis', defaultPerson: 'Pak Joko (Supir Keluarga)' },
    { key: 'FRI', label: 'Jumat', defaultPerson: 'Pak Joko (Supir Keluarga)' }
  ];

  return `
    <div class="container">
      <div class="glass-card panel" style="max-width: 860px; margin: 0 auto;">
        <div class="section-header">
          <div>
            <h3 class="section-title">📅 Jadwal Penjemputan Mingguan</h3>
            <p class="section-subtitle">Tetapkan siapa saja penjemput yang boleh menjemput anak setiap hari.</p>
          </div>
        </div>

        <div style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
          <label style="font-weight: 700; color: var(--gray-700);">Pilih Siswa</label>
          <select class="select-field">
            <option value="1111">Ananda Bintang (TK-A1)</option>
            <option value="1112">Siti Rahma (TK-B2)</option>
          </select>
        </div>

        <div style="display: grid; gap: 1rem;">
          ${days.map(day => `
            <div style="display: grid; gap: 0.75rem; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 18px; background: var(--surface);
              grid-template-columns: 130px 1fr; align-items: center;">
              <div style="font-weight: 700; color: var(--primary-900);">${day.label}</div>
              <select class="select-field">
                <option ${day.defaultPerson.includes('Budi') ? 'selected' : ''}>Budi Santoso (Ayah Kandung)</option>
                <option ${day.defaultPerson.includes('Joko') ? 'selected' : ''}>Pak Joko (Supir Keluarga)</option>
              </select>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary" onclick="alert('Jadwal penjemputan mingguan berhasil disimpan!')" style="width: 100%; margin-top: 1rem;">
          💾 Simpan Jadwal
        </button>
      </div>
    </div>
  `;
}
