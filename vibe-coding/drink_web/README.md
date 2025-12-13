# 50嵐 飲料訂購系統 🧋

一個精美的線上飲料訂購網頁，支援團體訂購並自動記錄到 Google Sheets。

![50嵐品牌配色](logo.png)

## 功能特色

- 🎨 **50嵐品牌配色** - 經典黃藍配色搭配品牌 Logo
- 📱 **響應式設計** - 支援手機、平板、電腦
- 🛒 **購物車功能** - 可一次訂購多杯飲料
- ⚙️ **客製化選項** - 甜度、冰塊、容量、數量自由選擇
- 📊 **自動記錄** - 訂單自動儲存到 Google Sheets
- 🚀 **即時回饋** - 訂單編號即時顯示

## 技術架構

| 前端 | 後端 |
|------|------|
| HTML5 + CSS3 + JavaScript | Google Apps Script |
| Fetch API | Google Sheets |

## 快速開始

### 1. 設定 Google Apps Script

1. 開啟 [Google Apps Script](https://script.google.com)
2. 建立新專案，將 `Code.gs` 內容貼入
3. 部署為網頁應用程式（存取權限：任何人）
4. 複製部署後的 URL

### 2. 更新前端 API URL

編輯 `index.html`，找到以下行並替換為你的 URL：

```javascript
const API_URL = 'YOUR_GAS_DEPLOYMENT_URL_HERE';
```

### 3. 部署網頁

可部署到以下平台：
- **GitHub Pages** - 免費託管
- **Netlify** - 一鍵部署
- **任何靜態網站主機**

## 檔案結構

```
drink_web/
├── index.html    # 主網頁（含 CSS + JavaScript）
├── Code.gs       # Google Apps Script 後端
├── logo.png      # 50嵐 Logo
└── README.md     # 專案說明
```

## 菜單分類

| 分類 | 品項數 |
|------|--------|
| 🍵 找好茶 | 14 款 |
| 🧋 找奶茶 | 8 款 |
| 🍋 找新鮮 | 8 款 |
| 🥛 找拿鐵 | 5 款 |
| 🍦 找冰淇淋 | 5 款 |

## 授權

本專案僅供學習與非商業用途。50嵐為註冊商標，相關品牌權利歸原公司所有。

---

Made with ❤️ for bubble tea lovers
