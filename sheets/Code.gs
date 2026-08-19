/**
 * Bioinformatics Event 2026 — Google Sheets backend
 *
 * Setup:
 * 1. Open your live Google Sheet and go to Extensions > Apps Script.
 * 2. Replace the default code with this file.
 * 3. Deploy as a Web App (execute as you, access: anyone with the link).
 * 4. Paste the deployed web-app URL in ../config.js.
 *
 * Participant-facing requests use doPost so answers never appear in the URL.
 * Keep the admin access code in the Settings sheet; do not put it in config.js.
 */
const SPREADSHEET_ID = "1D4NHi_ccYJf-687GO0NiN3iR2R8T2NQ-nIYwSZf0heA";
const SHEET_SCHEMAS = {
  Students: ["Participant ID", "Name", "Class", "Year", "Registered At", "Score", "Current Round", "Completed Rounds", "Completed Questions", "Time Taken (seconds)", "Round Started At", "Round Started Number", "Status"],
  Questions: ["Question ID", "Year", "Round", "Category", "Question / Clue", "Answer", "Difficulty", "Game Type", "Points", "Active", "Jumble"],
  Answers: ["Student ID", "Round", "Question ID", "Answer", "Correct", "Points", "Updated At"],
  Leaderboard: ["Rank", "Name", "Class", "Year", "Score", "Current Round", "Status", "Time Taken (seconds)"],
  Rounds: ["Year", "Round", "Competition", "Difficulty", "Game Type", "Questions", "Duration (minutes)", "Pass Mark", "Status"],
  Settings: ["Setting", "Value"]
};
const DEFAULT_SETTINGS = [
  ["eventName", "Bioinformatics Event 2026"],
  ["eventLive", true],
  ["durationMinutes", 10],
  ["passingScore", 60],
  ["maxQuestionsPerRound", 10],
  ["registrationOpen", true],
  ["adminAccessCode", "CHANGE-ME-2026"]
];

function doGet(e) {
  bootstrapSpreadsheet_();
  const action = String(e.parameter.action || "health").toLowerCase();
  try {
    if (action === "health") return json_({
      ok: true,
      event: setting_("eventName"),
      live: asBool_(setting_("eventLive")),
      registrationOpen: asBool_(setting_("registrationOpen")),
      questions: records_("Questions").rows.filter(row => asBool_(row.Active)).length
    });
    if (action === "leaderboard") return json_({ ok: true, rows: leaderboard_(e.parameter.year || "") });
    if (action === "status") return json_(status_(e.parameter.studentId || ""));
    return json_({ ok: false, message: "Use a POST request for this action." });
  } catch (error) {
    return json_({ ok: false, message: error.message || "Unable to complete the request." });
  }
}

function doPost(e) {
  bootstrapSpreadsheet_();
  const payload = e.parameter || {};
  const action = String(payload.action || "").toLowerCase();
  try {
    if (action === "register") return json_(register_(payload));
    if (action === "startround") return json_(startRound_(payload));
    if (action === "questions") return json_(questions_(payload));
    if (action === "saveanswer") return json_(saveAnswer_(payload));
    if (action === "completeround") return json_(completeRound_(payload));
    if (action === "admin") return json_(admin_(payload));
    return json_({ ok: false, message: "Unknown action." });
  } catch (error) {
    return json_({ ok: false, message: error.message || "Unable to complete the request." });
  }
}

function register_(payload) {
  const name = clean_(payload.name, 60);
  const className = clean_(payload.className, 60);
  const year = clean_(payload.year, 20);
  if (!name || !className || !year) return { ok: false, message: "Name, class, and academic year are required." };
  if (!asBool_(setting_("registrationOpen"))) return { ok: false, message: "Registration is currently closed." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const students = records_("Students");
    const duplicate = students.rows.some(row => String(row.Name).toLowerCase() === name.toLowerCase() && String(row.Year).toLowerCase() === year.toLowerCase());
    if (duplicate) return { ok: false, message: "This participant has already registered for that academic year." };
    const id = Utilities.getUuid();
    append_("Students", students.headers, {
      "Participant ID": id, "Name": name, "Class": className, "Year": year, "Registered At": new Date(),
      "Score": 0, "Current Round": 1, "Completed Rounds": 0, "Completed Questions": 0,
      "Time Taken (seconds)": 0, "Round Started At": "", "Round Started Number": "", "Status": "Active"
    });
    return { ok: true, student: { id: id, name: name, className: className, year: year, registeredAt: new Date().toISOString(), score: 0, currentRound: 1, completedRounds: 0, timeTaken: 0 } };
  } finally {
    lock.releaseLock();
  }
}

