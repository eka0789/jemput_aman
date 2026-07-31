import { escapeHtml as h } from '../utils/html.js';

export function renderParentPortalPage(state) {
  const pendingOtps = state.pendingOtps || [];
  const logs = state.pickupLogs || [];
  const students = state.students || [];

  return `
    <div class="container">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.75rem; align-items: start;">
        
        <!-- Left: Student Cards & OTP Approval Request -->
        <div>
          <!-- My Children Profile -->
          <div class="edu-card" style="background: white; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
              <h3 class="text-heading" style="margin: 0; font-size: 1.2rem;">👨‍👩‍👧 Profile Anak Saya</h3>
              <span class="badge badge-sky" style="font-size: 0.75rem;">${students.length} Murid Terdaftar</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${students.length ? students.map(student => `
                <div style="background: linear-gradient(135deg, #f0fdfa, #e6f4f1); border: 1.5px solid #99f6e4; border-radius: 16px; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                  <img src="${h(student.photo_url || '/avatar-placeholder.svg')}" alt="Foto ${h(student.name)}" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 3px solid #14b8a6; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: #064e3b;">${h(student.name)}</h4>
                    <span class="badge badge-verified" style="font-size: 0.75rem; margin-top: 0.25rem;">${h(student.class_name)}</span>
                  </div>
                </div>
              `).join('') : '<p style="color: #64748b;">Belum ada siswa yang terhubung dengan akun ini.</p>'}
            </div>
          </div>

          <!-- Pending Emergency OTP Box -->
          ${pendingOtps.length > 0 ? `
            <div class="edu-card" style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #f59e0b; animation: nfc-wave-ring 2s infinite;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">🆘</span>
                <h3 style="color: #b45309; margin: 0; font-size: 1.15rem;">Permintaan Approval OTP Darurat</h3>
              </div>
              <p style="font-size: 0.88rem; color: #78350f; margin-bottom: 1.25rem;">
                Guru piket di gerbang sekolah mengajukan izin penjemputan tanpa kartu NFC untuk anak Anda.
              </p>

              ${pendingOtps.map(otp => `
                <div style="background: white; border-radius: 14px; padding: 1.25rem; margin-bottom: 0.75rem; border: 1px solid #fcd34d; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);">
                  <div style="font-weight: 800; font-size: 1rem; color: #0f766e;">Siswa: ${h(otp.student_name)}</div>
                  <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.15rem;">Penjemput: ${h(otp.pickup_person_name)}</div>
                  
                  <div style="font-family: 'Fredoka', sans-serif; font-size: 1.8rem; font-weight: bold; color: #d97706; letter-spacing: 6px; margin: 0.85rem 0; text-align: center; background: #fffbeb; padding: 0.5rem; border-radius: 10px; border: 1.5px dashed #f59e0b;">
                    KODE DIKIRIM
                  </div>

                  <button class="btn btn-amber" onclick="window.approveOtp('${otp.id}')" style="width: 100%; font-size: 0.9rem;">
                    ✅ Setujui Penjemputan Sekarang
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="edu-card" style="background: white;">
              <h4 style="color: #64748b; font-size: 0.92rem; margin-bottom: 0.35rem;">Status Approval Darurat:</h4>
              <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
                Tidak ada permintaan approval OTP darurat aktif saat ini.
              </p>
            </div>
          `}
        </div>

        <!-- Right: Live Pickup Activity Feed -->
        <div class="edu-card" style="background: white;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">🔔</span>
              <h3 class="text-heading" style="margin: 0; font-size: 1.25rem;">Live Feed Kepulangan & Notifikasi</h3>
            </div>
            <span class="badge badge-verified">Real-Time Sync</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${logs.length > 0 ? logs.map(log => `
              <div style="border: 1.5px solid ${log.status === 'VERIFIED' ? '#a7f3d0' : '#fca5a5'}; border-radius: 16px; padding: 1.15rem; display: flex; justify-content: space-between; align-items: center; background: ${log.status === 'VERIFIED' ? 'linear-gradient(135deg, #f0fdf4, #ffffff)' : 'linear-gradient(135deg, #fef2f2, #ffffff)'};">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                    <span style="font-size: 1.2rem;">${log.status === 'VERIFIED' ? '🛡️' : '🚨'}</span>
                    <strong style="font-size: 1.05rem; color: #0f172a;">${h(log.student_name)}</strong>
                    <span class="badge ${log.status === 'VERIFIED' ? 'badge-verified' : 'badge-blocked'}" style="font-size: 0.75rem;">${h(log.status)}</span>
                  </div>
                  <div style="font-size: 0.88rem; color: #475569;">
                    Dijemput oleh: <strong>${h(log.pickup_person_name)}</strong> (${h(log.verification_method)})
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.9rem; font-weight: 800; color: #0f766e;">
                    ${new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                  <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.15rem;">
                    ${new Date(log.timestamp).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            `).join('') : '<p style="color: #94a3b8;">Belum ada log kepulangan hari ini.</p>'}
          </div>
        </div>

      </div>
    </div>
  `;
}
