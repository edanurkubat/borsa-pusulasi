/* js/portfolio.js */

const API = "http://localhost:3000/api";
const BINANCE = "https://api.binance.com/api/v3";

let tradeType = "buy";
let livePrices = {};
let allTrades = [];

const COIN_COLORS = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  BNB: "#f3ba2f",
  ADA: "#0d6cf2",
  AVAX: "#e84142",
  DOT: "#e6007a",
  LINK: "#2a5ada",
  MATIC: "#8247e5",
  XRP: "#00aae4",
};

async function fetchLivePrices() {
  const symbols = [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "ADA",
    "AVAX",
    "DOT",
    "LINK",
    "XRP",
  ];
  for (const sym of symbols) {
    try {
      const res = await fetch(`${BINANCE}/ticker/24hr?symbol=${sym}USDT`);
      const data = await res.json();
      livePrices[sym] = parseFloat(data.lastPrice);
    } catch { }
  }
  try {
    const res = await fetch(`${BINANCE}/ticker/24hr?symbol=POLUSDT`);
    const data = await res.json();
    livePrices["MATIC"] = parseFloat(data.lastPrice);
  } catch { }
}

function checkAuth() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token) {
    document.getElementById("notLoggedIn").style.display = "flex";
    document.getElementById("portfolioContent").style.display = "none";
    return false;
  }
  document.getElementById("userInfo").style.display = "flex";
  document.getElementById("userGreet").textContent = username;
  document.getElementById("authBtns").style.display = "none";
  document.getElementById("notLoggedIn").style.display = "none";
  document.getElementById("portfolioContent").style.display = "block";
  document.getElementById("notLoggedIn").style.display = "none";
  document.getElementById("portfolioContent").style.display = "block";
  return true;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

function setTradeType(type) {
  tradeType = type;
  const buyBtn = document.getElementById("typeBuy");
  const sellBtn = document.getElementById("typeSell");
  buyBtn.classList.remove("active", "buy-active", "sell-active");
  sellBtn.classList.remove("active", "buy-active", "sell-active");
  if (type === "buy") buyBtn.classList.add("active", "buy-active");
  else sellBtn.classList.add("active", "sell-active");
}

function calcTotal() {
  const price = parseFloat(document.getElementById("tradePrice").value) || 0;
  const qty = parseFloat(document.getElementById("tradeQty").value) || 0;
  document.getElementById("tradeTotal").textContent =
    "$" + (price * qty).toFixed(2);
}

