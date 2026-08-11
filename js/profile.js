/* js/profile.js */

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

const BINANCE = "https://api.binance.com/api/v3";
const API = "http://localhost:3000/api";

let livePrices = {};

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
      livePrices[sym] = {
        price: parseFloat(data.lastPrice),
        chg: parseFloat(data.priceChangePercent),
      };
    } catch {}
  }
  try {
    const res = await fetch(`${BINANCE}/ticker/24hr?symbol=POLUSDT`);
    const data = await res.json();
    livePrices["MATIC"] = {
      price: parseFloat(data.lastPrice),
      chg: parseFloat(data.priceChangePercent),
    };
  } catch {}
}
function checkAuth() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token) {
    document.getElementById("notLoggedIn").style.display = "flex";
    document.getElementById("profileContent").style.display = "none";
    return false;
  }
  document.getElementById("userInfo").style.display = "flex";
  document.getElementById("userGreet").textContent = username;
  document.getElementById("authBtns").style.display = "none";
  document.getElementById("notLoggedIn").style.display = "none";
  document.getElementById("profileContent").style.display = "block";
  document.getElementById("profileAvatar").textContent =
    username[0].toUpperCase();
  document.getElementById("profileName").textContent = username;
  const icon = document.getElementById("userAvatarIcon");
  if (icon) icon.textContent = username[0].toUpperCase();
  return true;
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

async function loadWatchlist() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return;
    const el = document.getElementById("profileWatchlist");
    document.getElementById("pWatchlist").textContent = data.watchlist.length;
    if (!data.watchlist.length) {
      el.innerHTML = `<div class="profile-empty">İzleme listesi boş</div>`;
      return;
    }
    el.innerHTML = data.watchlist
      .map((sym) => {
        const live = livePrices[sym] || { price: 0, chg: 0 };
        const color = COIN_COLORS[sym] || "#445870";
        const isUp = live.chg >= 0;
        return `
        <div class="pw-item">
          <div class="pw-left">
            <div class="pw-dot" style="background:${color}22;color:${color}">${sym[0]}</div>
            <div><div class="pw-sym">${sym}</div></div>
          </div>
          <div style="text-align:right">
            <div class="pw-price">$${live.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
            <div class="pw-chg ${isUp ? "positive" : "negative"}">${isUp ? "▲" : "▼"} ${Math.abs(live.chg).toFixed(2)}%</div>
          </div>
        </div>`;
      })
      .join("");
  } catch {}
}

async function loadTrades() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return;
    const trades = data.trades;

    // Toplam harcanan (sadece alış işlemlerinin toplamı)
    const totalSpent = trades
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + t.total, 0);
    const balanceEl = document.getElementById("pBalance");
    if (balanceEl) {
      balanceEl.textContent =
        "$" + totalSpent.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    }

    document.getElementById("pTrades").textContent = trades.length;
    let totalPnl = 0;
    trades.forEach((t) => {
      const live = livePrices[t.symbol]?.price || t.price;
      const pnl =
        t.type === "buy"
          ? (live - t.price) * t.quantity
          : (t.price - live) * t.quantity;
      totalPnl += pnl;
    });
    const isPos = totalPnl >= 0;
    document.getElementById("pPnl").textContent =
      (isPos ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);
    document.getElementById("pPnl").className =
      "pstat-val " + (isPos ? "positive" : "negative");
    const el = document.getElementById("profileTrades");
    if (!trades.length) {
      el.innerHTML = `<div class="profile-empty">Henüz işlem yok</div>`;
      return;
    }
    el.innerHTML = trades
      .slice(0, 5)
      .map(
        (t) => `
      <div class="pt-item">
        <div class="pt-left">
          <span class="pt-badge ${t.type}">${t.type === "buy" ? "ALIŞ" : "SATIŞ"}</span>
          <div>
            <div class="pt-sym">${t.symbol}</div>
            <div class="pt-date">${new Date(t.createdAt).toLocaleDateString("tr-TR")}</div>
          </div>
        </div>
        <div class="pt-total">$${t.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
      </div>`,
      )
      .join("");
  } catch {}
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

document.addEventListener("DOMContentLoaded", async () => {
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.body.classList.add("light");
  if (!checkAuth()) return;
  loadUserInfo(); // ← ekle
  loadAvatar();
  checkVerification();
  await fetchLivePrices();
  await loadWatchlist();
  await loadTrades();
});

function comingSoon(name) {
  showToast("🚧", name + " Yakında", "Bu özellik geliştirme aşamasında");
}
// Dosyanın en altına ekle:

// Aktivasyon panelini göster/gizle
function checkVerification() {
  const isVerified = localStorage.getItem("isVerified") === "true";
  const panel = document.getElementById("verifyPanel");
  if (panel) panel.style.display = isVerified ? "none" : "block";
}

