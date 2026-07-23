export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Log ${new Date().toISOString()}]`, err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Terjadi kesalahan pada server internal JemputAman',
    timestamp: new Date().toISOString()
  });
};
