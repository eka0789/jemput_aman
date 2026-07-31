import { reportService } from '../services/reportService.js';
import { pickupLogModel } from '../models/pickupLog.js';
import { storageService } from '../services/storageService.js';
import { reportExportModel } from '../models/reportExport.js';
import { auditRetentionService } from '../services/auditRetentionService.js';

export const getPickupLogs = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    // UI is intentionally bounded; full retained history remains available via export.
    const logs = await pickupLogModel.findBySchool(schoolId, { limit: 500 });
    const safeLogs = await Promise.all(logs.map(async log => ({
      ...log,
      verification_photo: log.verification_photo
        ? await storageService.getSignedUrl(log.verification_photo)
        : null
    })));
    res.json({ success: true, data: safeLogs });
  } catch (err) {
    next(err);
  }
};

export const getReportRetentionStatus = async (req, res, next) => {
  try {
    const data = await auditRetentionService.getStatus({ schoolId: req.schoolId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const exportExcelReport = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const buffer = await reportService.generateExcelReport(schoolId);
    await reportExportModel.create({
      schoolId,
      format: 'excel',
      exportedBy: req.user?.id
    });
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
    await reportExportModel.create({
      schoolId,
      format: 'pdf',
      exportedBy: req.user?.id
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Kepulangan_${schoolId}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
