# 🎨 分數圖形著色學習單

一個互動式的分數學習工具，幫助學生透過圖形著色來理解和練習分數概念。

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 功能特色

### 🎯 三種學習模式

| 模式 | 說明 |
|------|------|
| 📄 **列印模式** | 生成可列印的學習單，支援 A4 雙欄排版，一頁可容納 6 題 |
| 👁️ **看圖寫分數** | 學生觀察已著色的圖形，寫出對應的分數 |
| ✏️ **看分數塗圖** | 學生根據顯示的分數，點擊圖形進行著色 |

### 📊 支援圖形類型

- **圓餅圖** - 扇形分割
- **長條圖** - 矩形格子
- **混合模式** - 隨機選擇圖形類型

### 🎚️ 難度設定

| 難度 | 分母範圍 |
|------|----------|
| 簡單 | 2 ~ 6 |
| 中等 | 2 ~ 10 |
| 困難 | 2 ~ 15 |

### 🔢 分數類型

- **真分數** - 分子 < 分母
- **假分數** - 分子 ≥ 分母（自動生成多個圖形）
- **混合** - 隨機出題

### 📋 其他功能

- ⏱️ **計時功能** - 追蹤作答時間
- 👤 **學生名單** - 透過 JSON 設定學生下拉選單
- ✅ **即時回饋** - 視覺化的正確/錯誤標記
- 📊 **成績統計** - 顯示正確率和錯誤題目分析
- 🖨️ **列印成績單** - 匯出作答結果
- 📡 **Google Sheets 整合** - 自動上傳成績到雲端

## 🚀 快速開始

### 線上使用

直接開啟 `fraction-coloring.html` 檔案即可使用。

### 設定學生名單

編輯 `students.json` 檔案：

```json
{
  "classes": [
    {
      "name": "三年甲班",
      "students": ["王小明", "李小華", "張小美"]
    },
    {
      "name": "三年乙班",
      "students": ["陳大雄", "林小靜"]
    }
  ]
}
```

### Google Sheets 整合（選用）

1. 建立新的 Google Sheets 試算表
2. 前往「擴充功能」>「Apps Script」
3. 貼上 `google-apps-script.js` 的內容
4. 部署為網頁應用程式
5. 將部署 URL 填入學習單設定

## 📁 檔案結構

```
fraction-coloring/
├── fraction-coloring.html  # 主程式（互動版學習單）
├── students.json           # 學生名單設定
├── google-apps-script.js   # GAS 程式碼（Google Sheets 整合）
├── CHANGELOG.md            # 版本紀錄
└── README.md               # 本文件
```

## 🎨 介面預覽

### 暗色主題設計

- 低調奢華的暗色系配色
- 螢光綠/黃色的現代按鈕
- 橘色系統著色效果
- 響應式設計，支援手機與平板

## 📖 版本紀錄

詳見 [CHANGELOG.md](./CHANGELOG.md)

### 最新版本 v2.5.2

- 列印時強制雙欄配置
- 支援三種列印題型（看分數塗圖/看圖寫分數/混合）
- 優化 A4 紙張排版

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📄 授權

MIT License

---

Made with ❤️ for 數學教育
