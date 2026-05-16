export function requestLogger(req, res, next) {
  const requestId = req.header("X-Request-ID") || "missing-request-id";

  console.log(
    `[requestId=${requestId}] ${req.method} ${req.originalUrl}`
  );

  next();
}
