module.exports = function sessionAuthMiddleware(req, res, next) {
  // Public routes - accessible without any authentication
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Login page must not self-redirect
  if (req.path === '/login') {
    return next();
  }

  // /api/v1/* is secured exclusively by apiKeyMiddleware (static API key),
  // not by the session. Pass through so the v1 routers can enforce the key.
  if (req.path.startsWith('/api/v1/')) {
    return next();
  }

  // /api/auth/* (login, logout, me) manages its own session state
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  // Other /api routes (upload, jobs) require a valid session.
  // Respond with JSON, never an HTML redirect, for API clients.
  if (req.path.startsWith('/api/')) {
    if (req.session && req.session.authenticated) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Non-API page routes redirect to the login page
  return res.redirect('/login');
};
