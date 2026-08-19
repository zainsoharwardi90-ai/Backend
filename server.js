require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const sessionAuth = require('./middleware/sessionAuthMiddleware');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const jobsRoutes = require('./routes/jobs');
const apiV1Dub = require('./routes/api/v1/dub');
const apiV1Status = require('./routes/api/v1/status');
const apiV1Result = require('./routes/api/v1/result');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'yt-dubber-session-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(sessionAuth);

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/v1/dub', apiV1Dub);
app.use('/api/v1/status', apiV1Status);
app.use('/api/v1/result', apiV1Result);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
