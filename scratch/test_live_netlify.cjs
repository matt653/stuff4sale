const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("LIVE NETLIFY CONSOLE:", msg.type(), msg.text()));

  console.log("Navigating to LIVE Netlify URL: https://stuff4sale.netlify.app/catalog...");
  await page.goto("https://stuff4sale.netlify.app/catalog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  const storefrontVisible = await page.locator("#buyer-storefront-container").isVisible().catch(() => false);
  console.log("🟢 Live Netlify BuyerStorefront visible:", storefrontVisible);

  await page.waitForSelector("[id^='buyer-card-item-']", { timeout: 15000 }).catch(e => console.log("Selector note:", e.message));
  const cardCount = await page.locator("[id^='buyer-card-item-']").count();
  console.log("🟢 Live Netlify Buyer Cards Count:", cardCount);

  if (cardCount > 0) {
    const firstTitle = await page.locator("[id^='buyer-card-item-'] h3").first().innerText();
    console.log("🟢 First Item on Live Netlify:", firstTitle);

    await page.locator("[id^='buyer-card-item-']").first().click();
    await page.waitForTimeout(1000);

    const modalVisible = await page.locator("#buyer-item-popup-modal").isVisible();
    console.log("🟢 Live Netlify Modal Popup Visible:", modalVisible);

    await page.screenshot({ path: "scratch/live_netlify_buyer_catalog.png" });
    console.log("📸 Saved screenshot: scratch/live_netlify_buyer_catalog.png");
  }

  await browser.close();
})();
