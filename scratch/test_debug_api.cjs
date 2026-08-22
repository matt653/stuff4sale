const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER EXCEPTION:", err));

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  console.log("Testing fetch('/api/items') from browser...");
  const res = await page.evaluate(async () => {
    try {
      const response = await fetch("/api/items");
      const status = response.status;
      const text = await response.text();
      return { status, text: text.substring(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log("RESULT OF /api/items:", JSON.stringify(res, null, 2));

  await browser.close();
})();
