import express from 'express';
import { attachVerificationPhoto, verifyNfcTap } from '../controllers/nfcController.js';
import { requireRole } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/v1/pickup/verify-nfc
router.post('/verify-nfc', requireRole('TEACHER', 'ADMIN', 'FOUNDATION'), verifyNfcTap);
router.post('/verification-photo', requireRole('TEACHER', 'ADMIN'), attachVerificationPhoto);

export default router;
