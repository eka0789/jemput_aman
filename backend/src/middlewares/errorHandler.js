import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Log ${new Date().toISOString()}]`, err);

  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode >= 500
    ? 'Terjadi kesalahan pada server internal JemputAman'
    : err.message || 'Terjadi kesalahan pada server internal JemputAman';
  res.status(statusCode).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message,
    timestamp: new Date().toISOString()
  });
};
