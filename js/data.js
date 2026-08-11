/* js/data.js — Gerçek Binance verisi */

const API    = 'http://localhost:3000/api/stocks';
const BINANCE = 'https://api.binance.com/api/v3';

const COINS = [
  { sym:'BTC',  name:'Bitcoin',   price:0, chg:0, cap:'$1.34T', vol:'$34.2B', color:'#f7931a' },
  { sym:'ETH',  name:'Ethereum',  price:0, chg:0, cap:'$423B',  vol:'$18.7B', color:'#627eea' },
  { sym:'SOL',  name:'Solana',    price:0, chg:0, cap:'$78B',   vol:'$5.1B',  color:'#9945ff' },
  { sym:'BNB',  name:'BNB',       price:0, chg:0, cap:'$62B',   vol:'$2.9B',  color:'#f3ba2f' },
  { sym:'ADA',  name:'Cardano',   price:0, chg:0, cap:'$20B',   vol:'$1.2B',  color:'#0d6cf2' },
  { sym:'AVAX', name:'Avalanche', price:0, chg:0, cap:'$17B',   vol:'$0.9B',  color:'#e84142' },
  { sym:'DOT',  name:'Polkadot',  price:0, chg:0, cap:'$12B',   vol:'$0.5B',  color:'#e6007a' },
  { sym:'LINK', name:'Chainlink', price:0, chg:0, cap:'$11B',   vol:'$0.7B',  color:'#2a5ada' },
  { sym:'MATIC',name:'Polygon',   price:0, chg:0, cap:'$9B',    vol:'$0.4B',  color:'#8247e5' },
  { sym:'XRP',  name:'XRP',       price:0, chg:0, cap:'$34B',   vol:'$1.8B',  color:'#00aae4' },
];

let activeCoin     = 0;
let activeInterval = '1h';
let activeLimit    = 60;

const TF_MAP = {
  '1S': { interval: '1m',  limit: 60 },
  '4S': { interval: '15m', limit: 96 },
  '1G': { interval: '1h',  limit: 72 },
  '1H': { interval: '4h',  limit: 90 },
};

const sparkHistory = {};
const chartHistory = {};

async function fetchAllPrices() {
  for (let i = 0; i < COINS.length; i++) {
    await fetchPrice(i);
  }
}

async function fetchPrice(i) {
  try {
    const res  = await fetch(`${API}/quote/${COINS[i].sym}`);
    const data = await res.json();
    COINS[i].price = data.c;
    COINS[i].chg   = parseFloat(data.dp.toFixed(2));
    if (!sparkHistory[i]) sparkHistory[i] = [];
    if (!chartHistory[i]) chartHistory[i] = [];
    sparkHistory[i].push(data.c);
    if (sparkHistory[i].length > 14) sparkHistory[i].shift();
  } catch (err) {
    console.error(`${COINS[i].sym} fiyat hatası:`, err);
  }
}

async function fetchCandle(i, interval = activeInterval, limit = activeLimit) {
  try {
    const res  = await fetch(
      `${BINANCE}/klines?symbol=${COINS[i].sym}USDT&interval=${interval}&limit=${limit}`
    );
    const data = await res.json();
    chartHistory[i] = data.map(k => parseFloat(k[4]));
  } catch (err) {
    console.error(`${COINS[i].sym} grafik hatası:`, err);
  }
}

async function fetchCandleForActive(interval, limit) {
  const iv  = interval || activeInterval;
  const lim = limit    || activeLimit;
  await fetchCandle(activeCoin, iv, lim);
  drawChart();
}

async function updatePrices() {
  await fetchAllPrices();
  renderAll();
}

async function initData() {
  await fetchAllPrices();
  await fetchCandle(activeCoin);

  for (let i = 0; i < COINS.length; i++) {
    if (!sparkHistory[i] || sparkHistory[i].length < 2) {
      sparkHistory[i] = simulate(COINS[i].price, 12);
    }
  }

  renderAll();

  // WebSocket bağla
  connectWebSocket();
}

function simulate(base, n = 12) {
  const a = [base];
  for (let i = 1; i < n; i++)
    a.push(a[i-1] * (1 + (Math.random() - 0.48) * 0.01));
  return a;
}

function renderAll() {
  buildTable();
  drawChart();
  updateTicker();
  buildOrderBook();
  if (typeof checkAlarms       === 'function') checkAlarms();
  if (typeof applyWatchlistUI  === 'function') applyWatchlistUI();
}
// WebSocket bağlantısı
let ws = null;

function connectWebSocket() {
  const streams = COINS.map(c => {
    const sym = c.sym === 'MATIC' ? 'pol' : c.sym.toLowerCase();
    return `${sym}usdt@ticker`;
  }).join('/');

  ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  ws.onmessage = (event) => {
    const msg  = JSON.parse(event.data);
    const data = msg.data;
    if (!data) return;

    const sym  = data.s.replace('USDT', '');
    const realSym = sym === 'POL' ? 'MATIC' : sym;
    const idx  = COINS.findIndex(c => c.sym === realSym);
    if (idx === -1) return;

    const oldPrice      = COINS[idx].price;
    COINS[idx].price    = parseFloat(data.c);
    COINS[idx].chg      = parseFloat(data.P);

    // Spark güncelle
    if (!sparkHistory[idx]) sparkHistory[idx] = [];
    sparkHistory[idx].push(COINS[idx].price);
    if (sparkHistory[idx].length > 14) sparkHistory[idx].shift();

    renderAll();
  };

  ws.onclose = () => {
    // Bağlantı kopunca 3 saniye sonra yeniden bağlan
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => {
    ws.close();
  };
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