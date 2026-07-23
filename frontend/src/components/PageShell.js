export function renderPageShell(activeTab, isKioskLocked) {
  return `
    <header class="edu-card-header" style="margin-bottom: 2rem; padding: 1.25rem 2rem;">
      <div class="container" style="padding: 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem;">
        
        <!-- Brand Title & Mascot Icon -->
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #14b8a6, #f59e0b); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);" class="animate-float">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h1 class="text-gradient-light" style="margin: 0; font-size: 1.7rem; font-family: 'Fredoka', sans-serif;">JemputAman</h1>
              <span class="badge ${isKioskLocked ? 'badge-amber' : 'badge-verified'}" style="font-size: 0.7rem; padding: 0.15rem 0.6rem;">
                ${isKioskLocked ? '🔒 MODE KIOSK GERBANG (TERKUNCI)' : '🔓 MODE AKSES PENUH'}
              </span>
            </div>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">Sistem Verifikasi Penjemputan Anak PAUD/TK</p>
          </div>
        </div>

        <!-- Kiosk Lock Controls & School Context -->
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: rgba(255,255,255,0.08); padding: 0.4rem 1rem; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1rem;">🏫</span>
            <span style="font-size: 0.8rem; font-weight: bold; color: #ffffff;">PAUD/TK Ceria Salatiga</span>
          </div>

          ${isKioskLocked ? `
            <button class="btn btn-amber" onclick="window.promptUnlockKiosk()" style="font-size: 0.82rem; padding: 0.45rem 0.9rem;">
              🔑 Buka Kunci Admin (PIN)
            </button>
          ` : `
            <button class="btn btn-primary" onclick="window.lockKioskMode()" style="font-size: 0.82rem; padding: 0.45rem 0.9rem; background: linear-gradient(135deg, #d97706, #b45309);">
              🔒 Kunci Mode Gerbang (Kiosk)
            </button>
          `}
        </div>

      </div>

      <!-- Segmented Navigation Pills (Only shown if NOT Kiosk Locked, or Reader Tab active) -->
      <div class="container" style="padding: 1rem 0 0 0; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <nav style="display: flex; gap: 0.5rem; background: rgba(15, 23, 42, 0.4); padding: 0.4rem; border-radius: 9999px; overflow-x: auto;">
          <button class="btn ${activeTab === 'reader' ? 'btn-primary' : 'btn-secondary'}" data-tab="reader" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">
            📱 Reader Gerbang (Piket)
          </button>
          
          ${!isKioskLocked ? `
            <button class="btn ${activeTab === 'parent' ? 'btn-primary' : 'btn-secondary'}" data-tab="parent" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">
              👨‍👩‍👧 Portal Orang Tua
            </button>
            <button class="btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}" data-tab="admin" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">
              📊 Dashboard Admin
            </button>
            <button class="btn ${activeTab === 'foundation' ? 'btn-primary' : 'btn-secondary'}" data-tab="foundation" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">
              🏢 Multi-Sekolah (Yayasan)
            </button>
            <button class="btn ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}" data-tab="data" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">
              ⚙️ Kelola Kartu & Siswa
            </button>
          ` : `
            <span style="font-size: 0.8rem; color: #f59e0b; padding: 0.6rem 1rem; font-weight: bold; display: flex; align-items: center; gap: 0.35rem;">
              🔒 Menu Sensitif Dikunci (Mode Tablet Gerbang Khusus Tap NFC)
            </span>
          `}
        </nav>
      </div>
    </header>
  `;
}
