const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

const Job = {
  async create({ sourceLang, targetLang, inputVideoUrl }) {
    const { rows } = await pool.query(
      `INSERT INTO jobs (source_lang, target_lang, input_video_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [sourceLang, targetLang, inputVideoUrl]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findAll(limit = 50, offset = 0) {
    const { rows } = await pool.query(
      'SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return rows;
  },

  async updateStatus(id, { status, outputVideoUrl, errorMessage }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    if (outputVideoUrl) { fields.push(`output_video_url = $${idx++}`); values.push(outputVideoUrl); }
    if (errorMessage) { fields.push(`error_message = $${idx++}`); values.push(errorMessage); }
    fields.push(`updated_at = now()`);

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async countByStatus(status) {
    const { rows } = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', [status]);
    return parseInt(rows[0].count, 10);
  },
};

module.exports = Job;
