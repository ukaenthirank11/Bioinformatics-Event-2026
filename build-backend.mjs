import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

globalThis.window = globalThis;
await import("./app-data.js");
const data = globalThis.BioData;
const outputDir = "outputs/bioinformatics-event-2026";
await fs.mkdir(outputDir, { recursive: true });

const colors = { red: "#D81325", dark: "#15161B", soft: "#FFF1F2", line: "#ECECEF", green: "#E9FAF1", gray: "#777983" };
const headerFormat = { fill: colors.red, font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center" };
const titleFormat = { fill: colors.dark, font: { bold: true, color: "#FFFFFF", size: 16 }, horizontalAlignment: "left", verticalAlignment: "center" };
const noteFormat = { fill: "#FFFFFF", font: { italic: true, color: colors.gray, size: 10 }, verticalAlignment: "center" };

const workbook = Workbook.create();
const students = workbook.worksheets.add("Students");
const questions = workbook.worksheets.add("Questions");
const answers = workbook.worksheets.add("Answers");
const leaderboard = workbook.worksheets.add("Leaderboard");
const rounds = workbook.worksheets.add("Rounds");
const settings = workbook.worksheets.add("Settings");

function styleTableSheet(sheet, title, note, lastColumn, headers, rows, widths) {
  sheet.showGridLines = false;
  sheet.getRange("A1:" + lastColumn + "1").merge();
  sheet.getRange("A1:" + lastColumn + "1").values = [[title]];
  sheet.getRange("A1:" + lastColumn + "1").format = titleFormat;
  sheet.getRange("A2:" + lastColumn + "2").merge();
  sheet.getRange("A2:" + lastColumn + "2").values = [[note]];
  sheet.getRange("A2:" + lastColumn + "2").format = noteFormat;
  sheet.getRange("A3:" + lastColumn + "3").values = [headers];
  sheet.getRange("A3:" + lastColumn + "3").format = headerFormat;
  sheet.getRange("A3:" + lastColumn + "3").format.rowHeight = 25;
  if (rows.length) {
    sheet.getRangeByIndexes(3, 0, rows.length, headers.length).values = rows;
    sheet.getRange("A3:" + lastColumn + (rows.length + 3)).format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
    sheet.getRange("A3:" + lastColumn + (rows.length + 3)).format.wrapText = true;
  }
  widths.forEach((width, index) => sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width);
  sheet.freezePanes.freezeRows(3);
}

const seedStudents = data.leaderboard.map((row, index) => [
  "P-" + String(index + 1).padStart(3, "0"), row.name, row.className, row.year,
  new Date(2026, 6, 1, 9, index * 4), row.score, row.score >= 100 ? 3 : 2,
  row.score >= 100 ? 3 : 1, Math.round(row.score / 10), row.timeTaken,
  "", "", row.score >= 100 ? "Completed" : "Active"
]);
const studentHeaders = ["Participant ID", "Name", "Class", "Year", "Registered At", "Score", "Current Round", "Completed Rounds", "Completed Questions", "Time Taken (seconds)", "Round Started At", "Round Started Number", "Status"];
styleTableSheet(students, "Bioinformatics Event 2026 · Participants", "One row per participant. The Apps Script service enforces uniqueness for the combination of name and academic year.", "M", studentHeaders, seedStudents, [17, 23, 25, 16, 21, 11, 14, 17, 20, 23, 21, 20, 15]);
students.getRange("E4:E" + (seedStudents.length + 3)).format.numberFormat = "yyyy-mm-dd hh:mm";
students.getRange("F4:L" + (seedStudents.length + 3)).format.horizontalAlignment = "center";
students.getRange("D4:D203").dataValidation = { rule: { type: "list", values: ["First Year", "Second Year", "Third Year"] } };
students.getRange("M4:M203").dataValidation = { rule: { type: "list", values: ["Active", "Completed", "Not Qualified", "Disqualified"] } };
students.getRange("M4:M203").conditionalFormats.add("containsText", { text: "Completed", format: { fill: colors.green, font: { color: "#168858", bold: true } } });
students.tables.add("A3:M" + (seedStudents.length + 3), true, "StudentsTable");

const questionHeaders = ["Question ID", "Year", "Round", "Category", "Question / Clue", "Answer", "Difficulty", "Game Type", "Points", "Active", "Jumble"];
const questionRows = data.questions.map(question => [
  question.id, question.year, question.round, question.category, question.clue, question.answer,
  question.difficulty, question.type === "crossword" ? "Crossword" : "Jumble", question.points, true, question.jumble || ""
]);
styleTableSheet(questions, "Bioinformatics Event 2026 · Question Bank", "Edit the question bank here. Keep answers private; the browser receives only clues and jumbled letters.", "K", questionHeaders, questionRows, [17, 15, 9, 27, 50, 20, 14, 14, 10, 10, 22]);
questions.getRange("B4:B503").dataValidation = { rule: { type: "list", values: ["First Year", "Second Year", "Third Year"] } };
questions.getRange("G4:G503").dataValidation = { rule: { type: "list", values: ["Easy", "Moderate", "Hard", "Expert"] } };
questions.getRange("H4:H503").dataValidation = { rule: { type: "list", values: ["Crossword", "Jumble"] } };
questions.tables.add("A3:K" + (questionRows.length + 3), true, "QuestionsTable");

const answerHeaders = ["Student ID", "Round", "Question ID", "Answer", "Correct", "Points", "Updated At"];
styleTableSheet(answers, "Bioinformatics Event 2026 · Answer Log", "The Apps Script backend writes one current answer per student and question. This is the auditable source for scores.", "G", answerHeaders, [], [40, 10, 18, 22, 11, 11, 22]);
answers.getRange("E4:E1003").dataValidation = { rule: { type: "list", values: [true, false] } };

const leaderboardHeaders = ["Rank", "Participant", "Class", "Year", "Score", "Current Round", "Status", "Time Taken (seconds)"];
styleTableSheet(leaderboard, "Bioinformatics Event 2026 · Leaderboard", "Formula-backed operations view. The live web leaderboard is served from the same Students data by Apps Script.", "H", leaderboardHeaders, Array.from({ length: 30 }, () => Array(8).fill("")), [10, 25, 25, 16, 12, 15, 16, 22]);
const leaderboardFormulas = Array.from({ length: 30 }, (_, index) => {
  const source = index + 4;
  return [
    "=IFERROR(COUNTIFS('Students'!$D$4:$D$203,'Students'!D" + source + ",'Students'!$F$4:$F$203,\">\"&'Students'!F" + source + ")+1,\"\")",
    "=IFERROR('Students'!B" + source + ",\"\")",
    "=IFERROR('Students'!C" + source + ",\"\")",
    "=IFERROR('Students'!D" + source + ",\"\")",
    "=IFERROR('Students'!F" + source + ",\"\")",
    "=IFERROR('Students'!G" + source + ",\"\")",
    "=IFERROR('Students'!M" + source + ",\"\")",
    "=IFERROR('Students'!J" + source + ",\"\")"
  ];
});
leaderboard.getRange("A4:H33").formulas = leaderboardFormulas;
leaderboard.getRange("E4:E33").conditionalFormats.add("dataBar", { color: colors.red, gradient: true });

const roundHeaders = ["Year", "Round", "Competition", "Difficulty", "Game Type", "Questions", "Duration (minutes)", "Pass Mark", "Status"];
const roundRows = Object.entries(data.competitions).flatMap(([year, item]) => item.difficulties.map((difficulty, index) => [
  year, index + 1, item.name, difficulty, item.type === "crossword" ? "Crossword" : "Jumble",
  data.questions.filter(question => question.year === year && question.round === index + 1).length,
  10,
  (() => {
    const roundQuestions = data.questions.filter(question => question.year === year && question.round === index + 1);
    const totalPoints = roundQuestions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);
    return item.type === "crossword" ? totalPoints : Math.max(10, Math.ceil(totalPoints * 0.6));
  })(),
  "Open"
]));
styleTableSheet(rounds, "Bioinformatics Event 2026 · Round Configuration", "Open, lock, or close individual rounds here. Participants still unlock rounds only after they pass the previous one.", "I", roundHeaders, roundRows, [16, 10, 37, 15, 14, 11, 19, 13, 13]);
rounds.getRange("I4:I103").dataValidation = { rule: { type: "list", values: ["Open", "Locked", "Closed"] } };
rounds.getRange("I4:I103").conditionalFormats.add("containsText", { text: "Open", format: { fill: colors.green, font: { bold: true, color: "#168858" } } });
rounds.tables.add("A3:I" + (roundRows.length + 3), true, "RoundsTable");

