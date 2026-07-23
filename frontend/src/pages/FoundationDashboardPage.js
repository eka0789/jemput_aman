export function renderFoundationDashboardPage() {
  const branches = [
    { name: 'PAUD/TK Ceria Salatiga', city: 'Salatiga', students: 120, verifiedToday: 48, status: 'Aktif' },
    { name: 'TK Harapan Bangsa Semarang', city: 'Semarang', students: 210, verifiedToday: 95, status: 'Aktif' },
    { name: 'PAUD Bintang Solo', city: 'Solo', students: 85, verifiedToday: 32, status: 'Aktif' }
  ];

  return `
    <div class="container">
      <div class="edu-card" style="background: white; margin-bottom: 1.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">🏢</span>
              <h2 class="text-heading" style="margin: 0; font-size: 1.35rem;">Dashboard Konsolidasi Yayasan Multi-Sekolah</h2>
            </div>
            <p style="font-size: 0.88rem; color: #64748b; margin-top: 0.15rem;">
              Monitoring Keamanan Penjemputan Anak di Seluruh Cabang PAUD & TK
            </p>
          </div>
          <span class="badge badge-amber" style="font-size: 0.85rem; padding: 0.5rem 1rem;">TIER: PREMIUM MULTI-SCHOOL</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
        ${branches.map(b => `
          <div class="edu-card" style="background: white; border-top: 5px solid #0f766e;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="color: #0f766e; margin: 0; font-size: 1.15rem;">${b.name}</h4>
              <span class="badge badge-verified" style="font-size: 0.7rem;">${b.status}</span>
            </div>
            <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">📍 Kota ${b.city}</div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 0.85rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem;">
                <span style="color: #475569;">Total Murid:</span>
                <strong>${b.students} Siswa</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-top: 1px solid #e2e8f0; padding-top: 0.4rem;">
                <span style="color: #475569;">Kepulangan Hari Ini:</span>
                <strong style="color: #10b981;">${b.verifiedToday} Terverifikasi</strong>
              </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; font-size: 0.85rem;" onclick="alert('Membuka detail cabang ${b.name}')">
              Lihat Detail Cabang
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
