const express = require('express');
const router = express.Router();

router.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.WEBSITE_USERNAME || 'admin';
  const expectedPass = process.env.WEBSITE_PASSWORD;

  if (!expectedPass) {
    return res.status(500).json({ error: 'Server not configured with credentials' });
  }

  if (username === expectedUser && password === expectedPass) {
    req.session.authenticated = true;
    return res.json({ success: true });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.json({ authenticated: true });
  }
  res.json({ authenticated: false });
});

module.exports = router;
