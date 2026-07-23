import express from 'express';
import { verifyNfcTap } from '../controllers/nfcController.js';
import { tenantMiddleware } from '../middlewares/tenant.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(tenantMiddleware);
router.use(authenticateJWT);

// POST /api/v1/pickup/verify-nfc
router.post('/verify-nfc', requireRole('TEACHER', 'ADMIN'), verifyNfcTap);

export default router;
