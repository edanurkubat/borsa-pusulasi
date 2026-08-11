// js/orderbook.js — Binance canlı emir defteri

const BINANCE_OB = "https://api.binance.com/api/v3/depth";
let currentObSymbol = "BTCUSDT";
let obInterval = null;

async function fetchOrderBook(symbol = currentObSymbol) {
  try {
    const res = await fetch(`${BINANCE_OB}?symbol=${symbol}&limit=10`);
    const data = await res.json();
    if (!data.asks || !data.bids) return;
    renderOrderBook(data.asks, data.bids, symbol);
  } catch {
    document.getElementById("obAsks").innerHTML = `<div style="color:var(--text3);font-size:0.7rem;padding:0.5rem">Bağlantı hatası</div>`;
  }
}

function renderOrderBook(asks, bids, symbol) {
  const baseAsset = symbol.replace("USDT", "");

  // Asks (satış emirleri) — düşükten yükseğe, ters göster
  const asksSorted = [...asks].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
  const maxAskVol = Math.max(...asks.map(a => parseFloat(a[1])));

  document.getElementById("obAsks").innerHTML = asksSorted.map(([price, qty]) => {
    const p = parseFloat(price);
    const q = parseFloat(qty);
    const pct = (q / maxAskVol) * 100;
    return `
      <div class="ob-row ask-row" style="position:relative">
        <div class="ob-depth-bar" style="position:absolute;right:0;top:0;bottom:0;width:${pct}%;background:rgba(240,65,90,0.08);pointer-events:none"></div>
        <span class="negative">$${p.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
        <span style="color:var(--text2)">${q.toFixed(4)}</span>
        <span style="color:var(--text3)">${(p * q).toFixed(2)}</span>
      </div>`;
  }).join("");

  // Spread
  const bestAsk = parseFloat(asks[0][0]);
  const bestBid = parseFloat(bids[0][0]);
  const spread = bestAsk - bestBid;
  const spreadPct = ((spread / bestAsk) * 100).toFixed(3);
  document.getElementById("obSpread").innerHTML =
    `$${bestBid.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} <span class="positive">▲ %${spreadPct} spread</span>`;

  // Bids (alış emirleri) — yüksekten düşüğe
  const maxBidVol = Math.max(...bids.map(b => parseFloat(b[1])));

  document.getElementById("obBids").innerHTML = bids.map(([price, qty]) => {
    const p = parseFloat(price);
    const q = parseFloat(qty);
    const pct = (q / maxBidVol) * 100;
    return `
      <div class="ob-row bid-row" style="position:relative">
        <div class="ob-depth-bar" style="position:absolute;right:0;top:0;bottom:0;width:${pct}%;background:rgba(5,215,138,0.08);pointer-events:none"></div>
        <span class="positive">$${p.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
        <span style="color:var(--text2)">${q.toFixed(4)}</span>
        <span style="color:var(--text3)">${(p * q).toFixed(2)}</span>
      </div>`;
  }).join("");

  // Başlık güncelle
  const obHead = document.querySelector(".ob-head");
  if (obHead) obHead.innerHTML = `
    <span>Fiyat (USDT)</span>
    <span>Miktar (${baseAsset})</span>
    <span>Toplam</span>`;
}

function updateObSymbol(symbol) {
  // MATIC için Binance'de POL olarak işlem görüyor
  const binanceSymbol = symbol === "MATIC" ? "POLUSDT" : symbol + "USDT";
  currentObSymbol = binanceSymbol;
  fetchOrderBook(binanceSymbol);
}

// İlk yükleme
fetchOrderBook("BTCUSDT");

// Her 10 saniyede güncelle
if (obInterval) clearInterval(obInterval);
obInterval = setInterval(() => fetchOrderBook(currentObSymbol), 10000);
// data.js eski fonksiyon adını çağırıyor
function buildOrderBook() { fetchOrderBook(); }