const Job = require('../models/Job');

const WORKER_URL = process.env.WORKER_URL;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 65000;

async function dispatchToWorker(data) {
  if (!WORKER_URL) {
    throw new Error('WORKER_URL is not configured on the server');
  }

  const payload = {
    job_id: data.jobId,
    video_url: data.inputVideoUrl,
    source_lang: data.sourceLang,
    target_lang: data.targetLang,
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${WORKER_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Worker responded with HTTP ${res.status}`);
      }

      const body = await res.json();
      console.log(`[INFO] Job ${data.jobId} dispatched to worker:`, body);
      return body;
    } catch (err) {
      lastError = err;
      console.warn(`[WARN] Dispatch attempt ${attempt}/${MAX_ATTEMPTS} failed for job ${data.jobId}: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  try {
    await Job.updateStatus(data.jobId, {
      status: 'failed',
      errorMessage: `Failed to dispatch job to worker: ${lastError.message}`,
    });
  } catch (dbErr) {
    console.error('[ERROR] Could not mark job as failed in DB:', dbErr.message);
  }

  throw lastError;
}

module.exports = { addJob: dispatchToWorker };