async function sendOtp() {
  const btn = document.getElementById("sendOtpBtn");
  const msg = document.getElementById("otpMsg");
  btn.disabled = true;
  btn.textContent = "Gönderiliyor...";
  msg.style.color = "var(--text3)";
  msg.textContent = "";

  try {
    const res = await fetch("http://localhost:3000/api/auth/send-otp", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = "var(--green)";
      const remaining = 3 - (data.sendCount || 0);
      msg.textContent = `✓ Kod gönderildi. ${remaining > 0 ? remaining + " hakkın kaldı." : ""}`;
      // cooldown
      let cd = 60;
      const iv = setInterval(() => {
        btn.textContent = `Tekrar Gönder (${cd}s)`;
        if (--cd < 0) {
          clearInterval(iv);
          btn.disabled = false;
          btn.textContent = "Kod Gönder";
        }
      }, 1000);
    } else {
      msg.style.color = "var(--red)";
      msg.textContent = data.message || "Hata oluştu.";
      btn.disabled = false;
      btn.textContent = "Kod Gönder";
    }
  } catch {
    msg.style.color = "var(--red)";
    msg.textContent = "Sunucuya bağlanılamadı.";
    btn.disabled = false;
    btn.textContent = "Kod Gönder";
  }
}

async function verifyOtp() {
  const otp = document.getElementById("otpInput").value.trim();
  const msg = document.getElementById("otpMsg");

  if (otp.length !== 6) {
    msg.style.color = "var(--red)";
    msg.textContent = "6 haneli kodu girin.";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("isVerified", "true");
      msg.style.color = "var(--green)";
      msg.textContent = "✓ Hesabın aktifleştirildi!";
      const badge = document.getElementById("verifiedBadge");
      if (badge) {
        badge.style.display = "inline-block";
        badge.textContent = "✓ Aktif";
        badge.style.background = "var(--green-dim)";
        badge.style.color = "var(--green)";
        badge.style.border = "1px solid rgba(5,215,138,0.3)";
      }
      const panel = document.getElementById("verifyPanel");
      setTimeout(() => {
        if (panel) panel.style.display = "none";
      }, 2000);
    } else {
      msg.style.color = "var(--red)";
      msg.textContent = data.message || "Hatalı kod.";
    }
  } catch {
    msg.style.color = "var(--red)";
    msg.textContent = "Sunucuya bağlanılamadı.";
  }
}

// Profil yüklendiğinde çağır:
checkVerification();

