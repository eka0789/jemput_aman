import { env } from '../config/env.js';

export const tenantMiddleware = (req, res, next) => {
  const requestedSchoolId = req.headers['x-school-id'] || req.query.school_id;
  const userSchoolId = req.user?.school_id;
  const allowedSchoolIds = Array.isArray(req.user?.school_ids) ? req.user.school_ids : [];
  const isFoundation = req.user?.role === 'FOUNDATION';
  const schoolId = requestedSchoolId || userSchoolId || env.DEFAULT_SCHOOL_ID;

  if (!schoolId) {
    return res.status(400).json({
      error: 'TENANT_HEADER_REQUIRED',
      message: 'Header X-School-ID wajib disertakan untuk konteks multi-tenant'
    });
  }

  if (!req.user?.isDevelopmentMock) {
    const canAccessTenant = isFoundation
      ? allowedSchoolIds.includes(schoolId) || userSchoolId === schoolId
      : Boolean(userSchoolId && userSchoolId === schoolId);

    if (!canAccessTenant) {
      return res.status(403).json({
        error: 'TENANT_ACCESS_DENIED',
        message: 'Akun tidak memiliki akses ke tenant sekolah yang diminta'
      });
    }
  }

  req.schoolId = schoolId;
  next();
};
