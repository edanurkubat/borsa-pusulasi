/* js/news.js — Kripto haberleri */

async function fetchNews() {
  try {
    const res   = await fetch('http://localhost:3000/api/stocks/news');
    const items = await res.json();
    renderNews(items);
  } catch {
    const list = document.getElementById('newsList');
    if (list) list.innerHTML = '<div class="news-loading">Haberler yüklenemedi</div>';
  }
}

function renderNews(items) {
  const list = document.getElementById('newsList');
  if (!list) return;

  if (!items || !items.length) {
    list.innerHTML = '<div class="news-loading">Haber bulunamadı</div>';
    return;
  }

  list.innerHTML = items.map(item => {
    const date = new Date(item.datetime * 1000).toLocaleDateString('tr-TR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    return `
      <a class="news-item" href="${item.url}" target="_blank" rel="noopener">
        ${item.image ? `<img class="news-img" src="${item.image}" alt="" onerror="this.style.display='none'">` : ''}
        <div class="news-body">
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-date">${date}</span>
          </div>
          <div class="news-title">${item.headline}</div>
        </div>
      </a>`;
  }).join('');

  const timeEl = document.getElementById('newsTime');
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('tr-TR');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchNews();
  setInterval(fetchNews, 5 * 60 * 1000);
});