/* js/alarm.js — Fiyat alarmları */

function getAlarmKey() {
  const username = localStorage.getItem('username') || 'guest';
  return `alarms_${username}`;
}

function getHistoryKey() {
  const username = localStorage.getItem('username') || 'guest';
  return `alarmHistory_${username}`;
}

function getAlarms() {
  return JSON.parse(localStorage.getItem(getAlarmKey()) || '[]');
}

function saveAlarms(alarms) {
  localStorage.setItem(getAlarmKey(), JSON.stringify(alarms));
}

let alarms = getAlarms();

function addAlarm() {

   const token = localStorage.getItem('token');
  // ÖNCELİKLE giriş kontrolü
  if (!token) {
    showToast('⚠️', 'Giriş Gerekli', 'Alarm kurmak için giriş yapmanız gerekiyor.');
    return;
  }
  // SONRA aktivasyon kontrolü
  if (localStorage.getItem('isVerified') !== 'true') {
    showToast('⚠️', 'Hesap Aktif Değil', 'Alarm kurmak için profilinden hesabını aktifleştir.');
    return;
  }

  alarms = getAlarms();
  const sym = document.getElementById('alarmSym').value;
  const condition = document.getElementById('alarmCond').value;
  const price = parseFloat(document.getElementById('alarmPrice').value);

  if (!price || price <= 0) {
    showToast('⚠️', 'Hata', 'Geçerli bir fiyat gir');
    return;
  }

  const alarm = { id: Date.now(), sym, condition, price, triggered: false };
  alarms.push(alarm);
  saveAlarms(alarms);
  renderAlarms();
  showToast('🔔', 'Alarm kuruldu', `${sym} ${condition === 'above' ? '▲' : '▼'} $${price.toLocaleString()} alarmı aktif`);
  document.getElementById('alarmPrice').value = '';
}

function deleteAlarm(id) {
  alarms = getAlarms().filter(a => a.id !== id);
  saveAlarms(alarms);
  renderAlarms();
}

function renderAlarms() {
  alarms = getAlarms();
  const list = document.getElementById('alarmList');
  if (!list) return;

  if (!alarms.length) {
    list.innerHTML = `<div class="alarm-empty">Aktif alarm yok</div>`;
    return;
  }

  list.innerHTML = alarms.map(a => `
    <div class="alarm-item ${a.triggered ? 'triggered' : ''}">
      <div class="alarm-info">
        <span class="alarm-sym">${a.sym}</span>
        <span class="alarm-cond">${a.condition === 'above' ? '▲ Üzerine çıkarsa' : '▼ Altına inerse'}</span>
        <span class="alarm-price">$${a.price.toLocaleString()}</span>
      </div>
      <div class="alarm-status">
        ${a.triggered
      ? '<span class="alarm-badge triggered">Tetiklendi</span>'
      : '<span class="alarm-badge active">Aktif</span>'}
        <button class="alarm-del" onclick="deleteAlarm(${a.id})">✕</button>
      </div>
    </div>
  `).join('');
}

function checkAlarms() {
  alarms = getAlarms();
  let updated = false;
  alarms.forEach(a => {
    if (a.triggered) return;
    const coin = COINS.find(c => c.sym === a.sym);
    if (!coin) return;

    const triggered =
      (a.condition === 'above' && coin.price >= a.price) ||
      (a.condition === 'below' && coin.price <= a.price);

    if (triggered) {
      a.triggered = true;
      updated = true;
      showToast(
        '🔔',
        `${a.sym} Alarm!`,
        `${a.sym} $${coin.price.toFixed(2)} — hedef $${a.price.toLocaleString()} ${a.condition === 'above' ? 'aşıldı' : 'altına indi'}`
      );
      if (Notification.permission === 'granted') {
        new Notification(`🔔 ${a.sym} Fiyat Alarmı`, {
          body: `${a.sym} $${coin.price.toFixed(2)} seviyesine ulaştı!`
        });
      }
      saveAlarmHistory({
        sym: a.sym, condition: a.condition, price: a.price,
        triggered: coin.price, time: Date.now()
      });

      // Mail gönder
      sendAlarmMail(a.sym, a.condition, a.price, coin.price);
    }
  });

  if (updated) {
    saveAlarms(alarms);
    renderAlarms();
  }
}

async function sendAlarmMail(symbol, condition, targetPrice, currentPrice) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch('http://localhost:3000/api/auth/send-alarm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ symbol, condition, targetPrice, currentPrice }),
    });
  } catch { }
}
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function saveAlarmHistory(entry) {
  const history = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem(getHistoryKey(), JSON.stringify(history));
  renderAlarmHistory();
}

function renderAlarmHistory() {
  const el = document.getElementById('alarmHistory');
  if (!el) return;
  const history = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
  if (!history.length) {
    el.innerHTML = '<div class="alarm-empty">Henüz tetiklenen alarm yok</div>';
    return;
  }
  el.innerHTML = history.map(h => {
    const date = new Date(h.time).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const isUp = h.condition === 'above';
    return `
      <div class="alarm-history-item">
        <div class="alarm-info">
          <span class="alarm-sym">${h.sym}</span>
          <span class="alarm-cond">${isUp ? '▲' : '▼'} $${h.price.toLocaleString()}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.68rem;color:var(--text2)">$${h.triggered.toFixed(2)}</div>
          <div style="font-size:0.58rem;color:var(--text3)">${date}</div>
        </div>
      </div>`;
  }).join('');
}

function clearAlarmHistory() {
  localStorage.removeItem(getHistoryKey());
  renderAlarmHistory();
}

document.addEventListener('DOMContentLoaded', () => {
  requestNotifPermission();
  renderAlarms();
  renderAlarmHistory();
});