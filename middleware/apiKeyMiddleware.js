module.exports = function apiKeyMiddleware(req, res, next) {
  const staticKey = process.env.STATIC_API_KEY;
  if (!staticKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Use: Bearer <STATIC_API_KEY>' });
  }

  const token = authHeader.slice(7);
  if (token !== staticKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};