async function addTrade() {
  const token = localStorage.getItem("token");

  // ÖNCE giriş kontrolü
  if (!token) {
    showToast("⚠️", "Giriş Gerekli", "İşlem yapabilmek için giriş yapmanız gerekiyor.");
    return;
  }

  // SONRA aktivasyon kontrolü
  if (localStorage.getItem("isVerified") !== "true") {
    showToast("⚠️", "Hesap Aktif Değil", "İşlem yapabilmek için profilinden hesabını aktifleştir.");
    return;
  }

  const select = document.getElementById("tradeSymbol");
  const symbol = select.value;
  const name = select.options[select.selectedIndex].dataset.name;
  const price = parseFloat(document.getElementById("tradePrice").value);
  const qty = parseFloat(document.getElementById("tradeQty").value);

  if (!price || !qty) {
    showToast("⚠️", "Hata", "Fiyat ve miktar gir");
    return;
  }

  try {
    const res = await fetch(`${API}/portfolio/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol,
        name,
        type: tradeType,
        price,
        quantity: qty,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("❌", "Hata", data.error);
      return;
    }
    showToast("✅", "İşlem eklendi", `${qty} ${symbol} @ $${price}`);
    document.getElementById("tradeQty").value = "";
    document.getElementById("tradeTotal").textContent = "$0.00";
    await loadTrades();
  } catch {
    showToast("❌", "Hata", "Bağlantı hatası");
  }
}

async function loadTrades() {
  const token = localStorage.getItem("token");
  try {
    await fetchLivePrices();
    const res = await fetch(`${API}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return;
    renderTrades(data.trades);
    updateSummary(data.trades);
    updateBalance(data.balance, data.lastReset);
  } catch { }
}

function renderTrades(trades) {
  allTrades = trades; // tüm işlemleri sakla
  applyFilters();
}

function applyFilters() {
  const type = document.getElementById("filterType")?.value || "";
  const coin = document.getElementById("filterCoin")?.value || "";
  const sort = document.getElementById("filterSort")?.value || "date_desc";

  let filtered = [...allTrades];
  if (type) filtered = filtered.filter(t => t.type === type);
  if (coin) filtered = filtered.filter(t => t.symbol === coin);

  filtered.sort((a, b) => {
    if (sort === "date_desc") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "date_asc") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "total_desc") return b.total - a.total;
    if (sort === "total_asc") return a.total - b.total;
    return 0;
  });

  const tbody = document.getElementById("tradeBody");
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Henüz işlem yok. Yukarıdan ekleyebilirsin.</td></tr>`;
    document.getElementById("lastUpdate").textContent = "Son güncelleme: " + new Date().toLocaleTimeString("tr-TR");
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const live = livePrices[t.symbol] || t.price;
    const pnl = t.type === "buy"
      ? (live - t.price) * t.quantity
      : (t.price - live) * t.quantity;
    const pnlPct = t.total > 0 ? ((pnl / t.total) * 100).toFixed(2) : "0.00";
    const isPos = pnl >= 0;
    const date = new Date(t.createdAt).toLocaleDateString("tr-TR");

    return `<tr>
      <td><b style="color:var(--text)">${t.symbol}</b> <span style="color:var(--text3);font-size:0.65rem">${t.name}</span></td>
      <td><span class="badge ${t.type}">${t.type === "buy" ? "ALIŞ" : "SATIŞ"}</span></td>
      <td>$${t.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      <td>${t.quantity}</td>
      <td>$${t.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      <td>$${live.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      <td class="${isPos ? "positive" : "negative"}">${isPos ? "▲" : "▼"} $${Math.abs(pnl).toFixed(2)} (${pnlPct}%)</td>
      <td style="color:var(--text3)">${date}</td>
      <td><button class="del-btn" onclick="deleteTrade('${t._id}')">Sil</button></td>
    </tr>`;
  }).join("");

  document.getElementById("lastUpdate").textContent = "Son güncelleme: " + new Date().toLocaleTimeString("tr-TR");
}

function updateSummary(trades) {
  if (!trades.length) {
    document.getElementById("totalValue").textContent = "$0.00";
    document.getElementById("totalPnl").textContent = "$0.00";
    document.getElementById("tradeCount").textContent = "0";
    document.getElementById("topCoin").textContent = "—";
    drawDonut({});
    return;
  }
  let totalVal = 0,
    totalPnl = 0;
  const holdings = {};
  window._holdingVal = {};
  const holdingVal = window._holdingVal;
  trades.forEach((t) => {
    const live = livePrices[t.symbol] || t.price;
    const pnl = t.type === "buy"
      ? (live - t.price) * t.quantity
      : (t.price - live) * t.quantity;
    totalPnl += pnl;

    if (t.type === "buy") {
      const coinVal = live * t.quantity;
      totalVal += coinVal;
      holdings[t.symbol] = (holdings[t.symbol] || 0) + t.quantity;
      holdingVal[t.symbol] = (holdingVal[t.symbol] || 0) + coinVal;
    } else {
      // Satış: toplam değerden ve miktardan çıkar
      const coinVal = live * t.quantity;
      totalVal -= coinVal;
      holdings[t.symbol] = (holdings[t.symbol] || 0) - t.quantity;
      holdingVal[t.symbol] = (holdingVal[t.symbol] || 0) - coinVal;
    }
  });

  // Negatif değerleri temizle
  Object.keys(holdingVal).forEach(k => {
    if (holdingVal[k] <= 0) delete holdingVal[k];
  });
  if (totalVal < 0) totalVal = 0;
  const topCoin = Object.entries(holdings).sort((a, b) => b[1] - a[1])[0];
  const isPos = totalPnl >= 0;
  document.getElementById("totalValue").textContent = "$" + totalVal.toFixed(2);
  document.getElementById("totalPnl").textContent =
    (isPos ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);
  document.getElementById("totalPnl").className =
    "scard-val " + (isPos ? "positive" : "negative");
  document.getElementById("tradeCount").textContent = trades.length;
  document.getElementById("topCoin").textContent = topCoin ? topCoin[0] : "—";
  drawDonut(holdingVal);
  savePortfolioSnapshot(totalVal).then(() => drawPerformanceChart());
}

async function deleteTrade(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/portfolio/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast("🗑️", "Silindi", "İşlem kaldırıldı");
      await loadTrades();
    }
  } catch {
    showToast("❌", "Hata", "Bağlantı hatası");
  }
}

function showToast(ico, title, msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  document.getElementById("toastIco").textContent = ico;
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function drawDonut(holdingVal) {
  setTimeout(() => {
    const canvas = document.getElementById("donutChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth || 220;
    const H = W;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.height = H + "px";
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const entries = Object.entries(holdingVal);
    if (!entries.length) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = document.body.classList.contains('light') ? '#ffffff' : '#0d1117';
      ctx.font = "12px JetBrains Mono";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Veri yok", W / 2, H / 2);
      return;
    }

    const total = entries.reduce((s, [, v]) => s + v, 0);
    const cx = W / 2,
      cy = H / 2;
    const outerR = W * 0.42,
      innerR = W * 0.26;
    let angle = -Math.PI / 2;

    ctx.clearRect(0, 0, W, H);

    // Dilimleri çiz
    entries.forEach(([sym, val]) => {
      const slice = (val / total) * Math.PI * 2;
      const color = COIN_COLORS[sym] || "#445870";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      angle += slice;
    });

    // Yüzde etiketleri — sadece makul boyuttakilere
    angle = -Math.PI / 2;
    entries.forEach(([sym, val]) => {
      const slice = (val / total) * Math.PI * 2;
      const midAngle = angle + slice / 2;
      const pct = ((val / total) * 100).toFixed(1);

      // Sadece %10'dan büyük dilimlere etiket koy
      if (slice > 0.63) {
        // Etiketin dilim içinde kalması için mesafeyi ayarla
        const r = innerR + (outerR - innerR) * 0.5;
        const lx = cx + r * Math.cos(midAngle);
        const ly = cy + r * Math.sin(midAngle);

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${W * 0.048}px JetBrains Mono`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pct + "%", lx, ly);
      }

      angle += slice;
    });

    // İç daire
    const isLight = document.body.classList.contains("light");
    const bgColor = isLight ? "#ffffff" : "#1c2333";
    const textColor = isLight ? "#0f172a" : "#e6edf3";
    const subColor = isLight ? "#94a3b8" : "#5b7494";

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.restore();

    // Ortada toplam
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = textColor;
    ctx.font = `bold ${W * 0.07}px JetBrains Mono`;
    ctx.textAlign = "center";
    ctx.fillText("$" + total.toFixed(0), cx, cy - 6);
    ctx.fillStyle = subColor;
    ctx.font = `${W * 0.048}px JetBrains Mono`;
    ctx.fillText("toplam", cx, cy + 14);

    renderLegend(entries, total);
  }, 100);
}

