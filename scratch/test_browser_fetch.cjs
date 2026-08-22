const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  console.log("Waiting for inventory grid to render...");
  await page.waitForSelector("#inventory-grid-list", { timeout: 15000 }).catch(err => console.log("Selector wait error:", err.message));

  const itemCount = await page.locator("#inventory-grid-list > div").count();
  console.log("SUCCESS! INVENTORY CARDS FOUND IN DOM:", itemCount);

  const firstItemTitle = await page.locator("#inventory-grid-list h3").first().innerText().catch(() => "NONE");
  console.log("FIRST ITEM TITLE:", firstItemTitle);

  await browser.close();
})();
