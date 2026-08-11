// server/routes/watchlist.js

const express   = require('express');
const User      = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router    = express.Router();

// Watchlist'i getir (korumalı)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('watchlist');
    res.json({ watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Coin ekle
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = await User.findById(req.user.id);

    if (user.watchlist.includes(symbol)) {
      return res.status(400).json({ error: 'Zaten listede var' });
    }

    user.watchlist.push(symbol);
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Coin sil
router.delete('/remove', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = await User.findById(req.user.id);

    user.watchlist = user.watchlist.filter(s => s !== symbol);
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;