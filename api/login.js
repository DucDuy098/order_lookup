const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?username=eq.${encodeURIComponent(username)}&select=*`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    );
    if (!r.ok) throw new Error('Supabase lỗi (HTTP ' + r.status + ')');
    const rows = await r.json();
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
