/**
 * Google Apps Script Web App for Typing RPG Cloud Save & Analytics
 * 
 * v2: SaveData stored as single JSON column for extensibility.
 * UserProgress columns: ClassID | PIN | Timestamp | SaveDataJSON
 */

const SHEET_NAME_RECORDS = 'GameplayRecords';
const SHEET_NAME_SAVES = 'UserProgress';

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action || 'RECORD_MATCH';
    
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

// ─────────────────────────────
//  LOAD — Parse SaveDataJSON
// ─────────────────────────────

function handleLoad(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  if (!sheet) return makeResponse({ status: 'not_found' });

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const isNewFormat = (headers.length === 4 && headers[3] === 'SaveDataJSON');

  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === data.classId && String(values[i][1]) === String(data.pin)) {
      let saveData;

      if (isNewFormat) {
        // v2 format: column 3 = JSON string
        try {
          saveData = JSON.parse(values[i][3] || '{}');
        } catch (e) {
          saveData = {};
        }
      } else {
        // Legacy v1 format: individual columns
        saveData = {
          level: values[i][3],
          mode: values[i][4],
          currentHp: values[i][5],
          hpBase: values[i][6],
          score: values[i][7],
          highestCombo: values[i][8],
          inventory: JSON.parse(values[i][9] || '[]')
        };
      }

      saveData.timestamp = values[i][2];
      return makeResponse({ status: 'success', saveData: saveData });
    }
  }
  return makeResponse({ status: 'not_found' });
}

// ─────────────────────────────
//  SAVE — Store as JSON blob
// ─────────────────────────────

function handleSave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SAVES);
    sheet.appendRow(['ClassID', 'PIN', 'Timestamp', 'SaveDataJSON']);
    sheet.getRange("A1:D1").setFontWeight("bold");
  }

  // Build save object (strip auth fields)
  const saveObj = Object.assign({}, data);
  delete saveObj.action;
  delete saveObj.classId;
  delete saveObj.pin;

  const rowData = [
    data.classId,
    "'" + data.pin,
    new Date().toISOString(),
    JSON.stringify(saveObj)
  ];

  // Check if sheet is new format (4 columns) or old format (10 columns)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const isNewFormat = (headers.length === 4 && headers[3] === 'SaveDataJSON');

  if (!isNewFormat) {
    // Sheet is still old format — run migration first
    migrateOldData();
  }

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

// ─────────────────────────────
//  LEADERBOARD — Parse from JSON
// ─────────────────────────────

function handleGetLeaderboard(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  if (!sheet) return makeResponse({ status: 'not_found' });

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const isNewFormat = (headers.length === 4 && headers[3] === 'SaveDataJSON');

  const categories = {
    'Beginner': [],
    'Intermediate': [],
    'Advanced': []
  };

  for (let i = 1; i < values.length; i++) {
    let entry;

    if (isNewFormat) {
      try {
        const obj = JSON.parse(values[i][3] || '{}');
        entry = {
          classId: values[i][0],
          level: obj.level || 1,
          score: obj.score || 0,
          maxCombo: obj.highestCombo || 0,
          gold: obj.gold || 0,
          timestamp: values[i][2],
          mode: obj.mode || 'Beginner'
        };
      } catch (e) {
        continue;
      }
    } else {
      // Legacy format
      entry = {
        classId: values[i][0],
        level: values[i][3],
        score: values[i][7],
        maxCombo: values[i][8],
        timestamp: values[i][2],
        mode: values[i][4] || 'Beginner'
      };
    }
    
    if (categories[entry.mode]) {
      categories[entry.mode].push(entry);
    }
  }

  // Sort each category by Score desc, then Level desc
  for (const mode in categories) {
    categories[mode].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.level - a.level;
    });
    categories[mode] = categories[mode].slice(0, 10);
  }

  return makeResponse({
    status: 'success',
    leaderboard: categories
  });
}

// ─────────────────────────────
//  RECORD MATCH (Analytics — unchanged)
// ─────────────────────────────

function handleRecordMatch(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_RECORDS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_RECORDS);
    sheet.appendRow(['Timestamp', 'Class ID', 'PIN', 'Mode', 'Level Reached', 'Score', 'Max Combo', 'Gold Earned', 'Result (Won)']);
    sheet.getRange("A1:I1").setFontWeight("bold");
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.classId || 'Unknown',
    "'" + (data.pin || 'Unknown'),
    data.mode || 'Unknown',
    data.level || 0,
    data.score || 0,
    data.maxCombo || 0,
    data.goldEarned || 0,
    data.won ? 'Win' : 'Loss'
  ]);

  return makeResponse({ status: 'success' });
}

// ─────────────────────────────
//  Migration: Old format → New JSON format
//  Run this ONCE from GAS editor: migrateOldData()
// ─────────────────────────────

function migrateOldData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SAVES);
  if (!sheet) return 'No UserProgress sheet found.';

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  // Already migrated?
  if (headers.length === 4 && headers[3] === 'SaveDataJSON') {
    return 'Already in new format. No migration needed.';
  }

  // Expected old format: ClassID, PIN, Timestamp, Level, Mode, CurrentHP, HPBase, Score, MaxCombo, InventoryJSON
  if (headers.length < 10) {
    return 'Unexpected column count: ' + headers.length + '. Aborting.';
  }

  // Build new data rows
  const newRows = [['ClassID', 'PIN', 'Timestamp', 'SaveDataJSON']];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const saveObj = {
      level: row[3],
      mode: row[4],
      currentHp: row[5],
      hpBase: row[6],
      score: row[7],
      highestCombo: row[8],
      inventory: []
    };

    // Parse old inventory JSON
    try {
      saveObj.inventory = JSON.parse(row[9] || '[]');
    } catch (e) {
      saveObj.inventory = [];
    }

    newRows.push([
      row[0],                     // ClassID
      "'" + String(row[1]),       // PIN (force text)
      row[2],                     // Timestamp
      JSON.stringify(saveObj)     // SaveDataJSON
    ]);
  }

  // Clear old data and write new format
  sheet.clear();
  sheet.getRange(1, 1, newRows.length, 4).setValues(newRows);
  sheet.getRange("A1:D1").setFontWeight("bold");

  // Auto-resize
  sheet.autoResizeColumns(1, 4);

  return 'Migration complete. Converted ' + (newRows.length - 1) + ' user record(s) to JSON format.';
}

// ─────────────────────────────
//  Helper
// ─────────────────────────────

function makeResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