function renderLegend(entries, total) {
  const legend = document.getElementById("donutLegend");
  if (!legend) return;
  legend.innerHTML = entries
    .map(([sym, val]) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${COIN_COLORS[sym] || "#445870"}"></span>
        <span class="legend-sym">${sym}</span>
        <span class="legend-pct">${((val / total) * 100).toFixed(1)}%</span>
        <span class="legend-val">$${val.toFixed(2)}</span>
      </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.body.classList.add("light");
  document.getElementById("tradePrice").addEventListener("input", calcTotal);
  document.getElementById("tradeQty").addEventListener("input", calcTotal);
  setTradeType("buy");
  // Başlangıçta seçili coinin fiyatını doldur
  const firstSym = document.getElementById("tradeSymbol").value;
  const binFirst = firstSym === "MATIC" ? "POL" : firstSym;
  fetch(`${BINANCE}/ticker/24hr?symbol=${binFirst}USDT`)
    .then((r) => r.json())
    .then((d) => {
      document.getElementById("tradePrice").value = parseFloat(
        d.lastPrice,
      ).toFixed(2);
      calcTotal();
    })
    .catch(() => { });

  // Coin seçince fiyatı otomatik doldur
  document
    .getElementById("tradeSymbol")
    .addEventListener("change", async function () {
      const sym = this.value;
      try {
        const res = await fetch(`${BINANCE}/ticker/24hr?symbol=${sym}USDT`);
        const data = await res.json();
        const price = parseFloat(data.lastPrice).toFixed(2);
        document.getElementById("tradePrice").value = price;
        calcTotal();
      } catch { }
    });
  await fetchLivePrices();
  await loadTrades();
  await drawPerformanceChart()
  window.addEventListener("resize", drawPerformanceChart);
  setInterval(async () => {
    await loadTrades();
  }, 10000);
});

