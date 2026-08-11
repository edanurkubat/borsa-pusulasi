// server/routes/portfolio.js

const express = require("express");
const Trade = require("../models/Portfolio");
const authMiddleware = require("../middleware/auth");
const router = express.Router();
const Snapshot = require('../models/PortfolioSnapshot');

// Tüm işlemleri getir

router.get("/", authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('balance lastReset');
    
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ trades, balance: user.balance, lastReset: user.lastReset });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Yeni işlem ekle
router.post("/trade", authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { symbol, name, type, price, quantity } = req.body;
    const total = parseFloat((price * quantity).toFixed(2));
    const user = await User.findById(req.user.id);
    
    const trade = new Trade({ userId: req.user.id, symbol, name, type, price, quantity, total });
    await trade.save();
    res.status(201).json({ trade, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// İşlem sil
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const trade = await Trade.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (trade) {
      const user = await User.findById(req.user.id);
      // Alış silindiyse parayı iade et, satış silindiyse geri al
      if (trade.type === 'buy') {
        user.balance = parseFloat((user.balance + trade.total).toFixed(2));
      } else {
        user.balance = parseFloat((user.balance - trade.total).toFixed(2));
      }
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
// Liderboard — tüm kullanıcıların portföy özeti
router.get('/leaderboard', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find().select('username');

    const results = await Promise.all(users.map(async u => {
      const trades = await Trade.find({ userId: u._id });
      if (!trades.length) return { username: u.username, tradeCount: 0, totalPnl: 0 };

      // Gerçek K/Z: her işlemin anlık fiyatla karşılaştırması gerekir
      // Ama anlık fiyat backend'de yok, o yüzden realize edilmiş K/Z hesaplayalım
      // Alış maliyeti vs satış geliri
      let buyTotal = 0;
      let sellTotal = 0;
      trades.forEach(t => {
        if (t.type === 'buy') buyTotal += t.total;
        if (t.type === 'sell') sellTotal += t.total;
      });

      // Net realize edilmiş kar = satış - alış (sadece satışlar için)
      const totalPnl = sellTotal - buyTotal;

      return {
        username: u.username,
        tradeCount: trades.length,
        totalPnl: parseFloat(totalPnl.toFixed(2))
      };
    }));

    results.sort((a, b) => b.totalPnl - a.totalPnl);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});
// SNAPSHOT KAYDET
router.post('/snapshot', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Değer gerekli' });

    // Aynı gün içinde birden fazla kaydetme — son kaydı güncelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Snapshot.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });

    if (existing) {
      existing.value = value;
      existing.date = new Date();
      await existing.save();
    } else {
      await Snapshot.create({ userId: req.user.id, value });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// SNAPSHOT GEÇMİŞİ GETİR
router.get('/snapshots', authMiddleware, async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ userId: req.user.id })
      .sort({ date: 1 })
      .limit(90); // son 90 gün
    res.json({ snapshots });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});
// SNAPSHOT SİL
router.delete('/snapshots', authMiddleware, async (req, res) => {
  try {
    await Snapshot.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});
module.exports = router;
