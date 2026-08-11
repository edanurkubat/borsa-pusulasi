/* js/auth.js — Giriş/Kayıt işlemleri */

const AUTH_API = 'http://localhost:3000/api/auth';

function openModal(type) {
  const token = localStorage.getItem("token");
  if (token) return;

  document.getElementById("modalOverlay").classList.add("show");
  document.getElementById("authModal").classList.add("show");

  if (type === "login") {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
    setTimeout(() => drawCaptcha('loginCaptchaCanvas'), 50);
  } else {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
    setTimeout(() => drawCaptcha('registerCaptchaCanvas'), 50);
  }
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
  document.getElementById("authModal").classList.remove("show");
}


async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";

  if (!email || !password) { errEl.textContent = "Tüm alanları doldur"; return; }

  if (!verifyCaptcha('loginCaptchaInput')) {
    errEl.textContent = "Güvenlik kodu hatalı";
    drawCaptcha('loginCaptchaCanvas');
    document.getElementById('loginCaptchaInput').value = '';
    return;
  }

  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem('isVerified', data.isVerified);
    closeModal();
    updateAuthUI();
    showToast("✅", "Hoş geldin!", `Merhaba ${data.username}`);
    window.location.reload();
  } catch {
    errEl.textContent = "Bağlantı hatası";
  }
}

async function handleRegister() {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const errEl = document.getElementById("registerError");
  const pwErr = validatePassword(password);
  if (pwErr) { errEl.textContent = pwErr; return; }
  errEl.textContent = "";

  if (!username || !email || !password) { errEl.textContent = "Tüm alanları doldur"; return; }

  if (!verifyCaptcha('registerCaptchaInput')) {
    errEl.textContent = "Güvenlik kodu hatalı";
    drawCaptcha('registerCaptchaCanvas');
    document.getElementById('registerCaptchaInput').value = '';
    return;
  }

  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isVerified');
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("isVerified", data.isVerified);
    closeModal();
    updateAuthUI();
    showToast("✅", "Hesap oluşturuldu!", `Hoş geldin ${data.username}`);
    window.location.reload();
  } catch (err) {
    errEl.textContent = 'Hata: ' + err.message;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("isVerified");
  updateAuthUI();
  // Alarm listelerini hemen temizle
  const alarmList = document.getElementById('alarmList');
  const alarmHistory = document.getElementById('alarmHistory');
  if (alarmList) alarmList.innerHTML = '<div class="alarm-empty">Aktif alarm yok</div>';
  if (alarmHistory) alarmHistory.innerHTML = '<div class="alarm-empty">Henüz tetiklenen alarm yok</div>';
  showToast("👋", "Çıkış yapıldı", "Görüşmek üzere!");
}

function updateAuthUI() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const userInfo = document.getElementById("userInfo");
  const loginBtn = document.querySelector(".header-btn-outline");
  const regBtn = document.querySelector(".header-btn-solid");

  if (token && username) {
    userInfo.style.display = "flex";
    document.getElementById("userGreet").textContent = username;
    const avatarIcon = document.getElementById("userAvatarIcon");
    if (avatarIcon) avatarIcon.textContent = username[0].toUpperCase();
    if (loginBtn) loginBtn.style.display = "none";
    if (regBtn) regBtn.style.display = "none";
    loadHeaderAvatar();
    const availRow = document.getElementById("availRow");
    if (availRow) {
      availRow.innerHTML = `<span style="color:var(--green)">${username}</span> olarak giriş yapıldı`;
    }
    // Giriş sonrası hemen yükle
    setTimeout(() => {
      if (typeof loadWatchlist === 'function') loadWatchlist();
      if (typeof renderAlarms === 'function') renderAlarms();
      if (typeof renderAlarmHistory === 'function') renderAlarmHistory();
    }, 100);
  } else {
    userInfo.style.display = "none";
    if (loginBtn) loginBtn.style.display = "";
    if (regBtn) regBtn.style.display = "";
  }
}

// Sayfa yüklenince auth durumunu kontrol et
document.addEventListener("DOMContentLoaded", updateAuthUI);

