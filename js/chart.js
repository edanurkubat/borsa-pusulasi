/* js/chart.js — Canvas grafik + hover tooltip */

let tooltipX = -1;

function drawChart() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = chartHistory[activeCoin];
  if (!data || data.length === 0) return;
  const coin = COINS[activeCoin];

  const W = canvas.offsetWidth, H = 260;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.height = H + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { t: 10, b: 36, l: 8, r: 72 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const min = Math.min(...data) * 0.998;
  const max = Math.max(...data) * 1.002;
  const xs = i => pad.l + (i / (data.length - 1)) * cw;
  const ys = v => pad.t + (1 - (v - min) / (max - min)) * ch;
  const isUp = data[data.length - 1] >= data[0];
  const col = isUp ? '#05d78a' : '#f0415a';

  ctx.clearRect(0, 0, W, H);

  // Yatay grid
  ctx.strokeStyle = 'rgba(28,46,69,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }

  // Dikey grid
  const tickCount = 5;
  ctx.strokeStyle = 'rgba(28,46,69,0.4)';
  for (let i = 0; i <= tickCount; i++) {
    const x = pad.l + (cw / tickCount) * i;
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
  }

  // Gradient dolgu
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, col + '40');
  grad.addColorStop(1, col + '00');
  ctx.beginPath();
  ctx.moveTo(xs(0), ys(data[0]));
  data.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.lineTo(xs(data.length - 1), H - pad.b);
  ctx.lineTo(xs(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Çizgi
  ctx.beginPath();
  ctx.moveTo(xs(0), ys(data[0]));
  data.forEach((v, i) => { if (i > 0) ctx.lineTo(xs(i), ys(v)); });
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();

  // Son nokta
  const lx = xs(data.length - 1), ly = ys(data[data.length - 1]);
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = '#060910'; ctx.lineWidth = 2; ctx.stroke();

  // Sağ fiyat etiketleri
  ctx.fillStyle = '#445870';
  ctx.font = `10px JetBrains Mono`;
  ctx.textAlign = 'left';
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) / 4) * (4 - i);
    const y = pad.t + (ch / 4) * i;
    ctx.fillText('$' + v.toLocaleString('tr-TR', { maximumFractionDigits: 0 }), W - pad.r + 6, y + 4);
  }

  // Alt zaman etiketleri
  ctx.fillStyle = '#445870';
  ctx.font = `9px JetBrains Mono`;
  ctx.textAlign = 'center';

  const now = Date.now();
  const total = data.length;
  const msPerCandle = {
    '1m': 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
  }[activeInterval] || 60 * 60 * 1000;
  const totalMs = total * msPerCandle;
  const startMs = now - totalMs;

  for (let i = 0; i <= tickCount; i++) {
    const x = pad.l + (cw / tickCount) * i;
    const tMs = startMs + (totalMs / tickCount) * i;
    const d = new Date(tMs);
    let label = '';
    if (activeInterval === '1m' || activeInterval === '15m') {
      label = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (activeInterval === '1h') {
      label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
        + ' ' + d.getHours() + ':00';
    } else {
      label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    }
    ctx.fillText(label, x, H - pad.b + 16);
  }

  // Hover crosshair
  if (tooltipX >= 0) {
    const idx = Math.round((tooltipX - pad.l) / cw * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      const cx = xs(idx);
      const cy = ys(data[idx]);

      // Dikey çizgi
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(100,150,200,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, pad.t); ctx.lineTo(cx, H - pad.b); ctx.stroke();

      // Yatay çizgi
      ctx.beginPath(); ctx.moveTo(pad.l, cy); ctx.lineTo(W - pad.r, cy); ctx.stroke();
      ctx.setLineDash([]);

      // Nokta
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      // Tooltip kutusu
      const price = data[idx];
      const tMs = startMs + (idx / (data.length - 1)) * totalMs;
      const dateStr = new Date(tMs).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
      const label = `$${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}  ${dateStr}`;

      ctx.font = `bold 11px JetBrains Mono`;
      const tw = ctx.measureText(label).width + 20;
      let tx = cx + 10;
      if (tx + tw > W - pad.r) tx = cx - tw - 10;

      ctx.fillStyle = 'rgba(15,23,36,0.9)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, cy - 18, tw, 24, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#dce8ff';
      ctx.textAlign = 'left';
      ctx.fillText(label, tx + 10, cy - 1);
    }
  }

  // Header güncelle
  const priceEl = document.getElementById('ciPrice');
  priceEl.classList.remove('loading');
  priceEl.textContent = '$' + coin.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  const high = Math.max(...data);
  const low = Math.min(...data);
  document.getElementById('ciMeta').innerHTML =
    `${coin.name} &nbsp;•&nbsp; H: $${high.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} &nbsp; L: $${low.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

function initChartHover() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    tooltipX = e.clientX - rect.left;
    drawChart();
  });

  canvas.addEventListener('mouseleave', () => {
    tooltipX = -1;
    drawChart();
  });
}

function selectCoin(i, btn) {
  activeCoin = i;
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tradeUnit').textContent = COINS[i].sym;
  document.getElementById('tradePrice').value = COINS[i].price.toFixed(2);
  document.getElementById('tradeBtn').textContent = COINS[i].sym + ' AL';
  if (typeof updateObSymbol === 'function') updateObSymbol(COINS[i].sym); // ← idx değil i
  calcSummary();
  fetchCandleForActive();
}
function updateTicker() {
  COINS.forEach((c, i) => {
    const priceEl = document.getElementById('t' + i);
    const chgEl = document.getElementById('tc' + i);
    if (priceEl) priceEl.textContent = '$' + c.price.toLocaleString('tr-TR', { minimumFractionDigits: c.price < 1 ? 4 : 2 });
    if (chgEl) {
      chgEl.textContent = (c.chg >= 0 ? '▲' : '▼') + Math.abs(c.chg) + '%';
      chgEl.className = 'ti-chg ' + (c.chg >= 0 ? 'up' : 'dn');
    }
  });
}