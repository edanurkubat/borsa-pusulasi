# ◈ Borsa Pusulası

Gerçek kripto para borsa verilerini canlı olarak takip eden, sanal bakiye ile alım satım simülasyonu yapılabilen ve portföy yönetimi sunan tam işlevli bir web uygulaması.

---

## 🚀 Özellikler

### 📈 Canlı Piyasa Verileri
- Binance API üzerinden 10 coinin anlık fiyatları, 24s yüksek/düşük/hacim verileri
- Canlı fiyat bandı (ticker) — sürekli kayan
- BTC Dominansı, 24s toplam hacim
- Fear & Greed Index (Korku & Açgözlülük Endeksi)
- Sparkline mini grafikler
- Canvas API ile çizilen alan grafiği (1S / 4S / 1G / 1H zaman dilimleri)

### 📒 Canlı Emir Defteri
- Binance REST API'den 2 saniyede bir güncellenen alış/satış emirleri
- Renk barları ile görselleştirilmiş derinlik gösterimi
- Coin değişince emir defteri de otomatik güncelleniyor

### 💱 Al / Sat Paneli
- Limit, Market ve OCO emir türleri
- %25 / %50 / %75 / %100 hızlı miktar seçimi
- Komisyon hesabı ve sipariş özeti
- Sınırsız sanal bakiye ile güvenli simülasyon

### 💰 Portföy Yönetimi
- Tüm işlemler MongoDB'de kalıcı olarak saklanır
- Anlık kâr/zarar hesabı (güncel Binance fiyatıyla)
- Portföy dağılımını coin değerine göre gösteren Donut grafik
- Portföy değerinin tarihsel değişimini gösteren performans grafiği (MongoDB snapshot)
- CSV dışa aktarma
- PDF rapor indirme (avatar, işlem geçmişi, izleme listesi)
- Tür, coin ve tarihe göre filtreleme & sıralama

### 🔔 Fiyat Alarmları
- Coin ve hedef fiyat belirleyerek alarm kurma
- Tarayıcı Push Notification bildirimi
- E-posta bildirimi (alarm tetiklenince)
- Alarm geçmişi
- Aktif olmayan hesaplar alarm kuramaz

### 🔐 Kimlik Doğrulama & Güvenlik
- JWT tabanlı oturum yönetimi (7 gün geçerli)
- Canvas tabanlı CAPTCHA (giriş ve kayıt)
- bcryptjs ile şifrelenmiş parola saklama
- Şifre kuralları: büyük harf + küçük harf + noktalama zorunlu
- OTP ile e-posta aktivasyonu (10 dakika geçerli)
- 3 denemede 3 saatlik OTP kilidi
- Tek kullanımlık şifre sıfırlama linki (5 dakika geçerli)

