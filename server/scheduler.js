// server/scheduler.js
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const Trade = require("./models/Portfolio");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // IPv4 zorla
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendWeeklyReport(user, trades) {
  if (!trades.length) return;

  let buyTotal = 0,
    sellTotal = 0;
  const coinMap = {};
  trades.forEach((t) => {
    if (t.type === "buy") buyTotal += t.total;
    if (t.type === "sell") sellTotal += t.total;
    coinMap[t.symbol] = (coinMap[t.symbol] || 0) + 1;
  });

  const topCoin = Object.entries(coinMap).sort((a, b) => b[1] - a[1])[0];
  const netPnl = sellTotal - buyTotal;
  const isPos = netPnl >= 0;
  const pnlText = (isPos ? "+$" : "-$") + Math.abs(netPnl).toFixed(2);
  const pnlColor = isPos ? "#059669" : "#dc2626";
  const now = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const recentRows = trades
    .slice(0, 5)
    .map(
      (t) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">${t.symbol}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:${t.type === "buy" ? "#059669" : "#dc2626"};font-weight:700">
        ${t.type === "buy" ? "ALIŞ" : "SATIŞ"}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">$${t.total.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#94a3b8;font-size:0.8rem">
        ${new Date(t.createdAt).toLocaleDateString("tr-TR")}
      </td>
    </tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: `"Borsa Pusulası" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: `📊 Haftalık Portföy Özeti — ${now}`,
    html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:2rem;max-width:520px;margin:0 auto">
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
    
    <div style="background:linear-gradient(135deg,#059669,#0891b2);padding:1.5rem 2rem">
      <div style="font-family:monospace;font-size:1.1rem;font-weight:800;color:#fff;letter-spacing:3px">◈ BORSAPUSULASI</div>
      <div style="color:rgba(255,255,255,0.8);font-size:0.78rem;margin-top:4px">Haftalık Portföy Özeti · ${now}</div>
    </div>

    <div style="padding:2rem;color:#0f172a">
      <p style="margin-bottom:1.5rem;color:#475569">Merhaba <b style="color:#0f172a">${user.username}</b>, bu haftaki portföy özetini hazırladık.</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div style="background:#f1f5f9;border-radius:8px;padding:1rem;text-align:center;border:1px solid #e2e8f0">
          <div style="font-size:1.4rem;font-weight:800;color:#059669">${trades.length}</div>
          <div style="font-size:0.62rem;color:#94a3b8;letter-spacing:1px;margin-top:4px;text-transform:uppercase">İşlem</div>
        </div>
        <div style="background:#f1f5f9;border-radius:8px;padding:1rem;text-align:center;border:1px solid #e2e8f0">
          <div style="font-size:1.4rem;font-weight:800;color:${pnlColor}">${pnlText}</div>
          <div style="font-size:0.62rem;color:#94a3b8;letter-spacing:1px;margin-top:4px;text-transform:uppercase">Net K/Z</div>
        </div>
        <div style="background:#f1f5f9;border-radius:8px;padding:1rem;text-align:center;border:1px solid #e2e8f0">
          <div style="font-size:1.4rem;font-weight:800;color:#d97706">$${buyTotal.toFixed(2)}</div>
        <div style="font-size:0.62rem;color:#94a3b8;letter-spacing:1px;margin-top:4px;text-transform:uppercase">Toplam Harcama</div>
        </div>
        </div>

      ${topCoin
        ? `<p style="color:#475569;font-size:0.82rem;margin-bottom:1.2rem">
        En çok işlem: <b style="color:#059669">${topCoin[0]}</b> (${topCoin[1]} işlem)
      </p>`
        : ""
      }

      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:1rem">
        <div style="padding:0.7rem 1.2rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:0.62rem;letter-spacing:2px;color:#94a3b8;text-transform:uppercase">Son 5 İşlem</div>
        <table style="width:100%;border-collapse:collapse">
          <tbody>${recentRows}</tbody>
        </table>
      </div>
    </div>

    <div style="background:#f1f5f9;padding:0.9rem 2rem;font-size:0.62rem;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0">
      Bu e-posta haftalık otomatik gönderilmektedir · borsapusulasiweb@gmail.com · Yatırım tavsiyesi değildir.
    </div>
  </div>
</div>`,
  });
}

async function runWeeklyReports() {
  try {
    const users = await User.find({ isVerified: true });
    for (const user of users) {
      const trades = await Trade.find({ userId: user._id }).sort({
        createdAt: -1,
      });
      if (!trades.length) continue;
      await sendWeeklyReport(user, trades);
      console.log(`✉️ Haftalık rapor: ${user.email}`);
    }
  } catch (err) {
    console.error("Haftalık rapor hatası:", err.message);
  }
}

cron.schedule(
  "0 9 * * 1",
  () => {
    console.log("📊 Haftalık raporlar gönderiliyor...");
    runWeeklyReports();
  },
  { timezone: "Europe/Istanbul" },
);

console.log("⏰ Haftalık rapor zamanlayıcısı aktif");
module.exports = { runWeeklyReports };

// TEST: hemen gönder (test sonrası sil)
// runWeeklyReports();
