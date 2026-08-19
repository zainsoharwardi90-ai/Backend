const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../storage/storageClient');
const Job = require('../models/Job');
const dubbingQueue = require('../queue/dubbingQueue');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported video format. Allowed: mp4, mov, avi, mkv, webm'));
    }
  },
});

router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { source_lang, target_lang } = req.body;
    if (!source_lang || !target_lang) {
      return res.status(400).json({ error: 'source_lang and target_lang are required' });
    }

    const concurrentJobs = await Job.countByStatus('processing');
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10);
    if (concurrentJobs >= maxConcurrent) {
      return res.status(429).json({ error: `Max ${maxConcurrent} concurrent jobs allowed` });
    }

    const videoKey = `uploads/${Date.now()}-${req.file.originalname}`;
    const videoUrl = await uploadFile(videoKey, req.file.buffer, req.file.mimetype);

    const job = await Job.create({
      sourceLang: source_lang,
      targetLang: target_lang,
      inputVideoUrl: videoUrl,
    });

    await dubbingQueue.addJob({
      jobId: job.id,
      inputVideoUrl: videoUrl,
      sourceLang: source_lang,
      targetLang: target_lang,
    });

    res.json({ job_id: job.id, status: job.status });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
