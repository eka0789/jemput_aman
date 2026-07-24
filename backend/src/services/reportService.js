import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { pickupLogModel } from '../models/pickupLog.js';

export const reportService = {
  generateExcelReport: async (schoolId) => {
    const logs = await pickupLogModel.findBySchool(schoolId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Kepulangan');

    worksheet.columns = [
      { header: 'ID Log', key: 'id', width: 15 },
      { header: 'Waktu Presisi', key: 'timestamp', width: 22 },
      { header: 'Nama Siswa', key: 'student_name', width: 20 },
      { header: 'Penjemput', key: 'pickup_person_name', width: 25 },
      { header: 'Metode', key: 'verification_method', width: 15 },
      { header: 'Status Verifikasi', key: 'status', width: 15 },
      { header: 'Catatan', key: 'notes', width: 30 }
    ];

    logs.forEach(log => {
      worksheet.addRow({
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString('id-ID'),
        student_name: log.student_name,
        pickup_person_name: log.pickup_person_name,
        verification_method: log.verification_method,
        status: log.status,
        notes: log.notes
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  generatePdfReport: async (schoolId) => {
    const logs = await pickupLogModel.findBySchool(schoolId);
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        doc.fontSize(18).text('JemputAman — Laporan Rekapitulasi Penjemputan', { align: 'center' });
        doc.fontSize(10).text(`Sekolah ID: ${schoolId} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
        doc.moveDown(1.5);

        logs.forEach((log, index) => {
          doc.fontSize(11).fillColor('#0f766e').text(`${index + 1}. ${log.student_name} — Status: ${log.status}`);
          doc.fontSize(9).fillColor('#334155').text(`   Penjemput: ${log.pickup_person_name} | Waktu: ${new Date(log.timestamp).toLocaleString('id-ID')} | Metode: ${log.verification_method}`);
          doc.text(`   Catatan: ${log.notes}`);
          doc.moveDown(0.5);
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};
