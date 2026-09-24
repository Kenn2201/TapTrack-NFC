// Global error handler with safe fallback messages and correlation IDs.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const correlationId = req.id || null;

  const payload = {
    ...(correlationId && { correlationId }),
    ...(err.code && { code: err.code }),
  };

  if (status >= 500) {
    console.error(`[${correlationId || 'no-id'}] ${err.message}`, err);
    return res.status(status).json({
      error: err.expose === true
        ? (err.message || 'Service temporarily unavailable.')
        : 'Something went wrong while processing this action.',
      ...payload,
    });
  }

  return res.status(status).json({ error: err.message || 'Request failed', ...payload });
}