// Watchlist işlemleri
async function toggleWatch(symbol, i) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("⚠️", "Giriş gerekli", "İzleme listesi için giriş yap");
    openModal("login");
    return;
  }
  if (localStorage.getItem('isVerified') !== 'true') {
    showToast("⚠️", "Hesap Aktif Değil", "İzleme listesi için profilinden hesabını aktifleştir.");
    return;
  }

  const btn = document.getElementById("watch" + i);
  const isActive = btn.classList.contains("active");
  const endpoint = isActive ? "remove" : "add";
  const method = isActive ? "DELETE" : "POST";

  try {
    const res = await fetch(`http://localhost:3000/api/watchlist/${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol }),
    });
    const data = await res.json();
    if (!res.ok) { showToast("❌", "Hata", data.error); return; }
    btn.classList.toggle("active");
    if (isActive) userWatchlist = userWatchlist.filter((s) => s !== symbol);
    else userWatchlist.push(symbol);
    btn.textContent = isActive ? "♡" : "❤️";
    showToast(
      isActive ? "💔" : "❤️",
      isActive ? "Listeden çıkarıldı" : "Listeye eklendi",
      `${symbol} izleme listesi güncellendi`,
    );
  } catch {
    showToast("❌", "Hata", "Bağlantı hatası");
  }
}
let userWatchlist = [];

async function loadWatchlist() {
  const token = localStorage.getItem("token");
  if (!token) {
    userWatchlist = [];
    applyWatchlistUI();
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/watchlist", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      userWatchlist = [];
    } else {
      userWatchlist = data.watchlist || [];
    }
  } catch {
    userWatchlist = [];
  }
  applyWatchlistUI();
}

function applyWatchlistUI() {
  if (typeof COINS === "undefined") return;
  COINS.forEach((c, i) => {
    const btn = document.getElementById("watch" + i);
    if (!btn) return;
    if (userWatchlist.includes(c.sym)) {
      btn.classList.add("active");
      btn.textContent = "❤️";
    } else {
      btn.classList.remove("active");
      btn.textContent = "♡";
    }
  });
}

// Tema yönetimi
function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  document.getElementById("themeBtn").textContent = isLight ? "☀️" : "🌙";
  // ← timeout ekle, CSS render sonrası çizsin:
  setTimeout(() => {
    if (typeof drawDonut === 'function' && window._holdingVal) {
      drawDonut(window._holdingVal);
    }
  }, 50);
}

function loadTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "light") {
    document.body.classList.add("light");
    const btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = "☀️";
  }
}

document.addEventListener("DOMContentLoaded", loadTheme);

function toggleDropdown() {
  const dropdown = document.getElementById("userDropdown");
  const btn = document.getElementById("userAvatarBtn");
  dropdown.classList.toggle("show");
  btn.classList.toggle("open");
}

// Dışarı tıklayınca kapat
document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".user-dropdown-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("userDropdown")?.classList.remove("show");
    document.getElementById("userAvatarBtn")?.classList.remove("open");
  }
});

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}
// ── CAPTCHA ──
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

let currentCaptcha = '';

function drawCaptcha(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  currentCaptcha = generateCaptcha();

  // Arka plan
  ctx.fillStyle = '#1c2333';
  ctx.fillRect(0, 0, W, H);

  // Gürültü çizgileri
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.lineTo(Math.random() * W, Math.random() * H);
    ctx.strokeStyle = `rgba(5,215,138,${Math.random() * 0.3 + 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Nokta gürültüsü
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
    ctx.fill();
  }

  // Harfler
  const colors = ['#05d78a', '#3d9eff', '#f5c842', '#e6edf3', '#9ab0cc'];
  ctx.font = 'bold 22px JetBrains Mono';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < currentCaptcha.length; i++) {
    ctx.save();
    const x = 14 + i * 26;
    const y = H / 2 + (Math.random() * 6 - 3);
    ctx.translate(x, y);
    ctx.rotate((Math.random() * 0.4) - 0.2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(currentCaptcha[i], 0, 0);
    ctx.restore();
  }
}

function verifyCaptcha(inputId) {
  const val = document.getElementById(inputId)?.value.trim().toUpperCase();
  return val === currentCaptcha;
}
function validatePassword(pw) {
  if (pw.length < 6) return 'En az 6 karakter olmalı';
  if (!/[A-Z]/.test(pw)) return 'En az bir büyük harf içermeli';
  if (!/[a-z]/.test(pw)) return 'En az bir küçük harf içermeli';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'En az bir noktalama işareti içermeli';
  return null;
}
async function loadHeaderAvatar() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('http://localhost:3000/api/auth/avatar', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.avatar) {
      const icon = document.getElementById('userAvatarIcon');
      if (icon) {
        icon.style.backgroundImage = `url(${data.avatar})`;
        icon.style.backgroundSize = 'cover';
        icon.style.backgroundPosition = 'center';
        icon.textContent = '';
      }
    }
  } catch { }
}
async function forgotPasswordPublic() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) {
    document.getElementById('loginError').textContent = 'Önce e-posta adresini gir';
    return;
  }
  try {
    const res = await fetch(`${AUTH_API}/forgot-password-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('loginError').textContent = data.error; return; }
    document.getElementById('loginError').style.color = 'var(--green)';
    document.getElementById('loginError').textContent = '✓ Sıfırlama linki e-postana gönderildi';
  } catch {
    document.getElementById('loginError').textContent = 'Bağlantı hatası';
  }
}