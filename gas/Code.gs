/**
 * Google Apps Script Web App for Typing RPG Cloud Save & Analytics
 */

const SHEET_NAME_RECORDS = 'GameplayRecords';
const SHEET_NAME_SAVES = 'UserProgress';

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action || 'RECORD_MATCH'; // Default for backward compatibility
    
    if (action === 'LOAD_PROGRESS') {
      return handleLoad(requestData);
    } else if (action === 'SAVE_PROGRESS') {
      return handleSave(requestData);
    } else if (action === 'GET_LEADERBOARD') {
      return handleGetLeaderboard(requestData);
    } else {
      return handleRecordMatch(requestData);
    }
      
  } catch (error) {
    return makeResponse({ status: 'error', message: error.toString() });
  }
}

function handleLoad(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  if (!sheet) return makeResponse({ status: 'not_found' });

  const values = sheet.getDataRange().getValues();
  // Find latest entry for ClassID + PIN
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === data.classId && String(values[i][1]) === String(data.pin)) {
      return makeResponse({
        status: 'success',
        saveData: {
          timestamp: values[i][2],
          level: values[i][3],
          mode: values[i][4],
          currentHp: values[i][5],
          hpBase: values[i][6],
          score: values[i][7],
          highestCombo: values[i][8],
          inventory: JSON.parse(values[i][9] || '[]')
        }
      });
    }
  }
  return makeResponse({ status: 'not_found' });
}

function handleSave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SAVES);
    sheet.appendRow(['ClassID', 'PIN', 'Timestamp', 'Level', 'Mode', 'CurrentHP', 'HPBase', 'Score', 'MaxCombo', 'InventoryJSON']);
    sheet.getRange("A1:J1").setFontWeight("bold");
  }

  const rowData = [
    data.classId,
    "'" + data.pin, // Force text
    new Date().toISOString(),
    data.level || 1,
    data.mode || 'Beginner',
    data.currentHp || 100,
    data.hpBase || 120,
    data.score || 0,
    data.maxCombo || 0,
    JSON.stringify(data.inventory || [])
  ];

  // Upsert: Find if user exists
  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.classId && String(values[i][1]) === String(data.pin)) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return makeResponse({ status: 'success' });
}

function handleGetLeaderboard(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  if (!sheet) return makeResponse({ status: 'not_found' });

  const values = sheet.getDataRange().getValues();
  const categories = {
    'Beginner': [],
    'Intermediate': [],
    'Advanced': []
  };

  // Index 0: ClassID, 3: Level, 4: Mode, 7: Score, 8: MaxCombo, 2: Timestamp
  for (let i = 1; i < values.length; i++) {
    const mode = values[i][4] || 'Beginner';
    const entry = {
      classId: values[i][0],
      level: values[i][3],
      score: values[i][7],
      maxCombo: values[i][8],
      timestamp: values[i][2]
    };
    
    if (categories[mode]) {
      categories[mode].push(entry);
    }
  }

  // Sort each category by Score desc, then Level desc
  for (const mode in categories) {
    categories[mode].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.level - a.level;
    });
    categories[mode] = categories[mode].slice(0, 10); // Top 10 per mode
  }

  return makeResponse({
    status: 'success',
    leaderboard: categories
  });
}

function handleRecordMatch(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_RECORDS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_RECORDS);
    sheet.appendRow(['Timestamp', 'Class ID', 'PIN', 'Mode', 'Level Reached', 'Score', 'Max Combo', 'Result (Won)']);
    sheet.getRange("A1:H1").setFontWeight("bold");
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.classId || 'Unknown',
    "'" + (data.pin || 'Unknown'),
    data.mode || 'Unknown',
    data.level || 0,
    data.score || 0,
    data.maxCombo || 0,
    data.won ? 'Win' : 'Loss'
  ]);

  return makeResponse({ status: 'success' });
}

function makeResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
