// js/coin.js — Coin detay sayfası

const BINANCE    = 'https://api.binance.com/api/v3';
const COINGECKO  = 'https://api.coingecko.com/api/v3';
const API        = 'http://localhost:3000/api';

const COIN_META = {
  BTC:  { id:'bitcoin',       name:'Bitcoin',   color:'#f7931a' },
  ETH:  { id:'ethereum',      name:'Ethereum',  color:'#8a9ff1' },
  SOL:  { id:'solana',        name:'Solana',    color:'#9945ff' },
  BNB:  { id:'binancecoin',   name:'BNB',       color:'#f3ba2f' },
  ADA:  { id:'cardano',       name:'Cardano',   color:'#3674cb' },
  AVAX: { id:'avalanche-2',   name:'Avalanche', color:'#e84142' },
  DOT:  { id:'polkadot',      name:'Polkadot',  color:'#e6007a' },
  LINK: { id:'chainlink',     name:'Chainlink', color:'#264aad' },
  MATIC:{ id:'matic-network', name:'Polygon',   color:'#8247e5' },
  XRP:  { id:'ripple',        name:'XRP',       color:'#00aae4' },
};

const sym    = new URLSearchParams(location.search).get('sym') || 'BTC';
const meta   = COIN_META[sym] || { id: sym.toLowerCase(), name: sym, color: '#445870' };
const binSym = sym === 'MATIC' ? 'POL' : sym;

let chartData      = [];
let activeInterval = '1m';

document.title = `${sym} — Borsa Pusulası`;

