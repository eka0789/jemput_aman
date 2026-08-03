import express from 'express';
import { attachVerificationPhoto, verifyNfcTap, verifyFaceLiveness } from '../controllers/nfcController.js';
import { requireRole } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/v1/pickup/verify-nfc
router.post('/verify-nfc', requireRole('TEACHER', 'ADMIN'), verifyNfcTap);
router.post('/verification-photo', requireRole('TEACHER', 'ADMIN'), attachVerificationPhoto);
router.post('/verify-face-liveness', requireRole('TEACHER', 'ADMIN'), verifyFaceLiveness);

export default router;

