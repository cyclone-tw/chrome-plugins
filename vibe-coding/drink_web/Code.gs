/**
 * 飲料訂購系統 - Google Apps Script API 後端
 * 純 API 模式，供外部網頁呼叫
 */

// Google Sheets 設定
const SHEET_NAME = '飲料訂單';
const SPREADSHEET_NAME = '飲料訂購系統';

/**
 * 處理 GET 請求 - 取得菜單或統計
 */
function doGet(e) {
  const action = e.parameter.action || 'menu';
  let result;
  
  switch (action) {
    case 'menu':
      result = getMenuItems();
      break;
    case 'stats':
      result = getTodayStats();
      break;
    default:
      result = { error: 'Unknown action' };
  }
  
  return createJsonResponse(result);
}

/**
 * 處理 POST 請求 - 提交訂單
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = submitOrder(data);
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: '處理請求失敗：' + error.toString()
    });
  }
}

/**
 * 建立 JSON 回應（支援 CORS）
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 取得或建立試算表
 */
function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  
  // 建立新的試算表
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  
  // 設定標題列
  const headers = ['訂單編號', '訂購時間', '姓名', '部門', '飲料名稱', '甜度', '冰塊', '容量', '數量', '單價', '小計', '備註'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 格式化標題列
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4A90A4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  return ss;
}

/**
 * 取得試算表工作表
 */
function getSheet() {
  const ss = getOrCreateSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['訂單編號', '訂購時間', '姓名', '部門', '飲料名稱', '甜度', '冰塊', '容量', '數量', '單價', '小計', '備註'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  return sheet;
}

/**
 * 產生訂單編號
 */
function generateOrderId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Taipei', 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, 'Asia/Taipei', 'HHmmss');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${timeStr}-${random}`;
}

/**
 * 提交訂單
 */
function submitOrder(orderData) {
  try {
    const sheet = getSheet();
    const orderId = generateOrderId();
    const orderTime = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    
    const items = orderData.items;
    const rows = [];
    
    items.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      rows.push([
        index === 0 ? orderId : '',
        index === 0 ? orderTime : '',
        index === 0 ? orderData.name : '',
        index === 0 ? orderData.department : '',
        item.drinkName,
        item.sweetness,
        item.ice,
        item.size,
        item.quantity,
        item.price,
        subtotal,
        item.note || ''
      ]);
    });
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      success: true,
      orderId: orderId,
      total: total,
      message: '訂單已成功送出！'
    };
    
  } catch (error) {
    return {
      success: false,
      message: '訂單送出失敗：' + error.toString()
    };
  }
}

/**
 * 取得飲料菜單 - 50嵐
 */
