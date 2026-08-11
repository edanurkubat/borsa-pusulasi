/* js/settings.js */

const API = 'http://localhost:3000/api';

function checkAuth() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (!token) {
    document.getElementById('notLoggedIn').style.display = 'flex';
    document.getElementById('settingsContent').style.display = 'none';
    return false;
  }

  document.getElementById('userInfo').style.display = 'flex';
  document.getElementById('userGreet').textContent = username;
  document.getElementById('authBtns').style.display = 'none';
  document.getElementById('notLoggedIn').style.display = 'none';
  document.getElementById('settingsContent').style.display = 'block';

  const icon = document.getElementById('userAvatarIcon');
  if (icon) icon.textContent = username[0].toUpperCase();

  document.getElementById('settingsAvatar').textContent = username[0].toUpperCase();
  document.getElementById('settingsUsername').textContent = username;
  document.getElementById('currentUsernameDisplay').value = username;

  return true;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

function showSection(name) {
  // Tüm kartları gizle
  document.querySelectorAll('.settings-card').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'));

  // Seçileni göster
  document.getElementById(`section-${name}`).style.display = 'block';
  document.getElementById(`nav-${name}`).classList.add('active');
}

// Tema
function setTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  localStorage.setItem('theme', theme);
  updateThemeBtns();
  showToast('🎨', 'Tema değiştirildi', theme === 'light' ? 'Aydınlık mod aktif' : 'Karanlık mod aktif');
}

function updateThemeBtns() {
  const isLight = document.body.classList.contains('light');
  document.getElementById('darkThemeBtn')?.classList.toggle('active', !isLight);
  document.getElementById('lightThemeBtn')?.classList.toggle('active', isLight);
}

// Şifre değiştir
async function changePassword() {
  const token = localStorage.getItem('token');
  const current = document.getElementById('currentPassword').value;
  const newPw = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const errEl = document.getElementById('passwordError');
  const pwErr = validatePassword(newPw);
  if (pwErr) { errEl.textContent = pwErr; return; }
  errEl.textContent = '';

  if (!current || !newPw || !confirm) { errEl.textContent = 'Tüm alanları doldur'; return; }
  if (newPw.length < 6) { errEl.textContent = 'Yeni şifre en az 6 karakter olmalı'; return; }
  if (newPw !== confirm) { errEl.textContent = 'Şifreler eşleşmiyor'; return; }

  try {
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }

    showToast('✅', 'Şifre güncellendi', 'Şifreni başarıyla değiştirdin');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch { errEl.textContent = 'Bağlantı hatası'; }
}

