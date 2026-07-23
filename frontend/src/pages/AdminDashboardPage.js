export function renderAdminDashboardPage(state) {
  const logs = state.pickupLogs || [];
  const totalVerified = logs.filter(l => l.status === 'VERIFIED').length;
  const totalBlocked = logs.filter(l => l.status === 'BLOCKED').length;

  return `
    <div class="container">
      
      <!-- Metrics Overview Header -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.75rem;">
        
        <div class="edu-card" style="background: white; border-top: 5px solid #0f766e;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Total Kepulangan</span>
            <span style="font-size: 1.5rem;">📋</span>
          </div>
          <div style="font-family: 'Fredoka', sans-serif; font-size: 2.2rem; font-weight: bold; color: #0f766e; margin-top: 0.35rem;">
            ${logs.length}
          </div>
          <div style="font-size: 0.75rem; color: #10b981; margin-top: 0.25rem; font-weight: bold;">● Real-Time Update</div>
        </div>

        <div class="edu-card" style="background: white; border-top: 5px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Terverifikasi Sah</span>
            <span style="font-size: 1.5rem;">✅</span>
          </div>
          <div style="font-family: 'Fredoka', sans-serif; font-size: 2.2rem; font-weight: bold; color: #10b981; margin-top: 0.35rem;">
            ${totalVerified}
          </div>
          <div style="font-size: 0.75rem; color: #059669; margin-top: 0.25rem; font-weight: bold;">100% Tingkat Keamanan</div>
        </div>

        <div class="edu-card" style="background: white; border-top: 5px solid #ef4444;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Ditolak / Blokir</span>
            <span style="font-size: 1.5rem;">🚫</span>
          </div>
          <div style="font-family: 'Fredoka', sans-serif; font-size: 2.2rem; font-weight: bold; color: #ef4444; margin-top: 0.35rem;">
            ${totalBlocked}
          </div>
          <div style="font-size: 0.75rem; color: #dc2626; margin-top: 0.25rem; font-weight: bold;">Alert Dikirim ke Admin</div>
        </div>

        <div class="edu-card" style="background: white; border-top: 5px solid #f59e0b;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Kartu NFC Aktif</span>
            <span style="font-size: 1.5rem;">🎴</span>
          </div>
          <div style="font-family: 'Fredoka', sans-serif; font-size: 2.2rem; font-weight: bold; color: #d97706; margin-top: 0.35rem;">
            2 Kartu
          </div>
          <div style="font-size: 0.75rem; color: #b45309; margin-top: 0.25rem; font-weight: bold;">1 Kartu Dilaporkan Hilang</div>
        </div>

      </div>

      <!-- Action Toolbar & Audit Logs Table -->
      <div class="edu-card" style="background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">📊</span>
              <h3 class="text-heading" style="margin: 0; font-size: 1.3rem;">Laporan Kepulangan & Audit Trail</h3>
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.15rem;">Sekolah: PAUD/TK Ceria Salatiga • Format Siap Cetak Dinas/Yayasan</p>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-primary" onclick="window.exportExcelReport()" style="font-size: 0.88rem;">
              📥 Ekspor Excel (.xlsx)
            </button>
            <button class="btn btn-amber" onclick="window.exportPdfReport()" style="font-size: 0.88rem;">
              📄 Ekspor PDF (.pdf)
            </button>
          </div>
        </div>

        <!-- Log Table -->
        <div style="overflow-x: auto; border: 1.5px solid #e2e8f0; border-radius: 14px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #334155; font-weight: bold;">
                <th style="padding: 0.85rem 1.15rem;">WAKTU</th>
                <th style="padding: 0.85rem 1.15rem;">NAMA SISWA</th>
                <th style="padding: 0.85rem 1.15rem;">PENJEMPUT</th>
                <th style="padding: 0.85rem 1.15rem;">METODE VERIFIKASI</th>
                <th style="padding: 0.85rem 1.15rem;">STATUS</th>
                <th style="padding: 0.85rem 1.15rem;">CATATAN AUDIT</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f0fdfa'" onmouseout="this.style.background='white'">
                  <td style="padding: 0.85rem 1.15rem; font-weight: 800; color: #0f766e;">
                    ${new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                  </td>
                  <td style="padding: 0.85rem 1.15rem; font-weight: bold; color: #0f172a;">${log.student_name}</td>
                  <td style="padding: 0.85rem 1.15rem;">${log.pickup_person_name}</td>
                  <td style="padding: 0.85rem 1.15rem;">
                    <span class="badge badge-sky" style="font-size: 0.75rem;">${log.verification_method}</span>
                  </td>
                  <td style="padding: 0.85rem 1.15rem;">
                    <span class="badge ${log.status === 'VERIFIED' ? 'badge-verified' : 'badge-blocked'}">${log.status}</span>
                  </td>
                  <td style="padding: 0.85rem 1.15rem; color: #64748b; font-size: 0.82rem;">${log.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