settings.showGridLines = false;
settings.getRange("A1:D1").merge();
settings.getRange("A1:D1").values = [["Bioinformatics Event 2026 · Settings"]];
settings.getRange("A1:D1").format = titleFormat;
settings.getRange("A2:D2").merge();
settings.getRange("A2:D2").values = [["Update these values before deploying the Apps Script web app. Keep the organizer access code private."]];
settings.getRange("A2:D2").format = noteFormat;
settings.getRange("A3:B3").values = [["Setting", "Value"]];
settings.getRange("A3:B3").format = headerFormat;
const settingRows = [
  ["eventName", "Bioinformatics Event 2026"], ["eventLive", true], ["durationMinutes", 10],
  ["passingScore", 60], ["maxQuestionsPerRound", 10], ["registrationOpen", true],
  ["adminAccessCode", "CHANGE-ME-2026"]
];
settings.getRange("A4:B10").values = settingRows;
settings.getRange("A3:B10").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
settings.getRange("A:A").format.columnWidth = 30;
settings.getRange("B:B").format.columnWidth = 42;
settings.getRange("B5:B5").dataValidation = { rule: { type: "list", values: [true, false] } };
settings.getRange("B9:B9").dataValidation = { rule: { type: "list", values: [true, false] } };

const check = await workbook.inspect({ kind: "table", range: "Questions!A1:K15", include: "values,formulas", tableMaxRows: 15, tableMaxCols: 11 });
console.log(check.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);
for (const [sheetName, range] of [["Students", "A1:M15"], ["Questions", "A1:K15"], ["Answers", "A1:G8"], ["Leaderboard", "A1:H15"], ["Rounds", "A1:I12"], ["Settings", "A1:D10"]]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.1, format: "png" });
  await fs.writeFile(outputDir + "/" + sheetName.toLowerCase() + "-preview.png", new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputDir + "/Bioinformatics_Event_Backend.xlsx");
