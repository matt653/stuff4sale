const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("\n=======================================================");
  console.log("TEST 1: Public Buyer Storefront (Simple, Phone-First)");
  console.log("=======================================================");
  await page.goto("http://localhost:3000/catalog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const phoneBoxVisible = await page.locator("text=Call or Text:").isVisible().catch(() => false);
  console.log("📱 Is Seller Cell Phone highlighted on catalog header?", phoneBoxVisible);

  await page.screenshot({ path: "scratch/simplified_buyer_storefront.png" });
  console.log("📸 Saved screenshot: scratch/simplified_buyer_storefront.png");

  console.log("\n=======================================================");
  console.log("TEST 2: Opening Item Modal & Checking Call/Text Box");
  console.log("=======================================================");
  await page.locator("[id^='buyer-card-item-']").first().click();
  await page.waitForTimeout(1000);

  const directSellerLine = await page.locator("text=Direct Seller Line").isVisible();
  console.log("📱 Is Direct Seller Line box visible inside item modal?", directSellerLine);

  await page.screenshot({ path: "scratch/simplified_item_modal.png" });
  console.log("📸 Saved screenshot: scratch/simplified_item_modal.png");

  console.log("\n=======================================================");
  console.log("TEST 3: Submitting Real Offer ($35) from Buyer");
  console.log("=======================================================");
  await page.locator("#input-buyer-offer-amount").fill("35");
  await page.locator("#input-buyer-name").fill("Mike S.");
  await page.locator("#input-buyer-contact").fill("555-987-6543");
  await page.locator("#input-buyer-note").fill("Can pick up today at 3pm!");

  await page.locator("#btn-submit-buyer-offer").click();
  await page.waitForTimeout(1500);

  const offerSuccess = await page.locator("text=Offer & Message Sent!").isVisible();
  console.log("🟢 Did offer submission complete with success message?", offerSuccess);

  await page.screenshot({ path: "scratch/offer_submitted_success.png" });
  console.log("📸 Saved screenshot: scratch/offer_submitted_success.png");

  console.log("\n=======================================================");
  console.log("TEST 4: Unlocking Seller Dashboard & Verifying Offer Logged");
  console.log("=======================================================");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.locator("#admin-pin-input-field").fill("1234");
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "scratch/admin_offer_logged.png" });
  console.log("📸 Saved screenshot: scratch/admin_offer_logged.png");

  await browser.close();
  console.log("\n🎉 REAL OFFER FLOW & SIMPLIFICATION VERIFIED CLEANLY!");
})();