### 👤 Profil & Ayarlar
- Avatar yükleme (base64, MongoDB'de saklı)
- Kayıt tarihi MongoDB'den çekiliyor
- Aktivasyon durumu badge olarak gösteriliyor (✓ Aktif / ⚠ Aktif Değil)
- Kullanıcı adı, e-posta, şifre değiştirme
- Karanlık / Aydınlık tema (localStorage'da saklı)
- Hesap silme (şifre doğrulamalı + bildirim maili)

### 📧 E-posta Bildirimleri (Gmail SMTP)
- Giriş bildirimi (her başarılı girişte)
- OTP aktivasyon kodu
- Fiyat alarmı tetiklenince bildirim
- Şifre sıfırlama linki
- Hesap silme bildirimi
- Haftalık portföy özeti (her Pazartesi 09:00, node-cron)

### 🪙 Coin Detay Sayfası
- `coin.html?sym=BTC` formatında her coin için ayrı sayfa
- Binance: 24s yüksek, düşük, hacim, açılış, kapanış
- CoinGecko: piyasa değeri, dolaşımdaki arz, ATH, toplam arz
- 1S / 4S / 1G / 1H / 7G / 30G grafik zaman dilimleri
- İzlemeye ekle / çıkar

### 💱 Döviz & Dönüştürücü
- Coinbase API'den 20 döviz kuru (15 saniyede güncelleniyor)
- Kripto ↔ Fiat dönüştürücü (Binance fiyatlarıyla)

### 📰 Haberler
- Kripto para haberleri ayrı sayfada listeleniyor
- Haber görselleri, kaynak ve tarih bilgisi

---

## 🛠 Kullanılan Teknolojiler

### Frontend
| Teknoloji | Kullanım |
|-----------|----------|
| HTML5 | Sayfa yapısı |
| CSS3 | Tema sistemi, animasyonlar |
| JavaScript ES6+ | Tüm etkileşimler |
| Canvas API | Grafik çizimi (kütüphanesiz) |
| Google Fonts | Space Grotesk + Inter |

### Backend
| Teknoloji | Kullanım |
|-----------|----------|
| Node.js | Çalışma ortamı |
| Express.js | RESTful API |
| MongoDB Atlas | Veritabanı |
| Mongoose | ORM |
| JWT | Kimlik doğrulama |
| bcryptjs | Şifre şifreleme |
| Nodemailer | E-posta gönderimi |
| Multer | Dosya yükleme |
| node-cron | Zamanlı görevler |

### Harici API'ler
| API | Kullanım |
|-----|----------|
| Binance REST API | Fiyat, emir defteri, mum verisi |
| CoinGecko API | Piyasa değeri, arz, ATH |
| Coinbase API | Döviz kurları |
| Alternative.me API | Fear & Greed Index |
| Finnhub API | Kripto haberleri |


## 📁 Klasör Yapısı

```
CanliBorsaTakipSitesi/
├── css/
│ ├── base.css # Global styles, theme variables
│ ├── index.css # Home page styles
│ ├── portfolio.css # Portfolio page styles
│ ├── coin.css # Coin detail page styles
│ └── news.css # News page styles
├── js/
│ ├── auth.js # Login/logout, token, CAPTCHA, theme
│ ├── data.js # Coin data, ticker
│ ├── chart.js # Home page price chart
│ ├── table.js # Market table, sparkline
│ ├── orderbook.js # Live order book
│ ├── trade.js # Buy/Sell form
│ ├── alarm.js # Price alerts
│ ├── portfolio.js # Portfolio, donut chart, performance
│ ├── profile.js # Profile info, OTP, PDF
│ ├── coin.js # Coin detail page
│ ├── forex.js # Currency rates
│ ├── news.js # News
│ └── fear.js # Fear & Greed Index
├── server/
│ ├── models/
│ │ ├── User.js
│ │ ├── Portfolio.js
│ │ └── PortfolioSnapshot.js
│ ├── routes/
│ │ ├── auth.js
│ │ ├── portfolio.js
│ │ ├── watchlist.js
│ │ └── stocks.js
│ ├── middleware/
│ │ └── auth.js
│ ├── scheduler.js
│ └── server.js
├── index.html
├── portfolio.html
├── profile.html
├── settings.html
├── coin.html
├── forex.html
├── converter.html
├── news.html
└── reset-password.html

```
---


## ⚙️ Kurulum

### Gereksinimler
- Node.js v18+
- MongoDB Atlas hesabı
- Gmail hesabı (uygulama şifresi ile)

### 1. Repoyu klonla
```bash
git clone https://github.com/edanurkubat/borsa-pusulasi.git
cd borsa-pusulasi
```

### 2. Bağımlılıkları yükle
```bash
cd server
npm install
```

### 3. `.env` dosyası oluştur
`server/` klasörü içine `.env` dosyası oluştur:
```env
PORT=3000
MONGO_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/borsaDB
JWT_SECRET=gizlianahtar
MAIL_USER=eposta@gmail.com
MAIL_PASS=uygulamasifreniz
FINNHUB_KEY=finnhub_api_anahtariniz
```

### 4. Sunucuyu başlat
```bash
node server.js
```

### 5. Frontend'i başlat
VS Code'da `index.html` dosyasını **Live Server** ile aç.

---

## 🌐 API Endpoint'leri

### Auth
```

POST /api/auth/register
POST /api/auth/login
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/change-password
POST /api/auth/change-username
POST /api/auth/change-email
POST /api/auth/forgot-password-public
POST /api/auth/reset-password
DELETE /api/auth/delete-account
POST /api/auth/upload-avatar
GET /api/auth/avatar
GET /api/auth/me
POST /api/auth/send-alarm
```

### Portföy

```
GET /api/portfolio
POST /api/portfolio/trade
DELETE /api/portfolio/:id
POST /api/portfolio/snapshot
GET /api/portfolio/snapshots
DELETE /api/portfolio/snapshots
```

---

## 👩‍💻 Geliştirici

**Edanur Kubat**
Marmara Üniversitesi — Teknik Bilimler MYO
Bilgisayar Programcılığı — 2026 Bitirme Projesi

---

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

---

> ⚠️ Bu platform yatırım tavsiyesi vermez. Tüm işlemler simülasyon amaçlıdır.

---

# ◈ Borsa Pusulası — English

A full-featured web application that tracks real cryptocurrency exchange data live, allows buy/sell simulation with virtual balance, and provides portfolio management.

---

## 🚀 Features

### 📈 Live Market Data
- Real-time prices for 10 coins via Binance API with 24h high/low/volume data
- Continuously scrolling live price ticker
- BTC Dominance, 24h total volume
- Fear & Greed Index
- Sparkline mini charts
- Canvas API area chart with time frames (1H / 4H / 1D / 1W)

### 📒 Live Order Book
- Buy/sell orders updated every 2 seconds from Binance REST API
- Depth visualization with color bars
- Order book updates automatically when coin changes

### 💱 Buy / Sell Panel
- Limit, Market and OCO order types
- Quick amount selection: 25% / 50% / 75% / 100%
- Commission calculation and order summary
- Safe simulation with unlimited virtual balance

### 💰 Portfolio Management
- All trades stored permanently in MongoDB
- Real-time profit/loss calculation (with live Binance prices)
- Donut chart showing portfolio distribution by coin value
- Performance chart showing historical portfolio value (MongoDB snapshots)
- CSV export
- PDF report download (avatar, trade history, watchlist)
- Filtering & sorting by type, coin and date

### 🔔 Price Alerts
- Set alerts by choosing a coin and target price
- Browser Push Notification
- Email notification when alert triggers
- Alert history
- Unverified accounts cannot set alerts

### 🔐 Authentication & Security
- JWT-based session management (valid for 7 days)
- Canvas-based CAPTCHA (login and register)
- Password hashing with bcryptjs
- Password rules: uppercase + lowercase + punctuation required
- OTP email activation (valid for 10 minutes)
- 3-hour lockout after 3 OTP attempts
- Single-use password reset link (valid for 5 minutes)

### 👤 Profile & Settings
- Avatar upload (base64, stored in MongoDB)
- Registration date fetched from MongoDB
- Activation status shown as badge (✓ Active / ⚠ Not Active)
- Change username, email, password
- Dark / Light theme (stored in localStorage)
- Account deletion (password confirmation + notification email)

### 📧 Email Notifications (Gmail SMTP)
- Login notification (on every successful login)
- OTP activation code
- Price alert trigger notification
- Password reset link
- Account deletion notification
- Weekly portfolio summary (every Monday 09:00, via node-cron)

### 🪙 Coin Detail Page
- Separate page for each coin: `coin.html?sym=BTC`
- Binance: 24h high, low, volume, open, close
- CoinGecko: market cap, circulating supply, ATH, total supply
- Chart time frames: 1H / 4H / 1D / 1W / 7D / 30D
- Add to / remove from watchlist

### 💱 Forex & Converter
- 20 currency rates from Coinbase API (updated every 15 seconds)
- Crypto ↔ Fiat converter (using Binance prices)

### 📰 News
- Crypto news listed on a separate page
- News images, source and date information

---

## 🛠 Technologies Used

### Frontend
| Technology | Usage |
|------------|-------|
| HTML5 | Page structure |
| CSS3 | Theme system, animations |
| JavaScript ES6+ | All interactions |
| Canvas API | Chart drawing (no library) |
| Google Fonts | Space Grotesk + Inter |

### Backend
| Technology | Usage |
|------------|-------|
| Node.js | Runtime environment |
| Express.js | RESTful API |
| MongoDB Atlas | Database |
| Mongoose | ORM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Email delivery |
| Multer | File upload |
| node-cron | Scheduled tasks |

### External APIs
| API | Usage |
|-----|-------|
| Binance REST API | Price, order book, candlestick data |
| CoinGecko API | Market cap, supply, ATH |
| Coinbase API | Currency exchange rates |
| Alternative.me API | Fear & Greed Index |
| Finnhub API | Crypto news |

---
## 📁 Project Structure

```
CanliBorsaTakipSitesi/
├── css/
│ ├── base.css # Global styles, theme variables
│ ├── index.css # Home page styles
│ ├── portfolio.css # Portfolio page styles
│ ├── coin.css # Coin detail page styles
│ └── news.css # News page styles
├── js/
│ ├── auth.js # Login/logout, token, CAPTCHA, theme
│ ├── data.js # Coin data, ticker
│ ├── chart.js # Home page price chart
│ ├── table.js # Market table, sparkline
│ ├── orderbook.js # Live order book
│ ├── trade.js # Buy/Sell form
│ ├── alarm.js # Price alerts
│ ├── portfolio.js # Portfolio, donut chart, performance
│ ├── profile.js # Profile info, OTP, PDF
│ ├── coin.js # Coin detail page
│ ├── forex.js # Currency rates
│ ├── news.js # News
│ └── fear.js # Fear & Greed Index
├── server/
│ ├── models/
│ │ ├── User.js
│ │ ├── Portfolio.js
│ │ └── PortfolioSnapshot.js
│ ├── routes/
│ │ ├── auth.js
│ │ ├── portfolio.js
│ │ ├── watchlist.js
│ │ └── stocks.js
│ ├── middleware/
│ │ └── auth.js
│ ├── scheduler.js
│ └── server.js
├── index.html
├── portfolio.html
├── profile.html
├── settings.html
├── coin.html
├── forex.html
├── converter.html
├── news.html
└── reset-password.html

```
---

## ⚙️ Installation

### Requirements
- Node.js v18+
- MongoDB Atlas account
- Gmail account (with app password)

### 1. Clone the repository
```bash
git clone https://github.com/edanurkubat/borsa-pusulasi.git
cd borsa-pusulasi
```

### 2. Install dependencies
```bash
cd server
npm install
```

### 3. Create `.env` file
Create a `.env` file inside the `server/` folder:
```env
PORT=3000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/borsaDB
JWT_SECRET=yoursecretkey
MAIL_USER=youremail@gmail.com
MAIL_PASS=yourappassword
FINNHUB_KEY=yourfinnhubapikey
```

### 4. Start the server
```bash
node server.js
```

### 5. Start the frontend
Open `index.html` with **Live Server** in VS Code.

---

## 🌐 API Endpoints

### Auth

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/change-password
POST /api/auth/change-username
POST /api/auth/change-email
POST /api/auth/forgot-password-public
POST /api/auth/reset-password
DELETE /api/auth/delete-account
POST /api/auth/upload-avatar
GET /api/auth/avatar
GET /api/auth/me
POST /api/auth/send-alarm
```

### Portfolio

```
GET /api/portfolio
POST /api/portfolio/trade
DELETE /api/portfolio/:id
POST /api/portfolio/snapshot
GET /api/portfolio/snapshots
DELETE /api/portfolio/snapshots
```

---

## 👩‍💻 Developer

**Edanur Kubat**
Marmara University — MYO
Computer Programming — 2026 Graduation Project

---

## 📄 License

This project was developed for educational purposes.

---

> ⚠️ This platform does not provide investment advice. All transactions are for simulation purposes only.


## 📸 Ekran Resimleri/Screenshots

### Ana Sayfa
![Ana Sayfa](screenshots/AnasayfaAllDark.jpg)
![Ana Sayfa](screenshots/AnasayfaAllLight.jpg)

### Portföy/Portfolio
![Portföy](screenshots/portfoy.jpg)

### Döviz/Forex
![Doviz](screenshots/doviz.png)

### Donusturucu/Converter
![Donusturucu](screenshots/donusturucu.png)

### Haberler/News
![Haberler](screenshots/haberler.png)

### Profil/Profile
![Profil](screenshots/aktif-hesap.png)
![Profil](screenshots/aktif-olmayan-hesap.png)

### Coin
![Coin](screenshots/coin-detay.jpg)

### Ayarlar/Settings
![ayarlar](screenshots/ayarlar.png)

### Mailler
![mail](screenshots/haftalik-ozet-mail.png)
![mail](screenshots/alarm-mail.png)
![mail](screenshots/giris-mail.png)
![mail](screenshots/aktivasyon-kod-mail.png)
![mail](screenshots/sifre-sifirlama-mail.png)
![mail](screenshots/mail-hesap-silme.png)

### Diğer/Other
![giris](screenshots/giris.png)
![kayit](screenshots/kayit.png)
![islem engelleme](screenshots/islem-engelleme.png)
![kod-gonderildi](screenshots/kod-gonderildi.png)
![kod-girildi](screenshots/kod-girildi.png)
![pdf-indir](screenshots/pdf-indir.png)
![tablo-indir](screenshots/tablo-indir.png)
![sifre-sifirla](screenshots/sifre-sifirla.png)
