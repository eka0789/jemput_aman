export function renderGateReaderPage(state) {
  const isVerified = state.lastVerification?.status === 'VERIFIED';
  const isBlocked = state.lastVerification?.status === 'BLOCKED';
  const whatsappStatus = state.lastVerification?.data?.notification_status?.whatsapp;
  const pushStatus = state.lastVerification?.data?.notification_status?.push;

  return `
    <div class="container">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; align-items: start;">
        
        <!-- Left Column: NFC Reader & Tap Simulator -->
        <div class="edu-card nfc-scanner-card" style="background: white;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">📡</span>
              <h3 class="text-heading" style="margin: 0; font-size: 1.25rem;">Reader Gerbang Kepulangan</h3>
            </div>
            <span class="badge badge-verified">
              <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
              NFC READY
            </span>
          </div>

          <!-- NFC Sensor Hero Box -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #0f766e 100%); border-radius: 20px; padding: 2.25rem 1.5rem; text-align: center; color: white; margin-bottom: 1.5rem; border: 2px solid #2dd4bf; box-shadow: inset 0 2px 10px rgba(0,0,0,0.4);">
            <div style="font-size: 4rem; margin-bottom: 0.75rem;" class="animate-float">🎴</div>
            <h3 style="margin-bottom: 0.5rem; color: #5eead4; font-size: 1.35rem;">Tempelkan Kartu NFC Penjemput</h3>
            <p style="font-size: 0.88rem; color: #cbd5e1; max-width: 320px; margin: 0 auto 1.25rem auto;">
              Dekatkan kartu NFC fisik ke area sensor tablet/smartphone atau uji pengetapan dengan simulator di bawah
            </p>
            <div style="display: inline-block; background: rgba(255,255,255,0.12); padding: 0.4rem 1rem; border-radius: 9999px; font-size: 0.78rem; color: #99f6e4;">
              Web NFC Engine v1.0 • Latensi &lt; 2s
            </div>
          </div>

          <!-- Simulator Quick Tap Buttons -->
          <div style="border-top: 2px dashed #e2e8f0; padding-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.85rem; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.03em;">
                ⚡ Simulator Tap Kartu NFC:
              </span>
              <span class="badge badge-sky" style="font-size: 0.7rem;">Mode Demo</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              <button class="btn btn-primary" onclick="window.simulateNfcTap('04:A2:8B:12:FE:67:80')" style="justify-content: space-between; padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.2rem;">👨‍👦</span>
                  <div style="text-align: left;">
                    <div style="font-size: 0.9rem; font-weight: bold;">Tap Kartu Ayah (Budi Santoso)</div>
                    <div style="font-size: 0.75rem; opacity: 0.85;">Penjemput Sah • Siswa: Ananda Bintang</div>
                  </div>
                </div>
                <code style="font-size: 0.75rem; background: rgba(0,0,0,0.25); padding: 3px 8px; border-radius: 6px; color: #99f6e4;">04:A2:...</code>
              </button>

              <button class="btn btn-primary" onclick="window.simulateNfcTap('04:B3:9C:23:FF:78:91')" style="justify-content: space-between; padding: 0.85rem 1.25rem; background: linear-gradient(135deg, #0d9488, #0f766e);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.2rem;">🚗</span>
                  <div style="text-align: left;">
                    <div style="font-size: 0.9rem; font-weight: bold;">Tap Kartu Supir (Pak Joko)</div>
                    <div style="font-size: 0.75rem; opacity: 0.85;">Penjemput Sah • Siswa: Ananda Bintang</div>
                  </div>
                </div>
                <code style="font-size: 0.75rem; background: rgba(0,0,0,0.25); padding: 3px 8px; border-radius: 6px; color: #99f6e4;">04:B3:...</code>
              </button>

              <button class="btn btn-danger" onclick="window.simulateNfcTap('99:99:99:99:99:99:99')" style="justify-content: space-between; padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.2rem;">⚠️</span>
                  <div style="text-align: left;">
                    <div style="font-size: 0.9rem; font-weight: bold;">Tap Kartu Hilang / Asing</div>
                    <div style="font-size: 0.75rem; opacity: 0.85;">Kartu Tak Terdaftar • Simulasi Uji Keamanan</div>
                  </div>
                </div>
                <code style="font-size: 0.75rem; background: rgba(0,0,0,0.25); padding: 3px 8px; border-radius: 6px; color: #fecaca;">99:99:...</code>
              </button>
            </div>

            <!-- Emergency OTP Trigger Box -->
            <div style="margin-top: 1.25rem; background: #fffbeb; border: 2px dashed #f59e0b; border-radius: var(--radius-md); padding: 1rem; text-align: center;">
              <div style="font-size: 0.85rem; font-weight: bold; color: #92400e; margin-bottom: 0.5rem;">
                🆘 Lupa Bawa Kartu NFC?
              </div>
              <button class="btn btn-amber" onclick="window.openEmergencyModal()" style="width: 100%; font-size: 0.88rem;">
                Gunakan Mode Darurat OTP (Approval Orang Tua)
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Verification Result Display -->
        <div>
          ${state.lastVerification ? `
            <div class="edu-card" style="border-left: 8px solid ${isVerified ? '#10b981' : '#ef4444'}; animation: float-subtle 0.3s ease-out; background: white;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
                <span class="badge ${isVerified ? 'badge-verified' : 'badge-blocked'}" style="font-size: 1.05rem; padding: 0.5rem 1.2rem;">
                  ${isVerified ? '✅ TERVERIFIKASI SAH' : '🚫 DITOLAK / BLOKIR'}
                </span>
                <span style="font-size: 0.85rem; font-weight: bold; color: #64748b;">
                  ${new Date().toLocaleTimeString('id-ID')} WIB
                </span>
              </div>

              ${isVerified ? `
                <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px solid #a7f3d0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem;">✨</span>
                    <h4 style="color: #065f46; margin: 0; font-size: 1.15rem;">${state.lastVerification.message}</h4>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center;">
                    <!-- Student Profile Box -->
                    <div style="text-align: center; background: white; padding: 1rem; border-radius: 14px; border: 1px solid #a7f3d0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);">
                      <img src="${state.lastVerification.data.student.photo_url}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 4px solid #10b981; margin-bottom: 0.5rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                      <div style="font-weight: 800; font-size: 1.05rem; color: #064e3b;">${state.lastVerification.data.student.full_name}</div>
                      <span class="badge badge-sky" style="font-size: 0.75rem; margin-top: 0.25rem;">${state.lastVerification.data.student.class_name}</span>
                    </div>

                    <!-- Pickup Person Profile Box -->
                    <div style="text-align: center; background: white; padding: 1rem; border-radius: 14px; border: 1px solid #99f6e4; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.1);">
                      <img src="${state.lastVerification.data.pickup_person.photo_url}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 4px solid #0f766e; margin-bottom: 0.5rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                      <div style="font-weight: 800; font-size: 1.05rem; color: #0f766e;">${state.lastVerification.data.pickup_person.full_name}</div>
                      <span class="badge badge-amber" style="font-size: 0.75rem; margin-top: 0.25rem;">${state.lastVerification.data.pickup_person.relationship}</span>
                    </div>
                  </div>

                  <div class="notification-status-panel ${whatsappStatus?.status === 'ACCEPTED' ? 'is-success' : 'is-warning'}">
                    <strong>
                      ${whatsappStatus?.status === 'ACCEPTED'
                        ? 'WhatsApp diterima oleh gateway'
                        : whatsappStatus?.status === 'FAILED'
                          ? 'WhatsApp gagal dikirim'
                          : 'WhatsApp belum dikirim'}
                    </strong>
                    <span>${whatsappStatus?.message || 'Mode simulasi atau gateway WhatsApp belum dikonfigurasi.'}</span>
                    ${pushStatus?.status === 'NOT_CONFIGURED' ? '<span>Push notification belum dikonfigurasi.</span>' : ''}
                  </div>

                  ${state.lastVerification?.data?.verification_photo ? `
                    <div style="margin-top: 1rem; padding: 0.9rem; border-radius: 14px; background: #f8fafc; border: 1px solid #99f6e4; text-align: center;">
                      <div style="font-size: 0.8rem; font-weight: 800; color: #0f766e; margin-bottom: 0.45rem; text-transform: uppercase; letter-spacing: 0.04em;">📸 Foto Verifikasi Wajah</div>
                      <img src="${state.lastVerification.data.verification_photo}" style="width: 100%; max-width: 220px; border-radius: 14px; object-fit: cover; border: 2px solid #14b8a6;" />
                      <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.45rem;">Foto baru tersimpan sebagai bukti verifikasi penjemputan</div>
                    </div>
                  ` : ''}
                  ${state.cameraError ? `
                    <div class="camera-error-panel" role="alert">
                      <div>
                        <strong>Foto verifikasi belum tersimpan</strong>
                        <p>${state.cameraError}</p>
                      </div>
                      <button class="btn btn-secondary" onclick="window.retryVerificationPhoto()">Coba Kamera Lagi</button>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="background: linear-gradient(135deg, #fef2f2, #fff1f1); border: 2px solid #fca5a5; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">🚨</span>
                    <h4 style="color: #991b1b; margin: 0; font-size: 1.15rem;">${state.lastVerification.message}</h4>
                  </div>
                  <p style="font-size: 0.9rem; color: #7f1d1d; line-height: 1.5;">
                    Peringatan keamanan telah dicatat otomatis ke sistem audit sekolah. Petugas piket wajib menahan siswa dan mengonfirmasi ulang identitas penjemput sebelum mengizinkan keluar area gerbang!
                  </p>
                </div>
              `}
            </div>
          ` : `
            <div class="edu-card" style="text-align: center; padding: 4rem 2rem; background: white;">
              <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.6;" class="animate-float">📋</div>
              <h3 style="color: #0f766e; margin-bottom: 0.5rem;">Belum Ada Pengetapan Kartu</h3>
              <p style="font-size: 0.92rem; color: #64748b; max-width: 320px; margin: 0 auto;">
                Tempelkan kartu NFC fisik di sebelah kiri atau klik tombol simulator untuk memulai verifikasi penjemputan anak.
              </p>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
