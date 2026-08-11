/* js/trade.js — Al/Sat formu */

let orderType = "limit";
let tradeMode = "buy";

function switchTab(mode) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("⚠️", "Giriş gerekli", "İşlem yapmak için giriş yap");
    openModal("login");
    return;
  }

  tradeMode = mode;
  ["buy", "sell", "stop"].forEach((m) => {
    const el = document.getElementById(
      "tab" + m.charAt(0).toUpperCase() + m.slice(1),
    );
    if (el) el.classList.remove("active");
  });
  const active = document.getElementById(
    "tab" + mode.charAt(0).toUpperCase() + mode.slice(1),
  );
  if (active) active.classList.add("active");
  const btn = document.getElementById("tradeBtn");
  const sym = COINS[activeCoin].sym;
  if (mode === "buy") {
    btn.className = "trade-btn buy-btn";
    btn.textContent = sym + " AL";
  }
  if (mode === "sell") {
    btn.className = "trade-btn sell-btn";
    btn.textContent = sym + " SAT";
  }
  if (mode === "stop") {
    btn.className = "trade-btn";
    btn.style.background = "var(--gold)";
    btn.style.color = "var(--bg)";
    btn.textContent = "STOP EKLE";
  }
}

function setPct(p) {
  document.getElementById("tradeQty").value = ((0.05 * p) / 100).toFixed(4);
  calcSummary();
}

function calcSummary() {
  const price = parseFloat(document.getElementById("tradePrice").value) || 0;
  const qty = parseFloat(document.getElementById("tradeQty").value) || 0;
  const total = price * qty;
  const fee = total * 0.001;
  document.getElementById("sumTotal").textContent =
    total > 0 ? "$" + total.toFixed(2) : "—";
  document.getElementById("sumFee").textContent =
    fee > 0 ? "$" + fee.toFixed(4) : "—";
  document.getElementById("sumNet").textContent =
    total > 0 ? "$" + (total + fee).toFixed(2) : "—";
}

function handleOrderTypeChange(type) {
  const priceInput = document.getElementById("tradePrice");
  const ocoRow = document.getElementById("ocoRow");

  if (type === "market") {
    priceInput.value = COINS[activeCoin].price.toFixed(2);
    priceInput.disabled = true;
    priceInput.style.opacity = "0.5";
    if (ocoRow) ocoRow.style.display = "none";
    calcSummary();
  } else if (type === "oco") {
    priceInput.disabled = false;
    priceInput.style.opacity = "1";
    if (ocoRow) ocoRow.style.display = "flex";
  } else {
    priceInput.disabled = false;
    priceInput.style.opacity = "1";
    if (ocoRow) ocoRow.style.display = "none";
  }
}

async function placeOrder() {
  const token = localStorage.getItem("token");
  // ÖNCE giriş kontrolü
  if (!token) {
    showToast(
      "⚠️",
      "Giriş Gerekli",
      "İşlem yapmak için giriş yapmanız gerekiyor.",
    );
    openModal("login");
    return;
  }
  // SONRA aktivasyon kontrolü
  if (localStorage.getItem("isVerified") !== "true") {
    showToast(
      "⚠️",
      "Hesap Aktif Değil",
      "İşlem yapabilmek için profilinden hesabını aktifleştir.",
    );
    return;
  }

  if (tradeMode === "stop") {
    placeStopOrder();
    return;
  }
  if (orderType === "oco") {
    placeOCO();
    return;
  }

  if (orderType === "market") {
    document.getElementById("tradePrice").value =
      COINS[activeCoin].price.toFixed(2);
  }

  const coin = COINS[activeCoin];
  const price = parseFloat(document.getElementById("tradePrice").value);
  const qty = parseFloat(document.getElementById("tradeQty").value);

  if (!price || !qty || qty <= 0) {
    showToast("⚠️", "Hata", "Geçerli fiyat ve miktar gir");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/portfolio/trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: coin.sym,
        name: coin.name,
        type: tradeMode,
        price: price,
        quantity: qty,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast("❌", "Hata", data.error);
      return;
    }

    const total = (price * qty * 1.001).toFixed(2);
    showToast(
      tradeMode === "buy" ? "✅" : "🔴",
      tradeMode === "buy"
        ? `${coin.sym} Alım Emri Verildi`
        : `${coin.sym} Satım Emri Verildi`,
      `${qty} ${coin.sym} @ $${price.toLocaleString()} — Toplam: $${total}`,
    );

    document.getElementById("tradeQty").value = "";
    calcSummary();
  } catch {
    showToast("❌", "Hata", "Bağlantı hatası");
  }
}

function placeStopOrder() {
  const coin = COINS[activeCoin];
  const price = parseFloat(document.getElementById("tradePrice").value);
  const qty = parseFloat(document.getElementById("tradeQty").value);

  if (!price || !qty) {
    showToast("⚠️", "Hata", "Fiyat ve miktar gir");
    return;
  }

  const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
  alarms.push({
    id: Date.now(),
    sym: coin.sym,
    condition: "below",
    price,
    triggered: false,
    isStop: true,
    qty,
  });
  localStorage.setItem("alarms", JSON.stringify(alarms));
  if (typeof renderAlarms === "function") renderAlarms();

  showToast(
    "🛑",
    "Stop Emri Kuruldu",
    `${coin.sym} $${price.toLocaleString()} altına inerse uyarılacaksın`,
  );
  document.getElementById("tradeQty").value = "";
  calcSummary();
}

function placeOCO() {
  const coin = COINS[activeCoin];
  const stopPrice = parseFloat(document.getElementById("ocoStop").value);
  const takePrice = parseFloat(document.getElementById("ocoTake").value);
  const qty = parseFloat(document.getElementById("tradeQty").value);

  if (!stopPrice || !takePrice || !qty) {
    showToast("⚠️", "Hata", "Stop, kar al fiyatı ve miktar gir");
    return;
  }

  const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
  alarms.push({
    id: Date.now(),
    sym: coin.sym,
    condition: "below",
    price: stopPrice,
    triggered: false,
    isStop: true,
    qty,
  });
  alarms.push({
    id: Date.now() + 1,
    sym: coin.sym,
    condition: "above",
    price: takePrice,
    triggered: false,
    isStop: false,
    qty,
  });
  localStorage.setItem("alarms", JSON.stringify(alarms));
  if (typeof renderAlarms === "function") renderAlarms();

  showToast(
    "🎯",
    "OCO Emri Kuruldu",
    `${coin.sym} — Stop: $${stopPrice.toLocaleString()} | Kar Al: $${takePrice.toLocaleString()}`,
  );
  document.getElementById("tradeQty").value = "";
  document.getElementById("ocoStop").value = "";
  document.getElementById("ocoTake").value = "";
  calcSummary();
}

function comingSoon(name) {
  showToast("🚧", name + " Yakında", "Bu özellik geliştirme aşamasında");
}

function changeTradeCoin(index) {
  const i = parseInt(index);
  const btn = document.querySelectorAll(".ctab")[i];
  if (btn) selectCoin(i, btn);
}
