// Global error handler
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : (err.message || 'Request failed');
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message, ...(err.code && { code: err.code }) });
}
