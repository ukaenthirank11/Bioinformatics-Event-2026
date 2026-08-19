# Bioinformatics Event 2026

A complete responsive event portal in a white-and-red visual theme. It supports registration, year-specific games, timed scoring, three progressive rounds, results, certificates, a year-filtered leaderboard, and a small organizer desk.

## Use it locally

Open [index.html](D:/Personal%20Project/Bio/index.html) in a browser. It works as an offline demo immediately; participant progress is stored only in that browser.

The demo organizer code is `BIO2026`. It is only for previewing the interface and is not used once a Sheets backend is connected.

## Connect the Sheets backend

1. Open your live Google Sheet: `https://docs.google.com/spreadsheets/d/1D4NHi_ccYJf-687GO0NiN3iR2R8T2NQ-nIYwSZf0heA/edit?usp=sharing`.
2. Open **Extensions → Apps Script** in that sheet and replace the default file with [Code.gs](D:/Personal%20Project/Bio/sheets/Code.gs).
3. In the **Settings** tab, replace `CHANGE-ME-2026` with a private organizer code.
4. Deploy the script as a **Web app**: execute as you, with access for anyone with the link.
5. Paste the deployed URL into [config.js](D:/Personal%20Project/Bio/config.js).
6. Publish this folder on any static web host.

With the URL configured, your Google Sheet becomes the shared source of truth. It handles duplicate registrations, stores server-verified answers, controls timer windows, tracks scores and completed rounds, and supplies the live leaderboard.

## Spreadsheet structure

- **Students**: participant identity, scores, round state, and status.
- **Questions**: the active event question bank used by the app and the Apps Script backend.
- **Answers**: auditable answer log written by Apps Script.
- **Leaderboard**: formula-backed operational view.
- **Rounds**: round availability, difficulty, duration, and pass mark.
- **Settings**: event-wide controls and the organizer code.
