//server/middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Header'dan token'ı al
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı, erişim reddedildi' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Geçersiz token' });
  }
};