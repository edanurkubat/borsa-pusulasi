/* js/table.js — Piyasa tablosu + sparkline */

function showTableSkeleton() {
  const body = document.getElementById("marketBody");
  if (!body || body.dataset.loaded) return;
  body.innerHTML = Array(5)
    .fill("")
    .map(
      () => `
    <tr>
      <td><div class="skeleton sk-text" style="width:16px"></div></td>
      <td>
        <div class="sk-row" style="padding:0;border:none">
          <div class="skeleton sk-dot"></div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <div class="skeleton sk-text" style="width:40px"></div>
            <div class="skeleton sk-text" style="width:60px;opacity:0.5"></div>
          </div>
        </div>
      </td>
      <td><div class="skeleton sk-text" style="width:70px"></div></td>
      <td><div class="skeleton sk-text" style="width:50px"></div></td>
      <td><div class="skeleton sk-text" style="width:60px"></div></td>
      <td><div class="skeleton sk-text" style="width:50px"></div></td>
      <td><div class="skeleton sk-text" style="width:64px;height:24px"></div></td>
    </tr>
  `,
    )
    .join("");
}

function buildTable() {
  const body = document.getElementById("marketBody");
  if (!body) return;

  if (COINS[0].price === 0) {
    showTableSkeleton();
    return;
  }
  body.dataset.loaded = "true";
  body.innerHTML = "";

  COINS.forEach((c, i) => {
    const isUp = c.chg >= 0;
    const tr = document.createElement("tr");
    tr.onclick = () => {
      window.location.href = `coin.html?sym=${c.sym}`;
    };
    tr.innerHTML = `
      <td style="color:var(--text3)">${i + 1}</td>
      <td>
        <div class="coin-cell">
          <div class="coin-dot" style="background:${c.color}22;color:${c.color}">${c.sym[0]}</div>
          <div>
            <div class="coin-sym">${c.sym}</div>
            <div class="coin-name-sub">${c.name}</div>
          </div>
        </div>
      </td>
      <td>$${c.price.toLocaleString("tr-TR", { minimumFractionDigits: c.price < 1 ? 4 : 2 })}</td>
      <td class="${isUp ? "positive" : "negative"}">${isUp ? "▲" : "▼"} ${Math.abs(c.chg)}%</td>
      <td style="color:var(--text2)">${c.cap}</td>
      <td style="color:var(--text3)">${c.vol}</td>
      <td>
          <div style="display:flex;align-items:center;gap:8px">
          <canvas class="spark" id="spark${i}" width="64" height="24"></canvas>
          <button class="watch-btn ${userWatchlist.includes(c.sym) ? "active" : ""}" id="watch${i}" onclick="toggleWatch('${c.sym}', ${i})">${userWatchlist.includes(c.sym) ? "❤️" : "♡"}</button>
  </div>
</td>`;
    body.appendChild(tr);
    drawSpark(i, isUp);
  });
  if (typeof applyWatchlistUI === "function") applyWatchlistUI();
  if (document.getElementById("lastUpdate"))
    document.getElementById("lastUpdate").textContent =
      new Date().toLocaleTimeString("tr-TR");
}

function drawSpark(i, isUp) {
  const c = document.getElementById("spark" + i);
  if (!c) return;
  const ctx = c.getContext("2d");
  const d = sparkHistory[i];
  const W = 64,
    H = 24;
  c.width = W * devicePixelRatio;
  c.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const mn = Math.min(...d),
    mx = Math.max(...d);
  const xs = (j) => (j / (d.length - 1)) * W;
  const ys = (v) => H - 2 - ((v - mn) / (mx - mn || 1)) * (H - 4);
  const col = isUp ? "#05d78a" : "#f0415a";
  ctx.beginPath();
  d.forEach((v, j) =>
    j === 0 ? ctx.moveTo(xs(j), ys(v)) : ctx.lineTo(xs(j), ys(v)),
  );
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