function comingSoon(name) {
  showToast("🚧", name + " Yakında", "Bu özellik geliştirme aşamasında");
}

// Portföy değer geçmişi
async function savePortfolioSnapshot(totalVal) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`${API}/portfolio/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ value: totalVal })
    });
  } catch { }
}
async function drawPerformanceChart() {
  const canvas = document.getElementById("perfChart");
  if (!canvas) return;

  const token = localStorage.getItem('token');
  let history = [];

  try {
    const res = await fetch(`${API}/portfolio/snapshots`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    history = (data.snapshots || []).map(s => ({ t: new Date(s.date).getTime(), v: s.value }));
  } catch { }

  const ctx = canvas.getContext("2d");

  if (history.length < 1) {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = 120 * devicePixelRatio;
    canvas.style.height = "120px";
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.fillStyle = "#5b7494";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Yeterli veri yok — işlem yaptıkça grafik oluşacak", canvas.offsetWidth / 2, 60);
    return;
  }
  // Tek nokta varsa düz çizgi için çift yap
  if (history.length === 1) {
    history = [
      { t: history[0].t - 86400000, v: history[0].v },
      history[0]
    ];
  }

  const W = canvas.offsetWidth, H = 120;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.height = H + "px";
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const values = history.map(h => h.v);
  const times = history.map(h => h.t);
  const min = Math.min(...values) * 0.995;
  const max = Math.max(...values) * 1.005;
  const pad = { t: 8, b: 24, l: 8, r: 8 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const xs = i => pad.l + (i / (values.length - 1)) * cw;
  const ys = v => pad.t + (1 - (v - min) / (max - min)) * ch;
  const isUp = values[values.length - 1] >= values[0];
  const col = isUp ? "#05d78a" : "#f0415a";

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, col + "40");
  grad.addColorStop(1, col + "00");
  ctx.beginPath();
  ctx.moveTo(xs(0), ys(values[0]));
  values.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.lineTo(xs(values.length - 1), H - pad.b);
  ctx.lineTo(xs(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(xs(0), ys(values[0]));
  values.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#5b7494";
  ctx.font = "9px Inter";
  ctx.textAlign = "center";
  const step = Math.floor(values.length / 4);
  [0, step, step * 2, step * 3, values.length - 1].forEach(i => {
    if (i < values.length) {
      const d = new Date(times[i]);
      ctx.fillText(d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }), xs(i), H - pad.b + 14);
    }
  });

  ctx.fillStyle = col;
  ctx.font = "bold 10px Inter";
  ctx.textAlign = "right";
  ctx.fillText("$" + values[values.length - 1].toFixed(0), W - pad.r, pad.t + 10);
}

function exportCSV() {
  if (!allTrades.length) {
    showToast('⚠️', 'Veri yok', 'İndirilecek işlem bulunamadı');
    return;
  }

  const headers = ['Coin', 'Ad', 'Tür', 'Fiyat (USDT)', 'Miktar', 'Toplam (USDT)', 'Güncel Fiyat', 'K/Z (USDT)', 'K/Z (%)', 'Tarih'];
  const lines = [headers.join(';')]; // noktalı virgül — Excel'de Türkçe için daha güvenli

  allTrades.forEach(t => {
    const live = livePrices[t.symbol] || t.price;
    const pnl = t.type === 'buy'
      ? (live - t.price) * t.quantity
      : (t.price - live) * t.quantity;
    const pnlPct = ((pnl / t.total) * 100).toFixed(2);
    const date = new Date(t.createdAt).toLocaleDateString('tr-TR');

    const row = [
      t.symbol,
      t.name,
      t.type === 'buy' ? 'ALIŞ' : 'SATIŞ',
      t.price.toFixed(2).replace('.', ','),
      t.quantity,
      t.total.toFixed(2).replace('.', ','),
      live.toFixed(2).replace('.', ','),
      pnl.toFixed(2).replace('.', ','),
      pnlPct.replace('.', ',') + '%',
      date
    ].map(v => `"${v}"`).join(';');

    lines.push(row);
  });

  const csv = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `borsapusulasi_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('✅', 'CSV İndirildi', 'İşlem geçmişin başarıyla dışa aktarıldı');
}
function updateBalance(balance, lastReset) {
  const balanceEl = document.getElementById('userBalance');
  if (balanceEl) balanceEl.textContent = 'Sınırsız';
  const resetEl = document.getElementById('balanceResetInfo');
  if (resetEl) resetEl.textContent = '';
}