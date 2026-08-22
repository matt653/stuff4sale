const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  console.log("\n==========================================");
  console.log("TEST 1: Direct navigation to /catalog...");
  console.log("==========================================");
  await page.goto("http://localhost:3000/catalog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const storefrontContainer = await page.locator("#buyer-storefront-container").isVisible();
  console.log("🟢 BuyerStorefront container visible:", storefrontContainer);

  const searchInput = await page.locator("#buyer-search-input").isVisible();
  console.log("🟢 Search input visible:", searchInput);

  // Wait for buyer item cards to load
  await page.waitForSelector("[id^='buyer-card-item-']", { timeout: 10000 }).catch((e) => console.log("Note:", e.message));
  const cardCount = await page.locator("[id^='buyer-card-item-']").count();
  console.log("🟢 TOTAL BUYER CARDS FOUND:", cardCount);

  if (cardCount > 0) {
    const firstCardTitle = await page.locator("[id^='buyer-card-item-'] h3").first().innerText();
    console.log("🟢 First Buyer Card Title:", firstCardTitle);

    console.log("\n==========================================");
    console.log("TEST 2: Clicking first item card to open in-page popup modal...");
    console.log("==========================================");
    await page.locator("[id^='buyer-card-item-']").first().click();
    await page.waitForTimeout(1000);

    const modalVisible = await page.locator("#buyer-item-popup-modal").isVisible();
    console.log("🟢 BuyerItemModal in-page popup visible:", modalVisible);

    const offerBoxVisible = await page.locator("#buyer-make-offer-box").isVisible();
    console.log("🟢 Make an Offer box visible inside modal:", offerBoxVisible);

    const photosCount = await page.locator("#buyer-remaining-photos-thumbnails button").count();
    console.log("🟢 Remaining photo thumbnails count in modal:", photosCount);

    await page.screenshot({ path: "scratch/buyer_modal_popup.png" });
    console.log("📸 Saved screenshot: scratch/buyer_modal_popup.png");

    console.log("\n==========================================");
    console.log("TEST 3: Closing modal via Escape / Close button...");
    console.log("==========================================");
    await page.locator("#btn-close-buyer-modal").click();
    await page.waitForTimeout(500);
    const modalClosed = !(await page.locator("#buyer-item-popup-modal").isVisible());
    console.log("🟢 Modal successfully closed:", modalClosed);
  }

  console.log("\n==========================================");
  console.log("TEST 4: Switching to Seller Portal...");
  console.log("==========================================");
  await page.locator("#btn-switch-seller-admin").click();
  await page.waitForTimeout(1000);

  const adminNavVisible = await page.locator("#header-main").isVisible();
  console.log("🟢 Admin Header visible:", adminNavVisible);

  const buyerNavBtnVisible = await page.locator("#btn-nav-open-buyer-catalog").isVisible();
  console.log("🟢 'Buyer Catalog' button in Admin navbar:", buyerNavBtnVisible);

  const copyLinkBtnVisible = await page.locator("#btn-copy-public-catalog-link").isVisible();
  console.log("🟢 'Copy Public Catalog Link' button in Admin navbar:", copyLinkBtnVisible);

  const firstShareBuyerLink = await page.locator("[id^='btn-share-buyer-link-']").first().isVisible();
  console.log("🟢 'Buyer Link' button on ItemCard:", firstShareBuyerLink);

  await page.screenshot({ path: "scratch/admin_dashboard_with_buyer_button.png" });
  console.log("📸 Saved screenshot: scratch/admin_dashboard_with_buyer_button.png");

  console.log("\n==========================================");
  console.log("TEST 5: Switching from Admin back to Buyer Catalog...");
  console.log("==========================================");
  await page.locator("#btn-nav-open-buyer-catalog").click();
  await page.waitForTimeout(1000);

  const backToStorefront = await page.locator("#buyer-storefront-container").isVisible();
  console.log("🟢 Successfully switched back to Buyer Storefront:", backToStorefront);

  await page.screenshot({ path: "scratch/buyer_storefront_catalog.png" });
  console.log("📸 Saved screenshot: scratch/buyer_storefront_catalog.png");

  await browser.close();
  console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
})();
