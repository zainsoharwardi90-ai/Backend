const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const jobs = await Job.findAll(limit, offset);
    res.json({ jobs });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
