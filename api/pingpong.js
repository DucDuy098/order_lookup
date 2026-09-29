const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const API_BASE = 'https://gateway.pingpongx.com';
const DEFAULT_START_TIME = '2023-01-01T00:00:00Z';
const MAX_PAGES = 30; // an toàn: tối đa 30 * 200 = 6000 giao dịch mỗi lần tải, tránh timeout/vòng lặp vô hạn

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

async function getAccessToken() {
  const appId = process.env.PP_APP_ID;
  const appSecret = process.env.PP_APP_SECRET;
  const url = `${API_BASE}/v2/token/get?app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}`;
  const res = await fetch(url);
  const raw = await res.json();
  // PingPong bọc dữ liệu thật trong field "data": { code, message, data: { access_token, ... } }
  const payload = (raw && raw.data) || raw;
  if (!payload.access_token) throw new Error('Không lấy được access_token: ' + JSON.stringify(raw));
  return payload.access_token;
}

function signBody(bodyStr) {
  const privateKey = (process.env.PP_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(bodyStr);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

async function callReportingApi(path, bodyObj, token) {
  const bodyStr = JSON.stringify(bodyObj);
  const signature = signBody(bodyStr);
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      sign: signature,
      'sign-version': 'v1'
    },
    body: bodyStr
  });
  const text = await res.text();
  if (!res.ok) throw new Error('API ' + path + ' lỗi (HTTP ' + res.status + '): ' + text);
  const raw = JSON.parse(text);
  // Cũng bọc trong field "data" giống endpoint token — lấy phần dữ liệu thật ra.
  return (raw && raw.data) || raw;
}

module.exports = async function handler(req, res) {
  const session = checkSession(req);
  if (!session) {
    res.status(401).json({ error: 'Chưa đăng nhập' });
    return;
  }

  const startTime = req.query.start || DEFAULT_START_TIME;
  const endTime = req.query.end || new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  try {
    const token = await getAccessToken();
    let all = [];
    let pageNo = 1;
    const pageSize = 200;
    while (pageNo <= MAX_PAGES) {
      const resp = await callReportingApi(
        '/api/reporting/v3/transaction-history',
        { page_no: pageNo, page_size: pageSize, start_time: startTime, end_time: endTime },
        token
      );
      const items = resp.item_list || [];
      all = all.concat(items);
      const totalNum = resp.total_num || 0;
      if (items.length === 0 || all.length >= totalNum) break;
      pageNo++;
    }
    res.status(200).json({ items: all });
  } catch (e) {
    res.status(500).json({ error: 'Lỗi khi gọi API PingPong: ' + (e.message || String(e)) });
  }
};
