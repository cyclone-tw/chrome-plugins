# 開發筆記 (Development Notes)

> 此文件記錄了開發 Google Meet Chat Logger 過程中遇到的問題、解決方案和版本變更。
> 供人類開發者和 AI 助手參考，以減少未來開發類似 Chrome 擴充套件時的 debug 時間。

---

## 📋 目錄

- [踩坑記錄](#-踩坑記錄-pitfalls)
- [版本變更日誌](#-版本變更日誌-changelog)
- [錯誤處理指南](#-錯誤處理指南)
- [開發最佳實踐](#-開發最佳實踐)

---

## 🚨 踩坑記錄 (Pitfalls)

### 1. Google Meet DOM 結構不穩定

**問題描述**：
Google Meet 的 DOM 結構會隨版本更新而改變，導致 CSS 選擇器失效。

**錯誤範例**：
```typescript
// ❌ 錯誤：這個選擇器在某些版本不存在
const messages = document.querySelectorAll('[role="listitem"]');
```

**正確做法**：
```typescript
// ✅ 正確：使用 data-message-id 屬性，這是 Google 的穩定 API
const messages = document.querySelectorAll('div[data-message-id]');
```

**診斷方法**：
```javascript
// 在 Google Meet Console 執行，檢查實際 DOM 結構
const allMsgEls = document.querySelectorAll('[data-message-id]');
console.log(`總共 ${allMsgEls.length} 個元素`);
allMsgEls.forEach((el, i) => {
    console.log(`${i}: <${el.tagName}> class="${el.className.slice(0,50)}"`);
});
```

---

### 2. 同一個 `data-message-id` 對應多個 DOM 元素

**問題描述**：
每則訊息有兩個元素共用相同的 `data-message-id`：
- `<div>` - 實際訊息內容
- `<button>` - UI 按鈕（表情回覆等）

這導致每則訊息被擷取兩次。

**錯誤範例**：
```typescript
// ❌ 會同時選到 DIV 和 BUTTON
const messageElements = container.querySelectorAll('[data-message-id]');
```

**正確做法**：
```typescript
// ✅ 只選擇 DIV 元素
const messageElements = container.querySelectorAll('div[data-message-id]');
```

**診斷方法**：
```javascript
// 找出重複的 message ID
const seen = new Map();
document.querySelectorAll('[data-message-id]').forEach(el => {
    const id = el.getAttribute('data-message-id');
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(el.tagName);
});
seen.forEach((tags, id) => {
    if (tags.length > 1) console.log(`ID: ${id} → ${tags.join(', ')}`);
});
```

---

### 3. 發送者名稱擷取困難

**問題描述**：
發送者名稱不在訊息元素內，而是在「訊息群組」的父元素中。
自己發送的訊息可能沒有顯式的發送者名稱。

**DOM 結構**：
```html
<div class="Ss4fHf">                    <!-- 訊息群組 -->
  <div class="poVWob">發送者名稱</div>   <!-- 發送者（可能不存在） -->
  <div data-message-id="...">訊息1</div>
  <div data-message-id="...">訊息2</div>
</div>
```

**正確做法**：
```typescript
function getSenderName(messageElement: Element): string {
    // 向上尋找訊息群組
    const group = messageElement.closest('.Ss4fHf');
    if (group) {
        const senderEl = group.querySelector('.poVWob, .zWGUib');
        if (senderEl?.textContent) {
            return senderEl.textContent.trim();
        }
    }
    return '您'; // 預設為自己
}
```

---

### 4. Content Script 無法在 Popup 關閉後繼續運行

**問題描述**：
Popup 關閉後，與 Content Script 的連線會中斷，但 Content Script 本身仍在運行。
需要使用 `chrome.storage` 來持久化狀態。

**解決方案**：
```typescript
// 使用 storage 而非記憶體變數
await chrome.storage.local.set({ isRecording: true });

// 頁面載入時恢復狀態
const { isRecording } = await chrome.storage.local.get('isRecording');
if (isRecording) {
    startObserver();
}
```

---

### 5. MutationObserver 效能問題

**問題描述**：
頻繁的 DOM 變化會導致 callback 被大量觸發，影響效能。

**解決方案**：使用 debounce
```typescript
let debounceTimer: number | null = null;
const pendingMutations: MutationRecord[] = [];

function handleMutations(mutations: MutationRecord[]): void {
    pendingMutations.push(...mutations);
    
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
        processPendingMutations();
    }, 100); // 100ms debounce
}
```

---

### 6. OAuth Client ID 設定

**問題描述**：
Chrome 擴充套件的 OAuth 需要在 Google Cloud Console 正確設定。

**必要步驟**：
1. 在 `chrome://extensions/` 取得擴充套件 ID
2. 在 Google Cloud Console 設定 OAuth Client
3. 將 Client ID 填入 `manifest.json`

**manifest.json 設定**：
```json
{
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  }
}
```

---

### 7. Tailwind CSS 在 Chrome Extension 中不生效

**問題描述**：
使用 Tailwind CSS 時，樣式可能不會正確注入到 Popup 頁面。

**解決方案**：
改用純 CSS，或確保 Tailwind 的 PostCSS 設定正確。

```css
/* 使用純 CSS 更可靠 */
:root {
    --bg-primary: #0f0f23;
    --accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn {
    background: var(--accent-gradient);
    /* ... */
}
```

---

## 📝 版本變更日誌 (Changelog)

### v0.3.0 (2024-12-22)
**修正重複訊息擷取**
- 選擇器從 `[data-message-id]` 改為 `div[data-message-id]`
- 排除 BUTTON 元素造成的重複
- 新增 DOM 元素標記 `data-mcl-processed` 防止重複處理

### v0.2.0 (2024-12-21)
**UI 美化與發送者名稱修正**
- 重寫 Popup CSS 為深色漸層主題
- 修正發送者名稱擷取邏輯（使用 `.Ss4fHf` 群組）
- 新增內容相似度去重（30 秒內相同內容視為重複）
- 修正按鈕顯示邏輯

### v0.1.0 (2024-12-20)
**初始版本**
- 基於 Vite + React + TypeScript
- MutationObserver 即時監聽
- 支援 Markdown/CSV 匯出
- Google Drive 上傳功能
- Chrome Storage 持久化

---

## 🔧 錯誤處理指南

### Console 除錯

**查看擴充套件的 Console**：
1. `chrome://extensions/` → 找到擴充套件
2. 點擊「Service Worker」查看 Background Script 的 log
3. 在 Google Meet 頁面按 F12 查看 Content Script 的 log

**預期的正常 log**：
```
[Meet Chat Logger] Starting observer on chat container
[Meet Chat Logger] Captured 3 new messages
```

### 常見錯誤

| 錯誤訊息 | 可能原因 | 解決方案 |
|---------|---------|---------|
| `Chat container not found` | 聊天面板未開啟 | 開啟聊天面板後重試 |
| `Observer already running` | 重複啟動 | 正常，無需處理 |
| `OAuth error` | Client ID 錯誤 | 檢查 manifest.json 的 client_id |
| 訊息重複 | 選擇器問題 | 使用 `div[data-message-id]` |

### 診斷腳本

在 Google Meet Console 執行以下腳本來診斷問題：

```javascript
// 完整診斷腳本
(function diagnose() {
    console.log('=== Meet Chat Logger 診斷 ===\n');
    
    // 1. 檢查聊天容器
    const container = document.querySelector('[aria-live="polite"]');
    console.log(`1. 聊天容器: ${container ? '✅ 存在' : '❌ 不存在'}`);
    
    // 2. 檢查訊息元素
    const divs = document.querySelectorAll('div[data-message-id]');
    const btns = document.querySelectorAll('button[data-message-id]');
    console.log(`2. DIV 訊息: ${divs.length} 個`);
    console.log(`   BUTTON 元素: ${btns.length} 個（應被忽略）`);
    
    // 3. 檢查已處理標記
    const processed = document.querySelectorAll('[data-mcl-processed]');
    console.log(`3. 已處理: ${processed.length} 個`);
    
    // 4. 測試解析第一則訊息
    if (divs.length > 0) {
        const first = divs[0];
        const content = first.querySelector('[jsname="dTKtvb"] div');
        const group = first.closest('.Ss4fHf');
        const sender = group?.querySelector('.poVWob, .zWGUib');
        console.log(`4. 範例訊息:`);
        console.log(`   內容: "${content?.textContent?.trim().slice(0,30) || '無'}"`);
        console.log(`   發送者: "${sender?.textContent?.trim() || '您'}"`);
    }
    
    console.log('\n=== 診斷完成 ===');
})();
```

---

## 💡 開發最佳實踐

### 1. 選擇器穩定性

```typescript
// 優先順序（從穩定到不穩定）
// 1. data-* 屬性（最穩定）
'div[data-message-id]'

// 2. aria-* 屬性（相對穩定）
'[aria-live="polite"]'

// 3. jsname 屬性（Google 內部使用，較穩定）
'[jsname="dTKtvb"]'

// 4. class 名稱（經常變動，避免使用）
'.Ss4fHf' // 可能會改變
```

### 2. 去重策略

```typescript
// 三層去重
// 1. DOM 層：標記已處理的元素
element.setAttribute('data-mcl-processed', 'true');

// 2. 記憶體層：使用 Set 追蹤 ID
const processedIds = new Set<string>();
if (processedIds.has(message.id)) return;

// 3. 儲存層：檢查內容相似度
const recentMessages = messages.filter(m => 
    Date.now() - m.timestamp < 30000
);
const isDuplicate = recentMessages.some(m => 
    m.content === newMessage.content
);
```

### 3. 錯誤恢復

```typescript
// 自動重試機制
let retryCount = 0;
const MAX_RETRIES = 5;

function scheduleRetry(): void {
    if (retryCount >= MAX_RETRIES) return;
    
    retryCount++;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    
    setTimeout(() => {
        startObserver();
    }, delay);
}
```

---

## 🤖 AI 開發者注意事項

當 AI 助手接手這個專案時，請注意：

1. **先執行診斷腳本** - 了解當前 DOM 結構
2. **不要假設選擇器仍然有效** - Google 可能已更新
3. **測試前先重新載入擴充套件** - `chrome://extensions/` → 重新載入
4. **查看 Console log** - 確認 `[Meet Chat Logger]` 開頭的訊息
5. **使用 `div[data-message-id]`** - 不是 `[data-message-id]`

---

*最後更新：2024-12-22*
