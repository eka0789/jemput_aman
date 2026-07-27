import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (env.NODE_ENV !== 'production' && env.AUTH_ALLOW_DEV_MOCK) {
      const allowedRoles = ['ADMIN', 'TEACHER', 'PARENT', 'FOUNDATION'];
      const requestedRole = String(req.headers['x-mock-role'] || 'TEACHER').toUpperCase();
      req.user = {
        id: requestedRole === 'PARENT' ? 'usr-parent-1' : 'usr-teacher-1',
        school_id: req.headers['x-school-id'] || env.DEFAULT_SCHOOL_ID,
        role: allowedRoles.includes(requestedRole) ? requestedRole : 'TEACHER',
        full_name: 'Pengguna Development JemputAman',
        isDevelopmentMock: true
      };
      return next();
    }
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Bearer token wajib disertakan'
    });
  }

  if (!env.JWT_SECRET) {
    return res.status(503).json({
      error: 'AUTH_NOT_CONFIGURED',
      message: 'JWT_SECRET backend belum dikonfigurasi'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token tidak memuat identitas dan peran yang valid'
      });
    }
    req.user = {
      ...decoded,
      role: String(decoded.role).toUpperCase()
    };
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