// ── BİNANCE 24S VERİSİ ──
async function loadTicker() {
  try {
    const res  = await fetch(`${BINANCE}/ticker/24hr?symbol=${binSym}USDT`);
    const data = await res.json();
    const price = parseFloat(data.lastPrice);
    const chg   = parseFloat(data.priceChangePercent);
    const isPos = chg >= 0;

    document.getElementById('heroName').textContent  = meta.name;
    document.getElementById('heroSym').textContent   = sym + '/USDT';
    document.getElementById('heroPrice').textContent = '$' + price.toLocaleString('tr-TR', { minimumFractionDigits: price < 1 ? 4 : 2 });
    const chgEl = document.getElementById('heroChg');
    chgEl.textContent = (isPos ? '▲ +' : '▼ ') + chg.toFixed(2) + '%';
    chgEl.className   = 'coin-hero-chg ' + (isPos ? 'positive' : 'negative');

    const dot = document.getElementById('heroDot');
    dot.textContent        = sym[0];
    dot.style.background   = meta.color + '22';
    dot.style.color        = meta.color;

    document.getElementById('statHigh').textContent = '$' + parseFloat(data.highPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    document.getElementById('statLow').textContent  = '$' + parseFloat(data.lowPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    document.getElementById('statVol').textContent  = '$' + formatBig(parseFloat(data.quoteVolume));
    const chgEl2 = document.getElementById('statChg');
    chgEl2.textContent = (isPos ? '+' : '') + chg.toFixed(2) + '%';
    chgEl2.className   = 'cstat-val ' + (isPos ? 'positive' : 'negative');
    document.getElementById('statOpen').textContent = '$' + parseFloat(data.openPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    document.getElementById('statPrev').textContent = '$' + parseFloat(data.prevClosePrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  } catch {}
}

// ── COİNGECKO MARKET VERİSİ ──
async function loadGeckoStats() {
  try {
    const res = await fetch(
      `${COINGECKO}/coins/${meta.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    const d  = await res.json();
    const md = d.market_data;

    document.getElementById('gMarketCap').textContent   = formatBigUSD(md.market_cap?.usd);
    document.getElementById('gRank').textContent        = `#${d.market_cap_rank} Küresel Sıralama`;

    const circ  = md.circulating_supply;
    const total = md.total_supply;
    const maxS  = md.max_supply;
    document.getElementById('gCircSupply').textContent  =
      circ ? circ.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ' + sym : '—';
    if (circ && total) {
      document.getElementById('supplyBar').style.width = Math.min((circ / total) * 100, 100) + '%';
    }

    const ath    = md.ath?.usd;
    const athChg = md.ath_change_percentage?.usd?.toFixed(1);
    document.getElementById('gATH').textContent     = ath ? formatBigUSD(ath) : '—';
    document.getElementById('gATHDate').textContent =
      (md.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString('tr-TR') : '—') +
      (athChg ? ` · ${athChg}%` : '');

    document.getElementById('gTotalSupply').textContent =
      total ? total.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ' + sym : '—';
    document.getElementById('gMaxSupply').textContent   =
      maxS ? 'Maks: ' + maxS.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : 'Sınırsız';
  } catch {}
}

// ── MUMU VERİSİ + GRAFİK ──
async function loadCandle(interval = '1m', limit = 60) {
  try {
    const res  = await fetch(`${BINANCE}/klines?symbol=${binSym}USDT&interval=${interval}&limit=${limit}`);
    const data = await res.json();
    chartData  = data.map(k => ({ t: k[0], c: parseFloat(k[4]) }));
    drawCoinChart();
  } catch {}
}

function drawCoinChart() {
  const canvas = document.getElementById('coinChart');
  if (!canvas || !chartData.length) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.offsetWidth, H = 300;
  canvas.width        = W * devicePixelRatio;
  canvas.height       = H * devicePixelRatio;
  canvas.style.height = H + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const prices = chartData.map(d => d.c);
  const pad    = { t: 10, b: 36, l: 8, r: 72 };
  const cw     = W - pad.l - pad.r;
  const ch     = H - pad.t - pad.b;
  const min    = Math.min(...prices) * 0.998;
  const max    = Math.max(...prices) * 1.002;
  const xs     = i => pad.l + (i / (prices.length - 1)) * cw;
  const ys     = v => pad.t + (1 - (v - min) / (max - min)) * ch;
  const isUp   = prices[prices.length - 1] >= prices[0];
  const col    = isUp ? '#05d78a' : '#f0415a';

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(45,55,72,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }

  // Gradient
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, col + '40');
  grad.addColorStop(1, col + '00');
  ctx.beginPath();
  ctx.moveTo(xs(0), ys(prices[0]));
  prices.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.lineTo(xs(prices.length - 1), H - pad.b);
  ctx.lineTo(xs(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Çizgi
  ctx.beginPath();
  ctx.moveTo(xs(0), ys(prices[0]));
  prices.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Son nokta
  const lx = xs(prices.length - 1), ly = ys(prices[prices.length - 1]);
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2; ctx.stroke();

  // Sağ fiyat etiketleri
  ctx.fillStyle = '#5b7494';
  ctx.font = '10px JetBrains Mono';
  ctx.textAlign = 'left';
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) / 4) * (4 - i);
    ctx.fillText('$' + v.toLocaleString('tr-TR', { maximumFractionDigits: v < 1 ? 4 : 0 }), W - pad.r + 6, pad.t + (ch / 4) * i + 4);
  }

  // Alt zaman etiketleri
  const msPerCandle = { '1m': 60000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 }[activeInterval] || 60000;
  const totalMs = chartData.length * msPerCandle;
  const startMs = chartData[0]?.t || (Date.now() - totalMs);
  ctx.fillStyle = '#5b7494';
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const x   = pad.l + (cw / 5) * i;
    const tMs = startMs + (totalMs / 5) * i;
    const d   = new Date(tMs);
    const lbl = (activeInterval === '1m' || activeInterval === '15m')
      ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    ctx.fillText(lbl, x, H - pad.b + 16);
  }
}

function changeTF(btn, interval, limit) {
  document.querySelectorAll('.tftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeInterval = interval;
  loadCandle(interval, limit);
}

// ── WATCHLIST ──
async function toggleCoinWatch() {
  const token = localStorage.getItem('token');
  if (!token) { showToast('⚠️','Giriş gerekli','İzleme listesi için giriş yap'); openModal('login'); return; }
  if (localStorage.getItem('isVerified') !== 'true') {
    showToast('⚠️', 'Hesap Aktif Değil', 'İzleme listesi için profilinden hesabını aktifleştir.');
    return;
  }

  if (!token) { showToast('⚠️', 'Giriş gerekli', 'İzleme listesi için giriş yap'); openModal('login'); return; }

  const btn      = document.getElementById('watchBtn');
  const isActive = btn.classList.contains('active');
  const endpoint = isActive ? 'remove' : 'add';
  const method   = isActive ? 'DELETE' : 'POST';

  try {
    const res = await fetch(`${API}/watchlist/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symbol: sym }),
    });
    if (!res.ok) return;
    btn.classList.toggle('active');
    btn.textContent = isActive ? '♡ İzlemeye Ekle' : '❤️ İzlemeden Çıkar';
    showToast(isActive ? '💔' : '❤️', isActive ? 'Listeden çıkarıldı' : 'Listeye eklendi', `${sym} izleme listesi güncellendi`);
  } catch {}
}

async function checkWatchStatus() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res  = await fetch(`${API}/watchlist`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.watchlist?.includes(sym)) {
      const btn = document.getElementById('watchBtn');
      btn.classList.add('active');
      btn.textContent = '❤️ İzlemeden Çıkar';
    }
  } catch {}
}

// ── YARDIMCILAR ──
function goTrade(type) {
  localStorage.setItem('tradeAction', JSON.stringify({ sym, type }));
  window.location.href = 'index.html';
}

function formatBig(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9)  return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6)  return (num / 1e6).toFixed(1) + 'M';
  return num.toLocaleString();
}

function formatBigUSD(num) {
  if (!num) return '—';
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9)  return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6)  return '$' + (num / 1e6).toFixed(2) + 'M';
  return '$' + num.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
}

function showToast(ico, title, msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastIco').textContent   = ico;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent   = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

// ── BAŞLAT ──
document.addEventListener('DOMContentLoaded', async () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'light') document.body.classList.add('light');

  await loadTicker();
  loadGeckoStats(); // arka planda çek, bekleme
  await loadCandle('1m', 60);
  await checkWatchStatus();

  setInterval(loadTicker, 5000);
  window.addEventListener('resize', drawCoinChart);
});