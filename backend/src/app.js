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
  updatePickupPersonPhoto,
  updateStudentParentPhone
} from './controllers/managementController.js';
import { tenantMiddleware } from './middlewares/tenant.js';
import { authenticateJWT, requireRole } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';
import { isSupabaseConfigured, supabase } from './config/supabase.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { getSession, login, unlockKiosk } from './controllers/authController.js';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGINS.length
    ? (origin, callback) => callback(
        null,
        !origin || env.CORS_ORIGINS.includes(origin)
      )
    : env.NODE_ENV !== 'production'
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(), microphone=()');
  next();
});
app.use(express.json({ limit: '2mb' }));

app.post(
  '/api/v1/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 8, key: req => `login:${req.ip}` }),
  login
);

// API Status Health Check
app.get('/api/health', async (req, res) => {
  let database = 'NOT_CONFIGURED';
  const authentication = (
    env.JWT_SECRET
    && env.ADMIN_PASSWORD_HASH
    && env.FOUNDATION_PASSWORD_HASH
    && env.KIOSK_PIN_HASH
  ) ? 'CONFIGURED' : 'INCOMPLETE';
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('schools').select('id', { head: true, count: 'exact' });
    database = error
      ? 'UNAVAILABLE'
      : env.SUPABASE_SECRET_KEY
        ? 'CONNECTED'
        : 'SECRET_KEY_REQUIRED';
  }

  const healthy = database === 'CONNECTED' && authentication === 'CONFIGURED';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'HEALTHY' : 'DEGRADED',
    service: 'JemputAman Multi-Tenant API Service',
    database,
    authentication,
    time: new Date().toISOString()
  });
});

// All application APIs require an authenticated identity and tenant context.
app.use('/api/v1', authenticateJWT, tenantMiddleware);

app.get('/api/v1/auth/session', requireRole('ADMIN', 'FOUNDATION'), getSession);
app.post(
  '/api/v1/auth/kiosk/unlock',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 8, key: req => `kiosk:${req.ip}:${req.user?.id || ''}` }),
  requireRole('ADMIN', 'FOUNDATION'),
  unlockKiosk
);

// Pickup Verification Routes
app.use('/api/v1/pickup', pickupRoutes);

// Schedule Routes
app.get('/api/v1/schedules/:studentId', requireRole('PARENT', 'ADMIN', 'TEACHER'), getStudentSchedule);
app.put('/api/v1/schedules/:studentId', requireRole('PARENT', 'ADMIN'), updateStudentSchedule);

// Emergency OTP Routes
app.post(
  '/api/v1/pickup/request-otp',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5, key: req => `otp-request:${req.ip}:${req.schoolId}` }),
  requireRole('TEACHER', 'ADMIN'),
  requestEmergencyOtp
);
app.post(
  '/api/v1/pickup/approve-otp',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 10, key: req => `otp-approve:${req.ip}:${req.body?.otp_id || ''}` }),
  requireRole('PARENT', 'TEACHER', 'ADMIN'),
  approveEmergencyOtp
);
app.get('/api/v1/pickup/pending-otps', requireRole('PARENT', 'TEACHER', 'ADMIN'), getPendingOtps);

// Report & Audit Routes
app.get('/api/v1/reports/logs', requireRole('ADMIN', 'FOUNDATION'), getPickupLogs);
app.get('/api/v1/reports/export/excel', requireRole('ADMIN', 'FOUNDATION'), exportExcelReport);
app.get('/api/v1/reports/export/pdf', requireRole('ADMIN', 'FOUNDATION'), exportPdfReport);

// Data & Card Management Routes
app.get('/api/v1/students', requireRole('ADMIN', 'TEACHER', 'PARENT'), getStudents);
app.post('/api/v1/students', requireRole('ADMIN'), createStudent);
app.patch('/api/v1/students/:studentId/photo', requireRole('ADMIN'), updateStudentPhoto);
app.patch('/api/v1/students/:studentId/parent-phone', requireRole('ADMIN', 'PARENT'), updateStudentParentPhone);
app.get('/api/v1/pickup-persons', requireRole('ADMIN', 'TEACHER', 'PARENT'), getPickupPersons);
app.patch('/api/v1/pickup-persons/:personId/photo', requireRole('ADMIN'), updatePickupPersonPhoto);
app.post('/api/v1/nfc/cards/status', requireRole('ADMIN'), updateCardStatus);
app.post('/api/v1/nfc/cards/bind', requireRole('ADMIN'), bindNfcCard);

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
