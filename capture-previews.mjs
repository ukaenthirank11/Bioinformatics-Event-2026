import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const outDir = path.resolve("outputs/bioinformatics-event-2026");
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const url = pathToFileURL(path.resolve("index.html")).href;

async function open(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  return page;
}

const desktop = await open({ width: 1440, height: 1000 });
await desktop.locator("#registerShortcut").click();
await desktop.locator("#fullName").fill("Maya Joseph");
await desktop.locator("#studentClass").selectOption("B.Sc. Biotechnology");
await desktop.locator("#studentYear").selectOption("Second Year");
await desktop.locator("#registerButton").click();
await desktop.locator("#registrationDialog").evaluate(dialog => !dialog.open);
await desktop.locator("#competitionName").getByText("Bioinformatics Jumble Words").waitFor();
await desktop.screenshot({ path: path.join(outDir, "laptop-preview.png"), fullPage: true });

await desktop.locator("#startRound").click();
await desktop.locator("#jumbleBoard").waitFor();
await desktop.locator("#answerInput").fill("GENOME");
await desktop.locator("#submitAnswer").click();
await desktop.locator("#answerFeedback.correct").waitFor();
await desktop.locator('[data-view="admin"]').click();
await desktop.locator("#adminCode").fill("BIO2026");
await desktop.locator("#unlockAdmin").click();
await desktop.locator("#adminPanel").waitFor();
await desktop.close();

const mobile = await open({ width: 390, height: 844 });
await mobile.locator("#startRound").click();
await mobile.locator("#fullName").fill("Maya Joseph");
await mobile.locator("#studentClass").selectOption("B.Sc. Biotechnology");
await mobile.locator("#studentYear").selectOption("Second Year");
await mobile.locator("#registerButton").click();
await mobile.locator("#registrationDialog").evaluate(dialog => !dialog.open);
await mobile.locator("#startRound").click();
await mobile.locator("#jumbleBoard").waitFor();
await mobile.screenshot({ path: path.join(outDir, "mobile-preview.png"), fullPage: true });
await mobile.close();
await browser.close();

if (errors.length) throw new Error("Browser errors: " + errors.join(" | "));
console.log("Responsive previews and interaction checks passed.");
