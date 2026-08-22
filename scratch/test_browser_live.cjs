const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  console.log("Waiting for item card selector...");
  await page.waitForSelector("[id^='item-card-']", { timeout: 15000 }).catch(err => console.log("Selector wait note:", err.message));

  const itemCount = await page.locator("[id^='item-card-']").count();
  console.log("🟢 TOTAL ITEM CARDS FOUND IN DOM:", itemCount);

  if (itemCount > 0) {
    const firstTitle = await page.locator("[id^='item-card-'] h3").first().innerText();
    console.log("🟢 FIRST ITEM TITLE:", firstTitle);
  } else {
    const emptyState = await page.locator("#empty-state-view").isVisible().catch(() => false);
    console.log("Empty state visible:", emptyState);
  }

  await browser.close();
})();
