// server/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sadece resim dosyası yüklenebilir'));
  }
});

// ── ORTAK MAİL WRAPPER ──
function mailWrap(headerColor, content) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:2rem;max-width:480px;margin:0 auto">
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
    <div style="background:${headerColor};padding:1.5rem 2rem">
      <div style="font-family:monospace;font-size:1.1rem;font-weight:800;color:#ffffff;letter-spacing:3px">◈ BORSAPUSULASI</div>
    </div>
    <div style="padding:2rem;color:#0f172a;line-height:1.6">
      ${content}
    </div>
    <div style="background:#f1f5f9;padding:0.9rem 2rem;font-size:0.62rem;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0">
      Bu mesaj otomatik gönderilmiştir · borsapusulasiweb@gmail.com · Yatırım tavsiyesi değildir.
    </div>
  </div>
</div>`;
}

// ── KAYIT ──
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username, isVerified: user.isVerified });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `Bu ${field === 'email' ? 'email' : 'kullanıcı adı'} zaten kayıtlı` });
    }
    res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
});

// ── GİRİŞ ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Bu e-posta ile kayıtlı hesap bulunamadı' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Şifre hatalı' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });
      const now = new Date().toLocaleString('tr-TR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      await transporter.sendMail({
        from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: '🔐 Hesabınıza Giriş Yapıldı',
        html: mailWrap('linear-gradient(135deg,#059669,#0891b2)', `
          <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">🔐 Giriş Bildirimi</p>
          <p style="color:#475569;margin-bottom:1.5rem">Merhaba <b>${user.username}</b>, hesabınıza giriş yapıldı.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:1rem;margin-bottom:1rem;border-left:3px solid #059669">
            <div style="font-size:0.65rem;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Tarih / Saat</div>
            <div style="font-size:0.95rem;font-weight:700;color:#0f172a">${now}</div>
          </div>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:0.9rem;font-size:0.78rem;color:#92400e">
            ⚠️ Bu işlem size ait değilse şifrenizi hemen değiştirin.
          </div>`)
      });
    } catch (err) {
      console.error('Giriş mail hatası:', err.message);
    }

    res.json({ token, username: user.username, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── ŞİFRE DEĞİŞTİR ──
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Mevcut şifre hatalı' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── KULLANICI ADI DEĞİŞTİR ──
router.post('/change-username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış' });
    const user = await User.findById(req.user.id);
    user.username = username;
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── OTP GÖNDER ──
router.post('/send-otp', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isVerified) return res.json({ message: 'Hesap zaten aktif.' });

    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
      const remaining = Math.ceil((user.otpLockUntil - new Date()) / 60000);
      return res.status(429).json({ message: `Çok fazla deneme. ${remaining} dakika bekle.` });
    }
    if (user.otpLockUntil && user.otpLockUntil <= new Date()) {
      user.otpSendCount = 0;
      user.otpLockUntil = null;
    }

    user.otpSendCount = (user.otpSendCount || 0) + 1;
    if (user.otpSendCount >= 3) {
      user.otpLockUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
      user.otpSendCount = 0;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '🔑 Hesap Aktivasyon Kodu',
      html: mailWrap('linear-gradient(135deg,#059669,#0891b2)', `
        <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">Hesap Aktivasyon Kodu</p>
        <p style="color:#475569;margin-bottom:1.5rem">Merhaba <b>${user.username}</b>, aktivasyon kodun aşağıda:</p>
        <div style="background:#f0fdf4;border:2px dashed #059669;border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem">
          <div style="font-size:2.4rem;font-weight:800;color:#059669;letter-spacing:12px;font-family:monospace">${otp}</div>
        </div>
        <p style="font-size:0.75rem;color:#94a3b8;text-align:center">Bu kod <b>10 dakika</b> geçerlidir.</p>`)
    });

    res.json({ success: true, message: 'OTP gönderildi.', sendCount: user.otpSendCount });
  } catch (err) {
    res.status(500).json({ message: 'Mail gönderilemedi.', error: err.message });
  }
});

// ── OTP DOĞRULA ──
router.post('/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.otpCode) return res.status(400).json({ message: 'Önce kod isteyin.' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'Kodun süresi doldu.' });
    if (user.otpCode !== otp) return res.status(400).json({ message: 'Hatalı kod.' });
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Hesap aktifleştirildi!' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// ── ALARM MAİL ──
router.post('/send-alarm', authMiddleware, async (req, res) => {
  try {
    const { symbol, condition, targetPrice, currentPrice } = req.body;
    const user = await User.findById(req.user.id);
    const condText = condition === 'above' ? '▲ Üzerine çıktı' : '▼ Altına indi';
    const condColor = condition === 'above' ? '#059669' : '#dc2626';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: `🔔 Fiyat Alarmı: ${symbol} ${condText}`,
      html: mailWrap('linear-gradient(135deg,#d97706,#dc2626)', `
        <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">🔔 Fiyat Alarmı Tetiklendi!</p>
        <p style="color:#475569;margin-bottom:1.5rem">Merhaba <b>${user.username}</b>, kurduğun alarm gerçekleşti.</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:1.2rem;margin-bottom:1rem;border-left:3px solid ${condColor}">
          <div style="font-size:1.1rem;font-weight:700;color:#0f172a">${symbol}/USDT</div>
          <div style="color:#64748b;margin-top:4px;font-size:0.82rem">Hedef: <b>$${Number(targetPrice).toLocaleString()}</b></div>
          <div style="font-size:1.8rem;font-weight:800;color:${condColor};margin-top:8px">
            $${Number(currentPrice).toLocaleString()}
          </div>
          <div style="color:${condColor};font-size:0.82rem;margin-top:4px;font-weight:600">${condText}</div>
        </div>`)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Mail gönderilemedi.', error: err.message });
  }
});

// ── E-POSTA DEĞİŞTİR ──
router.post('/change-email', authMiddleware, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Şifre hatalı' });
    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı' });
    user.email = newEmail;
    user.isVerified = false;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── ŞİFREMİ UNUTTUM (giriş yapılıyken) ──
router.post('/forgot-password', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ error: 'Kullanıcı bulunamadı' });
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpCode = resetToken;
    await user.save();

    const resetLink = `http://127.0.0.1:5500/reset-password.html?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '🔑 Şifre Sıfırlama',
      html: mailWrap('linear-gradient(135deg,#059669,#0891b2)', `
        <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">Şifre Sıfırlama</p>
        <p style="color:#475569;margin-bottom:1.5rem">Merhaba <b>${user.username}</b>, şifre sıfırlama talebinde bulundunuz.</p>
        <a href="${resetLink}" style="display:inline-block;margin:0.5rem 0 1.5rem;padding:12px 28px;background:linear-gradient(135deg,#059669,#0891b2);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.9rem">
          Şifremi Sıfırla →
        </a>
        <p style="font-size:0.72rem;color:#94a3b8">Bu link <b>5 dakika</b> geçerlidir ve yalnızca bir kez kullanılabilir.</p>`)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── ŞİFRE SIFIRLA (token ile) ──
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.otpCode !== token) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ error: 'Linkin süresi dolmuş' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link' });
  }
});

