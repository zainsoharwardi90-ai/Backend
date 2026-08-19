const express = require('express');
const apiKeyMiddleware = require('../../../middleware/apiKeyMiddleware');
const Job = require('../../../models/Job');
const dubbingQueue = require('../../../queue/dubbingQueue');

const router = express.Router();
router.use(apiKeyMiddleware);

router.post('/', express.json(), async (req, res) => {
  try {
    const { video_url, source_lang, target_lang } = req.body;
    if (!video_url || !source_lang || !target_lang) {
      return res.status(400).json({ error: 'video_url, source_lang, and target_lang are required' });
    }

    const concurrentJobs = await Job.countByStatus('processing');
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10);
    if (concurrentJobs >= maxConcurrent) {
      return res.status(429).json({ error: `Max ${maxConcurrent} concurrent jobs allowed` });
    }

    const job = await Job.create({
      sourceLang: source_lang,
      targetLang: target_lang,
      inputVideoUrl: video_url,
    });

    await dubbingQueue.addJob({
      jobId: job.id,
      inputVideoUrl: video_url,
      sourceLang: source_lang,
      targetLang: target_lang,
    });

    res.json({ job_id: job.id, status: job.status });
  } catch (err) {
    console.error('API dub error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
