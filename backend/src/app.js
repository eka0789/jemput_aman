import express from 'express';
import cors from 'cors';
import pickupRoutes from './routes/pickupRoutes.js';
import { getStudentSchedule, updateStudentSchedule } from './controllers/scheduleController.js';
import { requestEmergencyOtp, approveEmergencyOtp, getPendingOtps } from './controllers/otpController.js';
import { getPickupLogs, exportExcelReport, exportPdfReport } from './controllers/reportController.js';
import {
  getStudents,
  getPickupPersons,
  createStudent,
  updateCardStatus,
  bindNfcCard,
  updateStudentPhoto,
  updatePickupPersonPhoto
} from './controllers/managementController.js';
import { tenantMiddleware } from './middlewares/tenant.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API Status Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'JemputAman Multi-Tenant API Service',
    time: new Date().toISOString()
  });
});

// Pickup Verification Routes
app.use('/api/v1/pickup', pickupRoutes);

// Schedule Routes
app.get('/api/v1/schedules/:studentId', tenantMiddleware, getStudentSchedule);
app.put('/api/v1/schedules/:studentId', tenantMiddleware, updateStudentSchedule);

// Emergency OTP Routes
app.post('/api/v1/pickup/request-otp', tenantMiddleware, requestEmergencyOtp);
app.post('/api/v1/pickup/approve-otp', tenantMiddleware, approveEmergencyOtp);
app.get('/api/v1/pickup/pending-otps', tenantMiddleware, getPendingOtps);

// Report & Audit Routes
app.get('/api/v1/reports/logs', tenantMiddleware, getPickupLogs);
app.get('/api/v1/reports/export/excel', tenantMiddleware, exportExcelReport);
app.get('/api/v1/reports/export/pdf', tenantMiddleware, exportPdfReport);

// Data & Card Management Routes
app.get('/api/v1/students', tenantMiddleware, getStudents);
app.post('/api/v1/students', tenantMiddleware, createStudent);
app.patch('/api/v1/students/:studentId/photo', tenantMiddleware, updateStudentPhoto);
app.get('/api/v1/pickup-persons', tenantMiddleware, getPickupPersons);
app.patch('/api/v1/pickup-persons/:personId/photo', tenantMiddleware, updatePickupPersonPhoto);
app.post('/api/v1/nfc/cards/status', tenantMiddleware, updateCardStatus);
app.post('/api/v1/nfc/cards/bind', tenantMiddleware, bindNfcCard);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🛡️ JemputAman API Service Listening on Port ${env.PORT}`);
    console.log(`http://localhost:${env.PORT}`);
    console.log(`==================================================\n`);
  });
}

export default app;
