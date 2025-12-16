# Vibe Picker 🎨

一個為設計師打造的美觀 Chrome 擴充功能色彩選擇器。

## 功能特色

- 🎯 **原生取色器** - 使用瀏覽器內建 EyeDropper API
- 🎨 **設計師調色盤** - 自動生成明暗色調與互補色
- 📋 **一鍵複製** - 點擊任何顏色值即可複製
- 📚 **歷史記錄** - 保存最近 10 個選取的顏色
- 💫 **MacOS 風格** - 簡約美觀的使用者介面

## 開發環境需求

- Node.js 16+
- npm 或 yarn
- Chrome 瀏覽器

## 開發安裝

```bash
# 克隆專案
git clone <repository-url>
cd vibe-picker

# 安裝依賴
npm install

# 建構專案
npm run build
```

## 安裝擴充功能

### 方法一：載入開發版本

1. 開啟 Chrome 瀏覽器
2. 前往 `chrome://extensions/`
3. 開啟右上角「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇專案中的 `dist` 資料夾

### 方法二：下載 Release 版本

1. 從 [Releases](../../releases) 下載最新版本
2. 解壓縮 ZIP 檔案
3. 按照上述步驟載入解壓後的資料夾

## 使用說明

### 基本操作

1. **取色**
   - 點擊「Pick Color」按鈕
   - 游標變成取色器，點擊任何螢幕區域

2. **查看顏色資訊**
   - 顯示 HEX、RGB、HSL 格式
   - 點擊任何顏色值即可複製

3. **調色盤**
   - 自動生成 6 個明暗色調
   - 顯示 1 個互補色
   - 點擊色塊複製 HEX 值

4. **歷史記錄**
   - 自動保存最近 10 個顏色
   - 點擊歷史色塊快速複製

### 瀏覽器支援

- Chrome 95+
- Edge 95+
- 其他支援 EyeDropper API 的瀏覽器

## 技術架構

- **React + TypeScript** - 前端框架
- **Vite + CRXJS** - 建構工具
- **Tailwind CSS** - 樣式框架
- **colord** - 顏色處理
- **lucide-react** - 圖標庫

## 授權

MIT License