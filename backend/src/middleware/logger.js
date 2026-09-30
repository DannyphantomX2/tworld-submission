// One line per request: method, path, status, how long it took.
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}
