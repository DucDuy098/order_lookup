const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

function getAuthClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/spreadsheets.readonly']);
}

function checkSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return null;
  try {
    return jwt.verify(match[1], process.env.SESSION_SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  const session = checkSession(req);
  if (!session) {
    res.status(401).json({ error: 'Chưa đăng nhập' });
    return;
  }

  const { action, sheetId, tab } = req.query;
  if (!sheetId) {
    res.status(400).json({ error: 'Thiếu sheetId' });
    return;
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    if (action === 'tabs') {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties.title'
      });
      const titles = (meta.data.sheets || []).map((s) => s.properties.title);
      res.status(200).json({ tabs: titles });
      return;
    }

    if (action === 'values') {
      if (!tab) {
        res.status(400).json({ error: 'Thiếu tab' });
        return;
      }
      const range = "'" + String(tab).replace(/'/g, "''") + "'";
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
        majorDimension: 'ROWS'
      });
      res.status(200).json({ values: result.data.values || [] });
      return;
    }

    res.status(400).json({ error: 'action không hợp lệ' });
  } catch (e) {
    const msg = (e && e.errors && e.errors[0] && e.errors[0].message) || e.message || String(e);
    res.status(500).json({ error: 'Lỗi khi đọc sheet: ' + msg });
  }
};