function startRound_(payload) {
  const round = Number(payload.round || 1);
  const access = roundAccess_(payload.studentId, round, true);
  if (!access.ok) return access;
  const student = access.student;
  const headers = access.students.headers;
  const sheet = sheet_("Students");
  const startedAt = asDate_(student["Round Started At"]);
  if (!startedAt || Number(student["Round Started Number"]) !== round) {
    writeRow_(sheet, headers, student._row, { "Round Started At": new Date(), "Round Started Number": round, "Status": "Active" });
  }
  return { ok: true, startedAt: (startedAt || new Date()).toISOString(), student: publicStudent_(student) };
}

function questions_(payload) {
  const round = Number(payload.round || 1);
  const access = roundAccess_(payload.studentId, round, false);
  if (!access.ok) return access;
  const rows = records_("Questions").rows
    .filter(row => row.Year === access.student.Year && Number(row.Round) === round && asBool_(row.Active))
    .map(row => ({
      id: row["Question ID"], category: row.Category, clue: row["Question / Clue"],
      difficulty: row.Difficulty, type: String(row["Game Type"]).toLowerCase(),
      jumble: row.Jumble || "", points: Number(row.Points) || 10,
      direction: row.Direction || inferDirection_(row["Question ID"]),
      number: Number(row.Number || inferNumber_(row["Question ID"])) || 0
    }));
  if (!rows.length) return { ok: false, message: "No active questions have been published for this round." };
  return { ok: true, rows: rows };
}

function saveAnswer_(payload) {
  const round = Number(payload.round || 1);
  const access = roundAccess_(payload.studentId, round, false);
  if (!access.ok) return access;
  const answer = normalize_(payload.answer);
  if (!answer) return { ok: false, message: "Enter an answer first." };
  const question = records_("Questions").rows.find(row => String(row["Question ID"]) === String(payload.questionId) && row.Year === access.student.Year && Number(row.Round) === round && asBool_(row.Active));
  if (!question) return { ok: false, message: "That question is not available in this round." };

  const correct = answer === normalize_(question.Answer);
  const answers = records_("Answers");
  const previous = answers.rows.find(row => String(row["Student ID"]) === String(payload.studentId) && String(row["Question ID"]) === String(question["Question ID"]));
  const points = correct ? Number(question.Points) || 10 : 0;
  const payloadRow = {
    "Student ID": payload.studentId, "Round": round, "Question ID": question["Question ID"],
    "Answer": answer, "Correct": correct, "Points": points, "Updated At": new Date()
  };
  if (previous) writeRow_(sheet_("Answers"), answers.headers, previous._row, payloadRow);
  else append_("Answers", answers.headers, payloadRow);

  const score = refreshStudentScore_(payload.studentId);
  return { ok: true, correct: correct, totalScore: score.total, roundScore: score.round, message: correct ? "Correct — " + points + " points added." : "Not quite. Check the clue and try again." };
}

function completeRound_(payload) {
  const round = Number(payload.round || 1);
  const access = roundAccess_(payload.studentId, round, false, true);
  if (!access.ok) return access;
  const score = refreshStudentScore_(payload.studentId);
  const passMark = Number(access.roundConfig["Pass Mark"]) || Number(setting_("passingScore")) || 60;
  const qualified = score.round >= passMark;
  const completed = Number(access.student["Completed Rounds"]) || 0;
  const nextRound = qualified ? Math.min(3, round + 1) : round;
  const elapsed = Math.max(0, Math.min(Number(payload.elapsed || 0), Number(access.roundConfig["Duration (minutes)"] || setting_("durationMinutes") || 10) * 60));
  writeRow_(sheet_("Students"), access.students.headers, access.student._row, {
    "Completed Rounds": qualified ? Math.max(completed, round) : completed,
    "Current Round": nextRound,
    "Time Taken (seconds)": Number(access.student["Time Taken (seconds)"]) + elapsed,
    "Round Started At": "",
    "Round Started Number": "",
    "Status": qualified && round === 3 ? "Completed" : qualified ? "Active" : "Not Qualified"
  });
  return {
    ok: true, qualified: qualified, completedRounds: qualified ? Math.max(completed, round) : completed,
    currentRound: nextRound, score: score.total,
    message: qualified ? (round === 3 ? "Congratulations — all rounds are complete." : "You qualified for the next round.") : "You did not reach the pass mark for this round."
  };
}

