/* js/fear.js — Korku & Açgözlülük Endeksi */

async function fetchFearGreed() {
  try {
    const res  = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await res.json();
    const item = data.data[0];

    const value      = parseInt(item.value);
    const label      = translateLabel(item.value_classification);
    const color      = getColor(value);

    const el = document.getElementById('hFgi');
    if (!el) return;

    el.textContent   = `${value} ${label}`;
    el.style.color   = color;

  } catch (err) {
    console.error('Fear & Greed alınamadı:', err);
  }
}

function translateLabel(label) {
  const map = {
    'Extreme Fear':  'Aşırı Korku',
    'Fear':          'Korku',
    'Neutral':       'Nötr',
    'Greed':         'Açgözlü',
    'Extreme Greed': 'Aşırı Açgözlü'
  };
  return map[label] || label;
}

function getColor(value) {
  if (value <= 25) return '#f0415a';       // kırmızı — aşırı korku
  if (value <= 45) return '#ff8c42';       // turuncu — korku
  if (value <= 55) return '#dce8ff';       // beyaz — nötr
  if (value <= 75) return '#f5c842';       // sarı — açgözlü
  return '#05d78a';                        // yeşil — aşırı açgözlü
}

document.addEventListener('DOMContentLoaded', () => {
  fetchFearGreed();
  fetchMarketStats();
  setInterval(fetchFearGreed,    5 * 60 * 1000);
  setInterval(fetchMarketStats, 60 * 1000); // 1 dakikada bir
});

async function fetchMarketStats() {
  try {
    const res  = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await res.json();
    const d    = data.data;

    // BTC Dominans
    const btcDom = d.market_cap_percentage.btc.toFixed(1);
    const domEl  = document.getElementById('hBtcDom');
    if (domEl) domEl.textContent = btcDom + '%';

    // 24s Hacim
    const vol   = d.total_volume.usd;
    const volEl = document.getElementById('hVol');
    if (volEl) volEl.textContent = '$' + formatBig(vol);

  } catch (err) {
    console.error('Market stats alınamadı:', err);
  }
}

function formatBig(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9)  return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6)  return (num / 1e6).toFixed(1) + 'M';
  return num.toLocaleString();
}