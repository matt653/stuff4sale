const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER EXCEPTION:", err));

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  console.log("Clicking + Add Inventory Item button...");
  await page.click("#btn-add-inventory-empty");
  await page.waitForTimeout(1000);

  await page.screenshot({ path: "scratch/add_item_modal.png", fullPage: true });
  console.log("Screenshot saved to scratch/add_item_modal.png");

  await browser.close();
})();
