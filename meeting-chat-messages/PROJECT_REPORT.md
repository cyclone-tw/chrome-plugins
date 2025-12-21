# Meet Chat Logger Pro - 專案開發報告

## 1. 專案概述

**Meet Chat Logger Pro** 是一個 Chrome 擴充套件，用於即時擷取、儲存和匯出 Google Meet 會議中的聊天訊息。解決了 Google Meet 聊天紀錄在會議結束後無法保留的問題。

### 主要功能

| 功能 | 說明 |
|------|------|
| 即時監聽 | 使用 MutationObserver 監聽 DOM 變化，即時擷取新訊息 |
| 本機儲存 | 使用 Chrome Storage API 即時儲存訊息 |
| 多格式匯出 | 支援 Markdown 和 CSV 格式下載 |
| 剪貼簿複製 | 一鍵複製所有訊息內容 |
| 雲端上傳 | 整合 Google Drive API（OAuth 2.0 認證） |
| 深色主題 UI | 現代化設計，使用漸層和玻璃擬態效果 |

---

## 2. 技術架構

### 技術棧

| 層級 | 技術 |
|------|------|
| **前端框架** | React 18 + TypeScript |
| **建置工具** | Vite |
| **擴充套件規範** | Chrome Extension Manifest V3 |
| **樣式** | Pure CSS (Dark Theme) |
| **狀態管理** | Chrome Storage API |
| **認證** | Google OAuth 2.0 |
| **雲端整合** | Google Drive API |

### 專案結構

```
meeting-chat-messages/
├── src/
│   ├── background/        # Service Worker (OAuth, 下載, Drive)
│   ├── content/           # Content Script (MutationObserver, Parser)
│   ├── popup/             # Popup UI (React 元件)
│   ├── shared/            # 共用型別和常數
│   └── utils/             # 工具函數 (Storage, Formatter)
├── public/                # 圖示資源
├── manifest.json          # 擴充套件配置
└── dist/                  # 建置輸出
```

### 架構流程圖

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Popup UI  │────▶│  Background  │────▶│ Google Drive│
│   (React)   │     │  (Service    │     │    API      │
└─────────────┘     │   Worker)    │     └─────────────┘
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Chrome     │
                    │   Storage    │
                    └──────────────┘
                           ▲
                           │
┌─────────────┐     ┌──────────────┐
│ Google Meet │────▶│   Content    │
│    DOM      │     │   Script     │
└─────────────┘     │(MutationObs) │
                    └──────────────┘
```

---

## 3. 部署方式

### 開發者安裝

```bash
# 1. Clone 專案
git clone https://github.com/cyclone-tw/chrome-plugins.git
cd chrome-plugins/meeting-chat-messages

# 2. 安裝依賴
npm install

# 3. 建置
npm run build

