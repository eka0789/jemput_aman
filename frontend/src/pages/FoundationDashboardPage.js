import { escapeHtml as h } from '../utils/html.js';

export function renderFoundationDashboardPage(state) {
  const branches = state.foundationBranches || [];
  return `
    <div class="container">
      <div class="edu-card" style="background: white; margin-bottom: 1.75rem;">
        <h2 class="text-heading" style="margin: 0; font-size: 1.35rem;">Dashboard Konsolidasi Yayasan</h2>
        <p style="font-size: 0.88rem; color: #64748b; margin-top: 0.3rem;">Data realtime seluruh sekolah yang terdaftar di JemputAman.</p>
      </div>
      <div class="foundation-branch-grid">
        ${branches.length ? branches.map(branch => `
          <article class="edu-card" style="background: white; border-top: 5px solid #0f766e;">
            <div style="display: flex; justify-content: space-between; gap: 1rem;">
              <h4 style="color: #0f766e; margin: 0;">${h(branch.name)}</h4>
              <span class="badge ${branch.status === 'ACTIVE' ? 'badge-verified' : 'badge-blocked'}">${h(branch.status)}</span>
            </div>
            <p style="font-size: 0.85rem; color: #64748b;">Kota ${h(branch.city)}</p>
            <div style="background: #f8fafc; border-radius: 12px; padding: 0.85rem; display: grid; gap: 0.5rem;">
              <div style="display:flex; justify-content:space-between;"><span>Total murid aktif</span><strong>${Number(branch.students) || 0}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Terverifikasi hari ini</span><strong style="color:#059669;">${Number(branch.verified_today) || 0}</strong></div>
            </div>
          </article>
        `).join('') : '<div class="empty-data-panel">Belum ada data sekolah yang dapat ditampilkan.</div>'}
      </div>
    </div>`;
}
