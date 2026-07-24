import { reportService } from '../services/reportService.js';
import { pickupLogModel } from '../models/pickupLog.js';

export const getPickupLogs = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const logs = await pickupLogModel.findBySchool(schoolId);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

export const exportExcelReport = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const buffer = await reportService.generateExcelReport(schoolId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Kepulangan_${schoolId}.xlsx`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export const exportPdfReport = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const buffer = await reportService.generatePdfReport(schoolId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Kepulangan_${schoolId}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
