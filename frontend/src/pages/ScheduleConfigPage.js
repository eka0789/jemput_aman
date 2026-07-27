import { escapeHtml as h } from '../utils/html.js';

export function renderScheduleConfigPage(state) {
  const days = [
    { key: 'MON', label: 'Senin' },
    { key: 'TUE', label: 'Selasa' },
    { key: 'WED', label: 'Rabu' },
    { key: 'THU', label: 'Kamis' },
    { key: 'FRI', label: 'Jumat' },
    { key: 'SAT', label: 'Sabtu' }
  ];
  const students = state.students || [];
  const people = state.pickupPersons || [];
  const schedules = state.weeklySchedules || [];

  return `
    <div class="container">
      <div class="edu-card" style="max-width: 860px; margin: 0 auto; background: white;">
        <div style="margin-bottom: 1.5rem;">
          <h3 class="text-heading">📅 Jadwal Penjemputan Mingguan</h3>
          <p style="color: #64748b;">Hanya penjemput aktif yang telah terotorisasi untuk siswa yang dapat disimpan.</p>
        </div>

        <div style="display: grid; gap: 0.5rem; margin-bottom: 1.5rem;">
          <label for="schedule-student" style="font-weight: 700;">Pilih Siswa</label>
          <select id="schedule-student" onchange="window.changeScheduleStudent(this.value)" style="padding: 0.75rem; border-radius: 10px; border: 1px solid #cbd5e1;">
            ${students.map(student => `
              <option value="${h(student.id)}" ${student.id === state.scheduleStudentId ? 'selected' : ''}>
                ${h(student.name)} (${h(student.class_name)})
              </option>
            `).join('')}
          </select>
        </div>

        <div style="display: grid; gap: 1rem;">
          ${days.map(day => {
            const selected = schedules.find(item => item.day_of_week === day.key)?.pickup_person_id || '';
            return `
              <div style="display: grid; grid-template-columns: 130px 1fr; gap: 0.75rem; align-items: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 14px;">
                <strong>${day.label}</strong>
                <select data-schedule-day="${day.key}" style="padding: 0.7rem; border-radius: 10px; border: 1px solid #cbd5e1;">
                  <option value="">Tidak ada jadwal</option>
                  ${people.map(person => `
                    <option value="${h(person.id)}" ${person.id === selected ? 'selected' : ''}>
                      ${h(person.name)} (${h(person.relationship)})
                    </option>
                  `).join('')}
                </select>
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn btn-primary" onclick="window.saveWeeklySchedule()" style="width: 100%; margin-top: 1.25rem;">
          Simpan Jadwal
        </button>
      </div>
    </div>
  `;
}