function leaderboard_(year) {
  return records_("Students").rows
    .filter(row => !year || row.Year === year)
    .map(row => ({ id: row["Participant ID"], name: row.Name, className: row.Class, year: row.Year, score: Number(row.Score) || 0, timeTaken: Number(row["Time Taken (seconds)"]) || 0, currentRound: Number(row["Current Round"]) || 1 }))
    .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken || String(a.name).localeCompare(String(b.name)));
}

function admin_(payload) {
  if (String(payload.code || "") !== String(setting_("adminAccessCode") || "")) return { ok: false, message: "That access code is not valid." };
  const command = String(payload.command || "summary").toLowerCase();
  const students = records_("Students").rows;
  const summary = () => ({ registrations: students.length, active: students.filter(row => row.Status === "Active").length, questions: records_("Questions").rows.filter(row => asBool_(row.Active)).length });
  if (command === "summary" || command === "refresh") return { ok: true, summary: summary(), message: "Live event data refreshed." };
  if (command === "open") {
    const rounds = records_("Rounds");
    const next = rounds.rows.find(row => String(row.Status).toLowerCase() === "locked");
    if (!next) return { ok: false, message: "There are no locked rounds left to open." };
    writeRow_(sheet_("Rounds"), rounds.headers, next._row, { Status: "Open" });
    return { ok: true, summary: summary(), message: next.Year + " round " + next.Round + " is now open." };
  }
  if (command === "close") {
    setSetting_("eventLive", false);
    return { ok: true, summary: summary(), message: "The event has been paused." };
  }
  if (command === "export") return { ok: true, summary: summary(), message: "Use File > Download in Google Sheets to export the registrations." };
  return { ok: false, message: "Unknown admin command." };
}

function roundAccess_(studentId, round, allowStart, allowExpired) {
  if (!asBool_(setting_("eventLive"))) return { ok: false, message: "The event is currently paused." };
  const students = records_("Students");
  const student = students.rows.find(row => String(row["Participant ID"]) === String(studentId));
  if (!student) return { ok: false, message: "Participant record not found. Please register again." };
  if (Number(student["Current Round"]) !== round) return { ok: false, message: "Complete the current round before opening this one." };
  if (String(student.Status) === "Not Qualified") return { ok: false, message: "This round has already been submitted." };
  const config = records_("Rounds").rows.find(row => row.Year === student.Year && Number(row.Round) === round);
  if (!config || String(config.Status).toLowerCase() !== "open") return { ok: false, message: "This round is not open yet." };
  const started = asDate_(student["Round Started At"]);
  if (!allowStart && (!started || Number(student["Round Started Number"]) !== round)) return { ok: false, message: "Start the round before loading questions." };
  const minutes = Number(config["Duration (minutes)"]) || Number(setting_("durationMinutes")) || 10;
  if (!allowStart && !allowExpired && started && (Date.now() - started.getTime()) > minutes * 60000) return { ok: false, message: "Time is up. Submit the round to view your result." };
  return { ok: true, student: student, students: students, roundConfig: config };
}

function refreshStudentScore_(studentId) {
  const answers = records_("Answers").rows.filter(row => String(row["Student ID"]) === String(studentId));
  const total = answers.reduce((sum, row) => sum + (asBool_(row.Correct) ? Number(row.Points) || 0 : 0), 0);
  const student = records_("Students");
  const current = student.rows.find(row => String(row["Participant ID"]) === String(studentId));
  const activeRound = Number(current["Current Round"]) || 1;
  const round = answers.filter(row => Number(row.Round) === activeRound).reduce((sum, row) => sum + (asBool_(row.Correct) ? Number(row.Points) || 0 : 0), 0);
  const completedQuestions = answers.filter(row => asBool_(row.Correct)).length;
  writeRow_(sheet_("Students"), student.headers, current._row, { Score: total, "Completed Questions": completedQuestions });
  return { total: total, round: round };
}

