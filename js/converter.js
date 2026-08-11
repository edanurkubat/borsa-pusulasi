/* js/converter.js */

const BINANCE = 'https://api.binance.com/api/v3';

const COINS = ['BTC','ETH','SOL','BNB','ADA','AVAX','DOT','LINK','MATIC','XRP'];
const COIN_NAMES = {
  BTC:'Bitcoin', ETH:'Ethereum', SOL:'Solana', BNB:'BNB',
  ADA:'Cardano', AVAX:'Avalanche', DOT:'Polkadot', LINK:'Chainlink',
  MATIC:'Polygon', XRP:'XRP', USDT:'Tether'
};
const COIN_COLORS = {
  BTC:'#f7931a', ETH:'#627eea', SOL:'#9945ff', BNB:'#f3ba2f',
  ADA:'#0d6cf2', AVAX:'#e84142', DOT:'#e6007a', LINK:'#2a5ada',
  MATIC:'#8247e5', XRP:'#00aae4', USDT:'#26a17b'
};

let prices = {}; // USDT cinsinden fiyatlar

async function fetchPrices() {
  prices['USDT'] = 1;
  for (const sym of COINS) {
    try {
      const binSym = sym === 'MATIC' ? 'POL' : sym;
      const res    = await fetch(`${BINANCE}/ticker/24hr?symbol=${binSym}USDT`);
      const data   = await res.json();
      prices[sym]  = {
        price: parseFloat(data.lastPrice),
        chg:   parseFloat(data.priceChangePercent)
      };
    } catch {}
  }
  convert();
  buildRateTable();
  document.getElementById('rateUpdate').textContent =
    'Güncellendi: ' + new Date().toLocaleTimeString('tr-TR');
}

function getPrice(sym) {
  if (sym === 'USDT') return 1;
  return prices[sym]?.price || 0;
}

function convert() {
  const amount = parseFloat(document.getElementById('convAmount').value) || 0;
  const from   = document.getElementById('convFrom').value;
  const to     = document.getElementById('convTo').value;

  const fromPrice = getPrice(from);
  const toPrice   = getPrice(to);

  if (!fromPrice || !toPrice) {
    document.getElementById('convResult').textContent = '—';
    return;
  }

  const usdtValue = amount * fromPrice;
  const result    = usdtValue / toPrice;

  // Ondalık basamak sayısını akıllıca belirle
  const decimals = result < 0.001 ? 8 : result < 1 ? 6 : result < 1000 ? 4 : 2;

  document.getElementById('convResult').textContent =
    result.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' ' + to;

  // Kur bilgisi
  const rate = fromPrice / toPrice;
  const rateDecimals = rate < 0.001 ? 8 : rate < 1 ? 6 : rate < 1000 ? 4 : 2;
  document.getElementById('convRate').textContent =
    `1 ${from} = ${rate.toLocaleString('tr-TR', { minimumFractionDigits: rateDecimals, maximumFractionDigits: rateDecimals })} ${to}`;
}

function swapCoins() {
  const from = document.getElementById('convFrom').value;
  const to   = document.getElementById('convTo').value;
  document.getElementById('convFrom').value = to;
  document.getElementById('convTo').value   = from;
  convert();
}

function buildRateTable() {
  const body = document.getElementById('rateBody');
  if (!body) return;

  const btcPrice  = getPrice('BTC');
  const ethPrice  = getPrice('ETH');

  body.innerHTML = COINS.map(sym => {
    const p     = prices[sym];
    if (!p) return '';
    const isPos = p.chg >= 0;
    const btcEq = btcPrice ? (p.price / btcPrice).toFixed(8) : '—';
    const ethEq = ethPrice ? (p.price / ethPrice).toFixed(6) : '—';
    const color = COIN_COLORS[sym] || '#445870';

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:0.6rem">
          <div style="width:28px;height:28px;border-radius:50%;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700">${sym[0]}</div>
          <div>
            <div style="font-weight:700;color:var(--text)">${sym}</div>
            <div style="font-size:0.6rem;color:var(--text3)">${COIN_NAMES[sym]}</div>
          </div>
        </div>
      </td>
      <td style="font-family:var(--mono)">$${p.price.toLocaleString('tr-TR',{minimumFractionDigits:p.price<1?4:2})}</td>
      <td style="font-family:var(--mono);color:var(--text2)">${btcEq}</td>
      <td style="font-family:var(--mono);color:var(--text2)">${ethEq}</td>
      <td class="${isPos?'positive':'negative'}">${isPos?'▲':'▼'} ${Math.abs(p.chg).toFixed(2)}%</td>
    </tr>`;
  }).join('');
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

function comingSoon(name) {
  showToast('🚧', name+' Yakında', 'Bu özellik geliştirme aşamasında');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'light') document.body.classList.add('light');

  await fetchPrices();
  setInterval(fetchPrices, 30000); // 30 saniyede bir güncelle
});