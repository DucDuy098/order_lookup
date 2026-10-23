const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Thiếu username hoặc password' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT username, password_hash FROM app_users WHERE username = $1',
      [username]
    );
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Sai username hoặc password' });
      return;
    }

    const token = jwt.sign({ sub: user.username }, process.env.SESSION_SECRET, { expiresIn: '30d' });
    res.setHeader(
      'Set-Cookie',
      `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}`
    );
    res.status(200).json({ ok: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: 'Lỗi server: ' + (e.message || String(e)) });
  }
};
