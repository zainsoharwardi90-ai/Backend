const express = require('express');
const apiKeyMiddleware = require('../../../middleware/apiKeyMiddleware');
const Job = require('../../../models/Job');

const router = express.Router();
router.use(apiKeyMiddleware);

router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.status === 'done') {
      return res.json({
        job_id: job.id,
        status: job.status,
        output_video_url: job.output_video_url,
        target_lang: job.target_lang,
      });
    }

    if (job.status === 'failed') {
      return res.json({
        job_id: job.id,
        status: job.status,
        error: job.error_message,
      });
    }

    res.json({ job_id: job.id, status: job.status });
  } catch (err) {
    console.error('API result error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
