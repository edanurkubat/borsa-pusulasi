// server/routes/stocks.js

const express = require('express');
const router = express.Router();
require('dotenv').config();

const BINANCE = 'https://api.binance.com/api/v3';

router.get('/quote/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    if (symbol === 'MATIC') symbol = 'POL';
    const response = await fetch(`${BINANCE}/ticker/24hr?symbol=${symbol}USDT`);
    const data = await response.json();
    res.json({
      c: parseFloat(data.lastPrice),
      o: parseFloat(data.openPrice),
      h: parseFloat(data.highPrice),
      l: parseFloat(data.lowPrice),
      dp: parseFloat(data.priceChangePercent),
      d: parseFloat(data.priceChange),
      v: parseFloat(data.volume)
    });
  } catch (err) {
    res.status(500).json({ error: 'Veri alınamadı' });
  }
});

router.get('/candle/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    if (symbol === 'MATIC') symbol = 'POL';
    const response = await fetch(
      `${BINANCE}/klines?symbol=${symbol}USDT&interval=1h&limit=60`
    );
    const data = await response.json();
    const candles = data.map(k => ({
      t: k[0],
      o: parseFloat(k[1]),
      h: parseFloat(k[2]),
      l: parseFloat(k[3]),
      c: parseFloat(k[4]),
      v: parseFloat(k[5])
    }));
    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: 'Grafik verisi alınamadı' });
  }
});

// Kripto haberleri
// Haber önbelleği
let newsCache = { data: [], time: 0 };

router.get('/news', async (req, res) => {
  try {
    // 5 dakika önbellek
    if (Date.now() - newsCache.time < 5 * 60 * 1000 && newsCache.data.length) {
      return res.json(newsCache.data);
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=crypto&token=${process.env.FINNHUB_KEY}`
    );

    const items = await response.json();
    const top8 = items.slice(0, 8);

    // Başlıkları çevir
    const translated = await Promise.all(top8.map(async item => {
      try {
        const trRes = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.headline)}&langpair=en|tr`
        );
        const trData = await trRes.json();
        return {
          ...item,
          headline: trData.responseData?.translatedText || item.headline
        };
      } catch {
        return item;
      }
    }));

    newsCache = { data: translated, time: Date.now() };
    res.json(translated);
  } catch (err) {
    console.error('Haber detay hatası:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Emir defteri
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    if (symbol === 'MATIC') symbol = 'POL';
    const response = await fetch(
      `${BINANCE}/depth?symbol=${symbol}USDT&limit=10`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Emir defteri alınamadı' });
  }
});

module.exports = router;