function records_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const headerRow = values.findIndex(row => row.indexOf(name === "Students" ? "Participant ID" : name === "Questions" ? "Question ID" : name === "Answers" ? "Student ID" : name === "Rounds" ? "Year" : "Setting") >= 0);
  if (headerRow < 0) throw new Error("The " + name + " sheet has no header row.");
  const headers = values[headerRow].map(String);
  return { headers: headers, rows: values.slice(headerRow + 1).filter(row => row.some(value => value !== "")).map((row, index) => {
    const object = { _row: headerRow + index + 2 };
    headers.forEach((header, column) => object[header] = row[column]);
    return object;
  }) };
}

function append_(name, headers, record) {
  sheet_(name).appendRow(headers.map(header => record[header] !== undefined ? record[header] : ""));
}

function writeRow_(sheet, headers, rowNumber, changes) {
  Object.keys(changes).forEach(header => {
    const column = headers.indexOf(header);
    if (column >= 0) sheet.getRange(rowNumber, column + 1).setValue(changes[header]);
  });
}

function setting_(key) {
  const settings = records_("Settings").rows.find(row => row.Setting === key);
  return settings ? settings.Value : "";
}

function setSetting_(key, value) {
  const settings = records_("Settings");
  const target = settings.rows.find(row => row.Setting === key);
  if (!target) throw new Error("Setting " + key + " was not found.");
  writeRow_(sheet_("Settings"), settings.headers, target._row, { Value: value });
}

function publicStudent_(student) {
  return {
    id: student["Participant ID"], name: student.Name, className: student.Class, year: student.Year,
    score: Number(student.Score) || 0, currentRound: Number(student["Current Round"]) || 1,
    completedRounds: Number(student["Completed Rounds"]) || 0, timeTaken: Number(student["Time Taken (seconds)"]) || 0,
    registeredAt: asDate_(student["Registered At"]) ? asDate_(student["Registered At"]).toISOString() : "",
    roundStartedAt: asDate_(student["Round Started At"]) ? asDate_(student["Round Started At"]).toISOString() : "",
    roundStartedNumber: Number(student["Round Started Number"]) || 0,
    status: student.Status || ""
  };
}

function status_(studentId) {
  if (!studentId) return { ok: false, message: "Participant ID is required." };
  const students = records_("Students").rows;
  const student = students.find(row => String(row["Participant ID"]) === String(studentId));
  if (!student) return { ok: false, message: "Participant record not found. Please register again." };
  return { ok: true, student: publicStudent_(student) };
}

function sheet_(name) {
  const book = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActive();
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
  }
  ensureHeaders_(sheet, SHEET_SCHEMAS[name] || []);
  return sheet;
}

function bootstrapSpreadsheet_() {
  const book = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActive();
  const sheets = book.getSheets();
  const namedSheets = new Set(sheets.map(sheet => sheet.getName()));
  if (sheets.length === 1 && sheets[0].getName() === "Sheet1" && sheets[0].getLastRow() === 0 && !namedSheets.has("Students")) {
    sheets[0].setName("Students");
    namedSheets.delete("Sheet1");
    namedSheets.add("Students");
  }
  Object.entries(SHEET_SCHEMAS).forEach(([name, headers]) => {
    let sheet = book.getSheetByName(name);
    if (!sheet) sheet = book.insertSheet(name);
    ensureHeaders_(sheet, headers);
    if (name === "Settings") ensureDefaultSettings_(sheet);
  });
}

function ensureHeaders_(sheet, headers) {
  if (!headers.length) return;
  if (!sheet.getLastRow()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function ensureDefaultSettings_(sheet) {
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter(row => row.some(value => value !== ""));
  if (rows.length) return;
  sheet.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
}

function asBool_(value) { return value === true || String(value).toLowerCase() === "true"; }
function asDate_(value) { return value instanceof Date && !isNaN(value) ? value : value ? new Date(value) : null; }
function normalize_(value) { return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function clean_(value, limit) { return String(value || "").replace(/[<>]/g, "").trim().slice(0, limit); }
function inferDirection_(questionId) {
  const match = String(questionId || "").match(/-([AD])\d+$/i);
  return match ? (match[1].toUpperCase() === "A" ? "Across" : "Down") : "";
}
function inferNumber_(questionId) {
  const match = String(questionId || "").match(/([AD])(\d+)$/i);
  return match ? Number(match[2]) : 0;
}
function json_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