# 4. 載入到 Chrome
# - 開啟 chrome://extensions/
# - 開啟「開發人員模式」
# - 點擊「載入未封裝項目」
# - 選擇 dist 資料夾
```

### 分發方式比較

| 方式 | 優點 | 缺點 |
|------|------|------|
| GitHub 原始碼 | 免費、開源 | 需使用者自行 build |
| ZIP 打包 | 簡單分發 | 無法使用 Google Drive 功能 |
| Chrome Web Store | 最佳使用者體驗 | 需付 $5 開發者費用 |

---

## 4. 開發中遇到的問題與解決方案（避坑指南）

### 坑 1：DOM 選擇器選到重複元素

**問題**：每則訊息有兩個 DOM 元素共用相同的 `data-message-id`（一個 DIV、一個 BUTTON），導致訊息被擷取兩次。

**錯誤做法**：
```javascript
document.querySelectorAll('[data-message-id]')  // ❌ 會選到 DIV 和 BUTTON
```

**正確做法**：
```javascript
document.querySelectorAll('div[data-message-id]')  // ✅ 只選 DIV
```

---

### 坑 2：發送者名稱在父元素中

**問題**：發送者名稱不在訊息元素內，而是在「訊息群組」的父層元素中。

**解決方案**：
```javascript
const group = messageElement.closest('.Ss4fHf');
const sender = group?.querySelector('.poVWob')?.textContent;
```

---

### 坑 3：Manifest V3 Service Worker 不支援 Blob URL

**問題**：`URL.createObjectURL()` 在 Service Worker 中不可用，導致下載功能報錯。

**錯誤做法**：
```javascript
const blob = new Blob([content], { type: mimeType });
const url = URL.createObjectURL(blob);  // ❌ Service Worker 不支援
```

**正確做法**：
```javascript
const base64 = btoa(unescape(encodeURIComponent(content)));
const dataUrl = `data:${mimeType};base64,${base64}`;  // ✅ 使用 Data URL
```

---

### 坑 4：MutationObserver 觸發過於頻繁

**問題**：DOM 變化頻繁導致效能問題。

**解決方案**：使用 debounce 機制
```javascript
let debounceTimer = null;
function handleMutations(mutations) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processMutations, 100);
}
```

---

### 坑 5：OAuth Client ID 綁定 Extension ID

**問題**：每個用戶安裝 ZIP 時會產生不同的 Extension ID，導致 OAuth 無法共用。

**解決方案**：
- 方案 A：使用者自行建立 OAuth Client（麻煩）
- 方案 B：發布到 Chrome Web Store（Extension ID 固定）
- 方案 C：放棄 OAuth 功能，只提供本機匯出

---

## 5. 版本迭代歷程

| 版本 | 日期 | 主要變更 |
|------|------|---------|
| **v0.1.0** | 2024-12-20 | 初始版本：基本架構、MutationObserver、Storage、匯出功能 |
| **v0.2.0** | 2024-12-21 | UI 美化、發送者名稱擷取、內容去重機制 |
| **v0.3.0** | 2024-12-21 | 修正重複訊息問題（DIV/BUTTON 選擇器） |
| **v0.4.0** | 2024-12-22 | 修正下載功能（Blob URL → Data URL） |

### 詳細變更記錄

#### v0.1.0 - 初始版本
- 建立 Vite + React + TypeScript 專案
- 實作 MutationObserver 監聽聊天容器
- 實作 Chrome Storage 儲存訊息
- 實作 Markdown/CSV 匯出
- 整合 Google OAuth 2.0 和 Drive API

#### v0.2.0 - UI 優化
- 重寫 Popup CSS，改用深色漸層主題
- 修正發送者名稱擷取邏輯（使用 `.closest('.Ss4fHf')`）
- 新增內容相似度去重（30 秒內相同內容視為重複）
- 修正「開始監聽」按鈕顯示邏輯

#### v0.3.0 - 修正重複擷取
- 選擇器從 `[data-message-id]` 改為 `div[data-message-id]`
- 在 observer 層和 parser 層都加入重複檢查
- 新增 DOM 標記 `data-mcl-processed` 防止重複處理

#### v0.4.0 - 修正下載功能
- 將 `URL.createObjectURL()` 改為 Data URL
- 解決 Manifest V3 Service Worker 不支援 Blob 的問題

---

## 6. 學習心得

1. **Chrome Extension Manifest V3 限制多**：Service Worker 取代 Background Page，許多 DOM API 不再可用。

2. **第三方網站 DOM 結構不穩定**：Google Meet 的 CSS class 名稱和 DOM 結構會頻繁改變，盡量使用 `data-*` 或 `aria-*` 屬性作為選擇器。

3. **去重需要多層防護**：DOM 層、記憶體層、儲存層三層去重才能確保不會有重複訊息。

4. **OAuth 分發限制**：未發布到 Chrome Web Store 的擴充套件無法共用 OAuth 憑證。

---

## 7. 專案連結

- **GitHub**: https://github.com/cyclone-tw/chrome-plugins/tree/main/meeting-chat-messages
- **開發文件**: DEVELOPMENT.md
- **使用說明**: README.md

---

*報告完成日期：2024-12-22*
