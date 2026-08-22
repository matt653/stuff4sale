const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER EXCEPTION:", err));

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  console.log("Evaluating direct supabase query in page context...");
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch("https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale?select=id,name,stock_number&order=created_at.desc&limit=5", {
        headers: {
          "apikey": "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm",
          "Authorization": "Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm"
        }
      });
      const status = res.status;
      const text = await res.text();
      return { status, text };
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  });

  console.log("EVALUATION RESULT:", JSON.stringify(result, null, 2));

  await browser.close();
})();
