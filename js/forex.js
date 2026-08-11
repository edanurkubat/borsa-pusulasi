// js/forex.js — Canlı döviz kurları


const FOREX_API = "https://api.coinbase.com/v2/exchange-rates?currency=";

const CURRENCIES = {
  USD: { flag: "🇺🇸", name: "Amerikan Doları" },
  EUR: { flag: "🇪🇺", name: "Euro" },
  TRY: { flag: "🇹🇷", name: "Türk Lirası" },
  GBP: { flag: "🇬🇧", name: "İngiliz Sterlini" },
  JPY: { flag: "🇯🇵", name: "Japon Yeni" },
  CHF: { flag: "🇨🇭", name: "İsviçre Frangı" },
  CAD: { flag: "🇨🇦", name: "Kanada Doları" },
  AUD: { flag: "🇦🇺", name: "Avustralya Doları" },
  CNY: { flag: "🇨🇳", name: "Çin Yuanı" },
  RUB: { flag: "🇷🇺", name: "Rus Rublesi" },
  SAR: { flag: "🇸🇦", name: "Suudi Riyali" },
  AED: { flag: "🇦🇪", name: "BAE Dirhemi" },
  KWD: { flag: "🇰🇼", name: "Kuveyt Dinarı" },
  NOK: { flag: "🇳🇴", name: "Norveç Kronu" },
  SEK: { flag: "🇸🇪", name: "İsveç Kronu" },
  DKK: { flag: "🇩🇰", name: "Danimarka Kronu" },
  SGD: { flag: "🇸🇬", name: "Singapur Doları" },
  HKD: { flag: "🇭🇰", name: "Hong Kong Doları" },
  NZD: { flag: "🇳🇿", name: "Yeni Zelanda Doları" },
  MXN: { flag: "🇲🇽", name: "Meksika Pesosu" },
};

const CARD_CURRENCIES = ["TRY", "EUR", "GBP", "JPY", "CHF"];

let rates = {};
let baseCurrency = "USD";
let activePair = "TRY";
let activeDays = "7";
let prevRates = {};

// ── VERİ ÇEK ──
async function fetchRates(base = "USD") {
  try {
    const res = await fetch(FOREX_API + base);
    const data = await res.json();
    if (!data.data?.rates) throw new Error("API hatası");
    prevRates = { ...rates };
    // Coinbase string döndürüyor, float'a çevir
    rates = {};
    Object.entries(data.data.rates).forEach(([k, v]) => {
      rates[k] = parseFloat(v);
    });
    baseCurrency = base;
    document.getElementById("forexUpdate").textContent =
      "Güncellendi: " + new Date().toLocaleTimeString("tr-TR");
    document.getElementById("tableBase").textContent = "Baz: " + base;
    renderCards();
    renderTable();
    forexConvert();
  } catch (e) {
    document.getElementById("forexUpdate").textContent = "Bağlantı hatası";
  }
}

// ── KUR KARTLARI ──
function renderCards() {
  const container = document.getElementById("forexCards");
  container.innerHTML = "";

  CARD_CURRENCIES.forEach((code) => {
    if (code === baseCurrency) return;
    const rate = rates[code];
    if (!rate) return;
    const prev = prevRates[code];
    const chg = prev ? ((rate - prev) / prev) * 100 : 0;
    const isUp = chg >= 0;

    // Kart
    const card = document.createElement("div");
    card.className = "forex-card" + (code === activePair ? " active" : "");
    card.onclick = () => selectPair(code);
    card.innerHTML = `
      <span class="forex-card-flag">${CURRENCIES[code]?.flag || "🌐"}</span>
      <span class="forex-card-code">${baseCurrency}/${code}</span>
      <span class="forex-card-rate">${formatRate(rate, code)}</span>
      <span class="forex-card-chg ${isUp ? "up" : "dn"}">
        ${isUp ? "▲" : "▼"} ${Math.abs(chg).toFixed(3)}%
      </span>`;
    container.appendChild(card);
  });
}

// ── TABLO ──
function renderTable() {
  const tbody = document.getElementById("forexTableBody");
  tbody.innerHTML = "";

  Object.entries(CURRENCIES).forEach(([code, info]) => {
    if (code === baseCurrency) return;
    const rate = rates[code];
    if (!rate) return;
    const prev = prevRates[code];
    const chg = prev ? ((rate - prev) / prev) * 100 : 0;
    const isUp = chg >= 0;

    // Simüle min/max (gerçek tarihsel veri için ücretli API gerekir)
    const spread = rate * 0.015;
    const low = (rate - spread * Math.random()).toFixed(4);
    const high = (rate + spread * Math.random()).toFixed(4);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="forex-flag-cell">
          <span class="forex-flag">${info.flag}</span>
          <div>
            <div class="forex-code">${code}</div>
            <div class="forex-name">${info.name}</div>
          </div>
        </div>
      </td>
      <td style="font-family:var(--mono);font-weight:700">${formatRate(rate, code)}</td>
      <td style="color:${isUp ? "var(--green)" : "var(--red)"}; font-weight:700">
        ${isUp ? "▲" : "▼"} ${Math.abs(chg).toFixed(3)}%
      </td>
      <td style="font-family:var(--mono);color:var(--text2)">${low}</td>
      <td style="font-family:var(--mono);color:var(--text2)">${high}</td>
      <td style="color:var(--text3);font-size:0.68rem">${new Date().toLocaleTimeString("tr-TR")}</td>`;
    tbody.appendChild(tr);
  });
}

// ── ÇEVİRİCİ ──
function forexConvert() {
  const amount = parseFloat(document.getElementById("fconvAmount").value) || 0;
  const from = document.getElementById("fconvFrom").value;
  const to = document.getElementById("fconvTo").value;

  if (!rates[from] || !rates[to]) {
    document.getElementById("fconvResult").textContent = "—";
    return;
  }

  // rates hepsi baseCurrency cinsinden
  // from -> base -> to
  const inBase = amount / rates[from];
  const result = inBase * rates[to];

  document.getElementById("fconvResult").textContent =
    formatRate(result, to) + " " + to;
  document.getElementById("fconvRate").textContent =
    `1 ${from} = ${formatRate(rates[to] / rates[from], to)} ${to}`;
}

function swapForex() {
  const from = document.getElementById("fconvFrom");
  const to = document.getElementById("fconvTo");
  [from.value, to.value] = [to.value, from.value];
  forexConvert();
}

// ── YARDIMCILAR ──
function formatRate(val, code) {
  if (!val) return "—";
  if (code === "JPY" || code === "RUB" || code === "TRY") {
    return val >= 100 ? val.toFixed(2) : val.toFixed(4);
  }
  return val.toFixed(4);
}

function changeBase(base) {
  baseCurrency = base;
  fetchRates(base);
}

fetchRates("USD");

// Her 60 saniyede güncelle
setInterval(() => fetchRates(baseCurrency), 15000);
