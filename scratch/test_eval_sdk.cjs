const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER EXCEPTION:", err));

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  console.log("Evaluating direct REST fetch in page context...");
  const res = await page.evaluate(async () => {
    try {
      const response = await fetch("https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale?select=id,name,stock_number&order=created_at.desc&limit=5", {
        headers: {
          "apikey": "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm",
          "Authorization": "Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm"
        }
      });
      const status = response.status;
      const text = await response.text();
      return { status, text: text.substring(0, 300) };
    } catch (e) {
      return { exception: e.message, stack: e.stack };
    }
  });

  console.log("REST FETCH RESULT:", JSON.stringify(res, null, 2));

  await browser.close();
})();