function getMenuItems() {
  return {
    categories: [
      {
        name: '找好茶',
        icon: '🍵',
        items: [
          { id: 1, name: '茉莉綠茶', priceM: 25, priceL: 30, description: '清香茉莉' },
          { id: 2, name: '阿薩姆紅茶', priceM: 25, priceL: 30, description: '經典紅茶' },
          { id: 3, name: '四季春青茶', priceM: 25, priceL: 30, description: '清爽青茶' },
          { id: 4, name: '黃金烏龍', priceM: 25, priceL: 30, description: '烏龍茶香' },
          { id: 5, name: '1號(四季春珍波椰)', priceM: 35, priceL: 45, description: '招牌特調' },
          { id: 6, name: '波霸綠/紅', priceM: 35, priceL: 45, description: '波霸系列' },
          { id: 7, name: '微檸檬紅/青', priceM: 35, priceL: 45, description: '微酸清爽' },
          { id: 8, name: '檸檬綠/青', priceM: 40, priceL: 55, description: '酸甜檸檬' },
          { id: 9, name: '梅の綠', priceM: 40, priceL: 55, description: '梅子風味' },
          { id: 10, name: '8冰綠', priceM: 40, priceL: 55, description: '冰涼暢快' },
          { id: 11, name: '多多綠', priceM: 40, priceL: 55, description: '養樂多綠茶' },
          { id: 12, name: '旺來紅', priceM: 40, priceL: 55, description: '鳳梨紅茶' },
          { id: 13, name: '柚子紅', priceM: 40, priceL: 55, description: '柚香紅茶' },
          { id: 14, name: '鮮柚綠', priceM: 50, priceL: 65, description: '新鮮柚子' }
        ]
      },
      {
        name: '找奶茶',
        icon: '🧋',
        items: [
          { id: 20, name: '奶茶', priceM: 40, priceL: 55, description: '經典奶茶' },
          { id: 21, name: '奶綠', priceM: 40, priceL: 55, description: '綠茶+奶' },
          { id: 22, name: '烏龍奶', priceM: 40, priceL: 55, description: '烏龍+奶' },
          { id: 23, name: '珍珠奶茶', priceM: 40, priceL: 55, description: '經典珍奶' },
          { id: 24, name: '波霸奶茶', priceM: 40, priceL: 55, description: '大顆珍珠' },
          { id: 25, name: '燕麥奶茶', priceM: 40, priceL: 55, description: '燕麥風味' },
          { id: 26, name: '椰果奶茶', priceM: 40, priceL: 55, description: 'QQ椰果' },
          { id: 27, name: '阿華田', priceM: 45, priceL: 60, description: '濃郁可可' }
        ]
      },
      {
        name: '找新鮮',
        icon: '🍋',
        items: [
          { id: 30, name: '8冰茶', priceM: 40, priceL: 55, description: '清涼8冰' },
          { id: 31, name: '柚子茶', priceM: 40, priceL: 55, description: '柚香四溢' },
          { id: 32, name: '檸檬汁', priceM: 50, priceL: 65, description: '現榨檸檬' },
          { id: 33, name: '葡萄柚汁', priceM: 50, priceL: 65, description: '鮮榨柚汁' },
          { id: 34, name: '金桔檸檬', priceM: 50, priceL: 65, description: '酸甜金桔' },
          { id: 35, name: '檸檬梅汁', priceM: 50, priceL: 65, description: '梅香檸檬' },
          { id: 36, name: '檸檬多多', priceM: 55, priceL: 75, description: '養樂多檸檬' },
          { id: 37, name: '葡萄柚多多', priceM: 55, priceL: 75, description: '養樂多柚子' }
        ]
      },
      {
        name: '找拿鐵',
        icon: '🥛',
        items: [
          { id: 40, name: '紅茶拿鐵', priceM: 50, priceL: 65, description: '鮮奶紅茶' },
          { id: 41, name: '珍珠紅茶拿鐵', priceM: 50, priceL: 65, description: '珍珠+鮮奶' },
          { id: 42, name: '波霸紅茶拿鐵', priceM: 50, priceL: 65, description: '波霸+鮮奶' },
          { id: 43, name: '燕麥紅茶拿鐵', priceM: 50, priceL: 65, description: '燕麥+鮮奶' },
          { id: 44, name: '阿華田拿鐵', priceM: 55, priceL: 75, description: '阿華田+鮮奶' }
        ]
      },
      {
        name: '找冰淇淋',
        icon: '🍦',
        items: [
          { id: 50, name: '冰淇淋紅茶', priceM: 40, priceL: 55, description: '冰淇淋+紅茶' },
          { id: 51, name: '芒果青', priceM: 40, priceL: 55, description: '芒果風味' },
          { id: 52, name: '荔枝烏龍', priceM: 40, priceL: 55, description: '荔枝+烏龍' },
          { id: 53, name: '冰淇淋奶茶', priceM: 50, priceL: 65, description: '冰淇淋+奶茶' },
          { id: 54, name: '冰淇淋紅茶拿鐵', priceM: 55, priceL: 75, description: '冰淇淋+拿鐵' }
        ]
      }
    ],
    options: {
      sweetness: ['正常糖', '少糖', '半糖', '微糖', '無糖'],
      ice: ['正常冰', '少冰', '微冰', '去冰', '溫', '熱'],
      size: [
        { name: '中杯 (M)', key: 'M' },
        { name: '大杯 (L)', key: 'L' }
      ]
    }
  };
}

/**
 * 取得今日訂單統計
 */
function getTodayStats() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { orderCount: 0, totalAmount: 0, popularDrink: '-' };
    }
    
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd');
    let orderCount = 0;
    let totalAmount = 0;
    const drinkCounts = {};
    
    for (let i = 1; i < data.length; i++) {
      const orderTime = data[i][1];
      if (orderTime && orderTime.toString().startsWith(today)) {
        if (data[i][0]) orderCount++;
        totalAmount += data[i][10] || 0;
        
        const drinkName = data[i][4];
        if (drinkName) {
          drinkCounts[drinkName] = (drinkCounts[drinkName] || 0) + 1;
        }
      }
    }
    
    let popularDrink = '-';
    let maxCount = 0;
    for (const drink in drinkCounts) {
      if (drinkCounts[drink] > maxCount) {
        maxCount = drinkCounts[drink];
        popularDrink = drink;
      }
    }
    
    return {
      orderCount: orderCount,
      totalAmount: totalAmount,
      popularDrink: popularDrink
    };
    
  } catch (error) {
    return { orderCount: 0, totalAmount: 0, popularDrink: '-' };
  }
}