// ── HESAP SİL ──
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Şifre hatalı' });
    await User.findByIdAndDelete(req.user.id);

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });
      await transporter.sendMail({
        from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: '👋 Hesabınız Silindi',
        html: mailWrap('linear-gradient(135deg,#dc2626,#991b1b)', `
          <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">Hesap Silindi</p>
          <p style="color:#475569;margin-bottom:1rem">Merhaba <b>${user.username}</b>,</p>
          <p style="color:#475569;margin-bottom:1rem">Hesabınız başarıyla silindi. Tüm verileriniz kalıcı olarak kaldırıldı.</p>
          <p style="color:#94a3b8;font-size:0.78rem">Bizi tercih ettiğiniz için teşekkür ederiz. 👋</p>`)
      });
    } catch { }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── AVATAR YÜKLE ──
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi' });
    const user = await User.findById(req.user.id);
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    user.avatar = base64;
    await user.save();
    res.json({ success: true, avatar: base64 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── AVATAR GETİR ──
router.get('/avatar', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('avatar');
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── RESET TOKEN KONTROL ──
router.post('/check-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.otpCode !== token) return res.status(400).json({ error: 'Geçersiz veya kullanılmış link' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ error: 'Linkin süresi dolmuş' });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link' });
  }
});

// ── ŞİFREMİ UNUTTUM (public) ──
router.post('/forgot-password-public', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Bu e-posta ile kayıtlı hesap bulunamadı' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    user.otpCode = resetToken;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const resetLink = `http://127.0.0.1:5500/reset-password.html?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '🔑 Şifre Sıfırlama',
      html: mailWrap('linear-gradient(135deg,#059669,#0891b2)', `
        <p style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">Şifre Sıfırlama</p>
        <p style="color:#475569;margin-bottom:1.5rem">Merhaba <b>${user.username}</b>, şifre sıfırlama talebinde bulundunuz.</p>
        <a href="${resetLink}" style="display:inline-block;margin:0.5rem 0 1.5rem;padding:12px 28px;background:linear-gradient(135deg,#059669,#0891b2);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.9rem">
          Şifremi Sıfırla →
        </a>
        <p style="font-size:0.72rem;color:#94a3b8">Bu link <b>5 dakika</b> geçerlidir ve yalnızca bir kez kullanılabilir.</p>`)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── KULLANICI BİLGİLERİ ──
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email isVerified createdAt');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;