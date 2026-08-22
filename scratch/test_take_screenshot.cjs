const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(5000);

  await page.screenshot({ path: "scratch/page_state.png", fullPage: true });
  console.log("Screenshot saved to scratch/page_state.png");

  const innerHTML = await page.locator("body").innerHTML();
  console.log("HTML SAMPLE:", innerHTML.substring(0, 800));

  await browser.close();
})();
