# 50嵐 飲料訂購系統 (GAS 版) 🧋

Google Apps Script 嵌入式網頁版本 - 完全運行於 Google 生態系統中。

## 特色

- 🌐 **一鍵部署** - 直接透過 GAS 部署，無需額外主機
- 📊 **Google Sheets 整合** - 訂單自動記錄到試算表
- 🔒 **Google 帳號驗證** - 可選擇限制存取權限
- 📱 **響應式設計** - 支援各種裝置

## 與 drink_web 的差異

| 項目 | gas_01_drink (本版本) | drink_web |
|------|----------------------|-----------|
| 部署方式 | GAS 直接部署 | 需獨立主機 |
| API 呼叫 | `google.script.run` | `fetch()` |
| 網址 | `script.google.com/...` | 自訂網域 |
| 適用場景 | 快速部署、內部使用 | 公開網站 |

## 快速開始

### 1. 建立 GAS 專案

1. 開啟 [Google Apps Script](https://script.google.com)
2. 建立新專案
3. 將 `Code.gs` 貼入程式碼編輯器
4. 新增 HTML 檔案，命名為 `index`，貼入 `index.html` 內容

### 2. 部署

1. 點擊「部署」→「新增部署作業」
2. 類型選擇「網頁應用程式」
3. 執行身分：「我」
4. 存取權限：「任何人」
5. 按「部署」並複製網址

## 檔案結構

```
gas_01_drink/
├── Code.gs       # 後端邏輯 + 資料處理
└── index.html    # 前端介面（GAS 嵌入式）
```

## 菜單分類

- 🍵 找好茶 (14款)
- 🧋 找奶茶 (8款)
- 🍋 找新鮮 (8款)
- 🥛 找拿鐵 (5款)
- 🍦 找冰淇淋 (5款)

## 授權

本專案僅供學習與非商業用途。50嵐為註冊商標。

---

Made with ❤️ using Google Apps Script
