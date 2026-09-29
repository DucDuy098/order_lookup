const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) {
    res.status(200).json({ loggedIn: false });
    return;
  }
  try {
    const session = jwt.verify(match[1], process.env.SESSION_SECRET);
    res.status(200).json({ loggedIn: true, username: session.sub });
  } catch (e) {
    res.status(200).json({ loggedIn: false });
  }
};
