/**
 * 分數著色學習單 - Google Apps Script
 * 
 * 部署步驟：
 * 1. 前往 https://script.google.com 建立新專案
 * 2. 複製此程式碼貼入編輯器
 * 3. 點擊「部署」>「新增部署作業」
 * 4. 選擇類型「網頁應用程式」
 * 5. 設定：
 *    - 說明：分數著色學習記錄
 *    - 執行身分：我
 *    - 存取權限：任何人
 * 6. 點擊「部署」
 * 7. 複製網頁應用程式網址，貼到學習單設定中
 * 
 * 注意：首次部署會要求授權，請允許存取 Google Sheets
 */

// 設定你的 Google Sheets ID（從試算表網址中取得）
// 網址格式：https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
const SPREADSHEET_ID = '在此貼上你的試算表ID';

/**
 * 處理 POST 請求（接收學習資料）
 */
function doPost(e) {
    try {
        const sheet = getOrCreateSheet();
        const data = JSON.parse(e.postData.contents);

        // 寫入資料
        sheet.appendRow([
            new Date(),                    // A: 時間戳記
            data.studentName || '未填寫',  // B: 學生姓名
            data.mode || '',               // C: 練習模式
            data.totalQuestions || 0,      // D: 總題數
            data.correctCount || 0,        // E: 答對題數
            (data.accuracy || 0) + '%',    // F: 正確率
            data.timeFormatted || '',      // G: 完成時間
            data.errors || ''              // H: 錯誤記錄
        ]);

        return ContentService
            .createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * 處理 GET 請求（測試用）
 */
function doGet(e) {
    return ContentService.createTextOutput('分數著色學習單 API 運作正常！');
}

/**
 * 取得或建立工作表
 */
function getOrCreateSheet() {
    let ss;

    try {
        // 嘗試開啟指定的試算表
        ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
        // 如果找不到，建立新的試算表
        ss = SpreadsheetApp.create('分數著色學習記錄');
        Logger.log('已建立新試算表：' + ss.getUrl());
    }

    let sheet = ss.getSheetByName('學習記錄');

    // 如果工作表不存在，建立並設定標題
    if (!sheet) {
        sheet = ss.insertSheet('學習記錄');

        // 設定標題列
        const headers = [
            '時間', '學生姓名', '練習模式', '總題數',
            '答對題數', '正確率', '完成時間', '錯誤記錄'
        ];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // 設定標題樣式
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#f3f4f6');

        // 設定欄寬
        sheet.setColumnWidth(1, 150); // 時間
        sheet.setColumnWidth(2, 100); // 姓名
        sheet.setColumnWidth(3, 120); // 模式
        sheet.setColumnWidth(4, 80);  // 總題數
        sheet.setColumnWidth(5, 80);  // 答對
        sheet.setColumnWidth(6, 80);  // 正確率
        sheet.setColumnWidth(7, 100); // 時間
        sheet.setColumnWidth(8, 400); // 錯誤記錄

        // 凍結標題列
        sheet.setFrozenRows(1);
    }

    return sheet;
}

/**
 * 測試函數（可在編輯器中執行測試）
 */
function testAppend() {
    const testData = {
        studentName: '測試學生',
        mode: '看圖寫分數',
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        timeFormatted: '2 分 30 秒',
        errors: '第3題: 正確答案是 3/5 | 第7題: 正確答案是 2/8'
    };

    const sheet = getOrCreateSheet();
    sheet.appendRow([
        new Date(),
        testData.studentName,
        testData.mode,
        testData.totalQuestions,
        testData.correctCount,
        testData.accuracy + '%',
        testData.timeFormatted,
        testData.errors
    ]);

    Logger.log('測試資料已寫入！');
}
