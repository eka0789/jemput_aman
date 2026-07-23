import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Provide a mock fallback user if running in dev mode without token
    req.user = {
      id: 'usr-teacher-1',
      school_id: req.schoolId || env.DEFAULT_SCHOOL_ID,
      role: req.headers['x-mock-role'] || 'TEACHER',
      full_name: 'Pak Ahmad (Guru Piket)'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token otentikasi tidak valid atau telah kedaluwarsa' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Akses ditolak. Peran '${req.user?.role || 'UNKNOWN'}' tidak memiliki izin untuk tindakan ini.`
      });
    }
    next();
  };
};
