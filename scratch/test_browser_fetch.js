const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const itemCount = await page.locator("#inventory-grid-list > div, #inventory-table-list tr").count();
  console.log("PAGE ITEM COUNT FOUND IN DOM:", itemCount);

  const errorText = await page.locator("#empty-state-view, .text-rose-600").allInnerTexts();
  console.log("ERROR / EMPTY TEXT FOUND:", errorText);

  await browser.close();
})();