async function downloadProfilePDF() {
  const username = localStorage.getItem("username") || "—";
  const token = localStorage.getItem("token");
  const isVerified = localStorage.getItem("isVerified") === "true";

  // Avatar çek
  let avatarSrc = "";
  try {
    const aRes = await fetch(`${API}/auth/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const aData = await aRes.json();
    if (aData.avatar) avatarSrc = aData.avatar;
  } catch {}

  // Watchlist çek
  let watchlist = [];
  try {
    const wRes = await fetch(`${API}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wData = await wRes.json();
    watchlist = wData.watchlist || [];
  } catch {}

  // Trade ve bakiye çek
  let trades = [];
  let totalPnl = 0;
  try {
    const tRes = await fetch(`${API}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tData = await tRes.json();
    trades = tData.trades || [];
    trades.forEach((t) => {
      const live = livePrices[t.symbol]?.price || t.price;
      const pnl =
        t.type === "buy"
          ? (live - t.price) * t.quantity
          : (t.price - live) * t.quantity;
      totalPnl += pnl;
    });
  } catch {}

  // Toplam harcama — döngü dışında hesapla
  const totalSpent = trades
    .filter((t) => t.type === "buy")
    .reduce((sum, t) => sum + t.total, 0);

  const now = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const pnlColor = totalPnl >= 0 ? "#05d78a" : "#f0415a";
  const pnlText = (totalPnl >= 0 ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);

  const tradesRows = trades.length
    ? trades
        .map(
          (t) => `
    <tr>
      <td>${t.symbol}</td>
      <td style="color:${t.type === "buy" ? "#059669" : "#dc2626"};font-weight:700">${t.type === "buy" ? "ALIŞ" : "SATIŞ"}</td>
      <td>$${t.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      <td>${t.quantity}</td>
      <td>$${t.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      <td>${new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
    </tr>`,
        )
        .join("")
    : '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Henüz işlem yok</td></tr>';

  const watchlistItems = watchlist.length
    ? watchlist
        .map((sym) => {
          const live = livePrices[sym] || { price: 0, chg: 0 };
          return `<span style="display:inline-block;background:rgba(5,215,138,0.12);color:#059669;border:1px solid rgba(5,215,138,0.3);border-radius:6px;padding:4px 12px;font-size:0.8rem;font-weight:700;margin:3px">${sym} — $${live.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>`;
        })
        .join("")
    : '<span style="color:#94a3b8">İzleme listesi boş</span>';

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Borsa Pusulası — ${username} Profil Raporu</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',sans-serif; background:#f8fafc; color:#0f172a; padding:2rem; }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:2rem; padding-bottom:1rem; border-bottom:2px solid #e2e8f0; }
    .logo { font-size:1.4rem; font-weight:800; color:#059669; letter-spacing:2px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:1.2rem; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
    .card-title { font-size:0.65rem; letter-spacing:2px; text-transform:uppercase; color:#94a3b8; font-weight:700; margin-bottom:1rem; }
    .profile-row { display:flex; align-items:center; gap:1.5rem; }
    .avatar { width:60px; height:60px; border-radius:50%; background:rgba(5,215,138,0.12); border:2px solid #059669; display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800; color:#059669; flex-shrink:0; }
    .profile-name { font-size:1.6rem; font-weight:800; color:#0f172a; }
    .profile-meta { font-size:0.75rem; color:#94a3b8; margin-top:4px; }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.2rem; }
    .stat { text-align:center; padding:1rem; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }
    .stat-val { font-size:1.4rem; font-weight:800; margin-bottom:4px; }
    .stat-label { font-size:0.65rem; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    th { padding:8px 12px; text-align:left; font-size:0.6rem; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; border-bottom:1px solid #e2e8f0; }
    td { padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#0f172a; }
    tr:last-child td { border-bottom:none; }
    .footer { text-align:center; margin-top:2rem; font-size:0.65rem; color:#94a3b8; }
    @page { margin:1cm; }
    @media print { body { padding:0.5rem; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">◈ BORSAPUSULASI</div>
    <div style="font-size:0.75rem;color:#94a3b8">${now}</div>
  </div>

  <div class="card">
    <div class="card-title">Kullanıcı Bilgileri</div>
    <div class="profile-row">
      ${
        avatarSrc
          ? `<img src="${avatarSrc}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #059669;flex-shrink:0">`
          : `<div class="avatar">${username[0].toUpperCase()}</div>`
      }
      <div>
        <div class="profile-name">${username}</div>
        <div class="profile-meta">Hesap durumu: ${isVerified ? "✓ Aktif" : "⚠ Aktif Değil"}</div>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-val" style="color:#059669">$${totalSpent.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
      <div class="stat-label">Toplam Harcama</div>
    </div>
    <div class="stat">
      <div class="stat-val" style="color:#059669">${trades.length}</div>
      <div class="stat-label">Toplam İşlem</div>
    </div>
    <div class="stat">
      <div class="stat-val" style="color:${pnlColor}">${pnlText}</div>
      <div class="stat-label">Toplam K/Z</div>
    </div>
    <div class="stat">
      <div class="stat-val" style="color:#059669">${watchlist.length}</div>
      <div class="stat-label">İzleme Listesi</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">❤️ İzleme Listesi</div>
    <div style="margin-top:0.5rem">${watchlistItems}</div>
  </div>

  <div class="card">
    <div class="card-title">📋 İşlem Geçmişi</div>
    <table>
      <thead><tr><th>Coin</th><th>Tür</th><th>Fiyat</th><th>Miktar</th><th>Toplam</th><th>Tarih</th></tr></thead>
      <tbody>${tradesRows}</tbody>
    </table>
  </div>

  <div class="footer">
    Rapor tarihi: ${now} — Bu rapor Borsa Pusulası tarafından otomatik oluşturulmuştur. Yatırım tavsiyesi niteliği taşımaz.
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

async function loadAvatar() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/auth/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.avatar) {
      const el = document.getElementById("profileAvatar");
      el.style.backgroundImage = `url(${data.avatar})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
    }
  } catch {}
}

async function uploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    showToast("⏳", "Yükleniyor", "Resim yükleniyor...");
    const res = await fetch(`${API}/auth/upload-avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("❌", "Hata", data.error);
      return;
    }

    const el = document.getElementById("profileAvatar");
    el.style.backgroundImage = `url(${data.avatar})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.textContent = "";
    showToast("✅", "Avatar güncellendi", "Profil resmin kaydedildi");
  } catch {
    showToast("❌", "Hata", "Yükleme başarısız");
  }
}
async function loadUserInfo() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return;

    // Kayıt tarihi
    const since = new Date(data.createdAt).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    document.getElementById("profileSince").textContent = since;

    // E-posta
    const emailEl = document.getElementById("profileEmail");
    if (emailEl) emailEl.textContent = data.email;

    // Aktivasyon badge
    const badge = document.getElementById("verifiedBadge");
    if (badge) {
      badge.style.display = "inline-block";
      if (data.isVerified) {
        badge.textContent = "✓ Aktif";
        badge.style.background = "var(--green-dim)";
        badge.style.color = "var(--green)";
        badge.style.border = "1px solid rgba(5,215,138,0.3)";
      } else {
        badge.textContent = "⚠ Aktif Değil";
        badge.style.background = "var(--red-dim)";
        badge.style.color = "var(--red)";
        badge.style.border = "1px solid rgba(240,65,90,0.3)";
      }
    }

    // isVerified'ı localStorage ile senkronize et
    localStorage.setItem("isVerified", data.isVerified);
  } catch {}
}