// Kullanıcı adı değiştir
async function changeUsername() {
  const token = localStorage.getItem('token');
  const username = document.getElementById('newUsername').value.trim();
  const errEl = document.getElementById('usernameError');
  errEl.textContent = '';

  if (!username) { errEl.textContent = 'Kullanıcı adı gir'; return; }
  if (username.length < 3) { errEl.textContent = 'En az 3 karakter olmalı'; return; }

  try {
    const res = await fetch(`${API}/auth/change-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }

    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);

    showToast('✅', 'Kullanıcı adı güncellendi', `Artık ${data.username} olarak görünüyorsun`);
    document.getElementById('settingsAvatar').textContent = data.username[0].toUpperCase();
    document.getElementById('settingsUsername').textContent = data.username;
    document.getElementById('currentUsernameDisplay').value = data.username;
    document.getElementById('userGreet').textContent = data.username;
    document.getElementById('userAvatarIcon').textContent = data.username[0].toUpperCase();
    document.getElementById('newUsername').value = '';
  } catch { errEl.textContent = 'Bağlantı hatası'; }
}


function showToast(ico, title, msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastIco').textContent = ico;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function comingSoon(name) {
  showToast('🚧', name + ' Yakında', 'Bu özellik geliştirme aşamasında');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  loadSettingsAvatar();

  const theme = localStorage.getItem('theme');
  if (theme === 'light') document.body.classList.add('light');
  updateThemeBtns();
});
// E-posta değiştir
async function changeEmail() {
  const token = localStorage.getItem('token');
  const newEmail = document.getElementById('newEmail').value.trim();
  const password = document.getElementById('emailChangePassword').value;
  const errEl = document.getElementById('emailError');
  errEl.textContent = '';

  if (!newEmail || !password) { errEl.textContent = 'Tüm alanları doldur'; return; }

  try {
    const res = await fetch(`${API}/auth/change-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    localStorage.setItem('isVerified', 'false');
    showToast('✅', 'E-posta güncellendi', 'Hesabını yeniden aktifleştirmen gerekiyor');
    document.getElementById('newEmail').value = '';
    document.getElementById('emailChangePassword').value = '';
  } catch { errEl.textContent = 'Bağlantı hatası'; }
}

// Şifremi unuttum
async function forgotPassword() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌', 'Hata', data.error); return; }
    showToast('✅', 'Mail gönderildi', 'Şifre sıfırlama linki e-postana iletildi');
  } catch { showToast('❌', 'Hata', 'Bağlantı hatası'); }
}
// Hesap sil — şifre doğrulamalı
async function deleteAccount() {
  const token = localStorage.getItem('token');
  const password = document.getElementById('deletePassword').value;
  const errEl = document.getElementById('deleteError');
  errEl.textContent = '';

  if (!password) { errEl.textContent = 'Şifrenizi girin'; return; }

  try {
    const res = await fetch(`${API}/auth/delete-account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    localStorage.clear();
    window.location.href = 'index.html';
  } catch { showToast('❌', 'Hata', 'Bağlantı hatası'); }
}
async function loadSettingsAvatar() {
  const token = localStorage.getItem('token');
  const preview = document.getElementById('avatarPreview');
  const sidebarAvatar = document.getElementById('settingsAvatar');
  const username = localStorage.getItem('username') || '?';
  if (preview) preview.textContent = username[0].toUpperCase();

  try {
    const res = await fetch(`${API}/auth/avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.avatar) {
      if (preview) {
        preview.style.backgroundImage = `url(${data.avatar})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
        preview.textContent = '';
      }
      // Sidebar avatar'ı da güncelle
      if (sidebarAvatar) {
        sidebarAvatar.style.backgroundImage = `url(${data.avatar})`;
        sidebarAvatar.style.backgroundSize = 'cover';
        sidebarAvatar.style.backgroundPosition = 'center';
        sidebarAvatar.textContent = '';
      }
    }
  } catch { }
}

async function previewAndUploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const errEl = document.getElementById('avatarError');
  const sucEl = document.getElementById('avatarSuccess');
  errEl.textContent = '';
  sucEl.textContent = '';

  if (file.size > 2 * 1024 * 1024) { errEl.textContent = 'Dosya 2MB\'dan büyük olamaz'; return; }

  // Önizleme
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('avatarPreview');
    preview.style.backgroundImage = `url(${e.target.result})`;
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    preview.textContent = '';
  };
  reader.readAsDataURL(file);

  // Yükle
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    sucEl.textContent = 'Yükleniyor...';
    const res = await fetch(`${API}/auth/upload-avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; sucEl.textContent = ''; return; }

    sucEl.textContent = '✓ Profil resmi güncellendi';
    const sidebarAvatar = document.getElementById('settingsAvatar');
    if (sidebarAvatar) {
      sidebarAvatar.style.backgroundImage = `url(${data.avatar})`;
      sidebarAvatar.style.backgroundSize = 'cover';
      sidebarAvatar.style.backgroundPosition = 'center';
      sidebarAvatar.textContent = '';
    }
    // Header ikonunu da güncelle
    const icon = document.getElementById('userAvatarIcon');
    if (icon) {
      icon.style.backgroundImage = `url(${data.avatar})`;
      icon.style.backgroundSize = 'cover';
      icon.style.backgroundPosition = 'center';
      icon.textContent = '';
    }
    showToast('✅', 'Avatar güncellendi', 'Profil resmin kaydedildi');
  } catch { errEl.textContent = 'Yükleme başarısız'; sucEl.textContent = ''; }
}