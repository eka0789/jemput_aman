import { env } from '../config/env.js';

export const tenantMiddleware = (req, res, next) => {
  const schoolId = req.headers['x-school-id'] || req.query.school_id || env.DEFAULT_SCHOOL_ID;
  
  if (!schoolId) {
    return res.status(400).json({
      error: 'TENANT_HEADER_REQUIRED',
      message: 'Header X-School-ID wajib disertakan untuk konteks multi-tenant'
    });
  }

  req.schoolId = schoolId;
  next();
};
