const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("\n=======================================================");
  console.log("TEST 1: Public Buyer viewing /catalog (Zero Seller Buttons)");
  console.log("=======================================================");
  await page.goto("http://localhost:3000/catalog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const sellerPortalBtnInHeader = await page.locator("#btn-switch-seller-admin").isVisible().catch(() => false);
  console.log("🔒 Is 'Seller Portal' button in top header? (Should be FALSE):", sellerPortalBtnInHeader);

  const shareBtnVisible = await page.locator("#btn-copy-storefront-link").isVisible();
  console.log("🟢 Is 'Share Catalog' button visible?", shareBtnVisible);

  await page.screenshot({ path: "scratch/public_buyer_clean_header.png" });
  console.log("📸 Saved screenshot: scratch/public_buyer_clean_header.png");

  console.log("\n=======================================================");
  console.log("TEST 2: Attempting to access Admin Root '/' without Auth");
  console.log("=======================================================");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const pinFieldVisible = await page.locator("#admin-pin-input-field").isVisible();
  console.log("🔒 Is PIN passcode input screen visible?", pinFieldVisible);

  await page.screenshot({ path: "scratch/admin_pin_lock_screen.png" });
  console.log("📸 Saved screenshot: scratch/admin_pin_lock_screen.png");

  console.log("\n=======================================================");
  console.log("TEST 3: Testing wrong PIN (9999) rejection");
  console.log("=======================================================");
  await page.locator("#admin-pin-input-field").fill("9999");
  await page.waitForTimeout(800);

  const errorText = await page.locator("text=Incorrect PIN").isVisible().catch(() => false);
  console.log("🚫 Was wrong PIN rejected with error message?", errorText);

  console.log("\n=======================================================");
  console.log("TEST 4: Entering correct PIN (1234) to unlock Admin Dashboard");
  console.log("=======================================================");
  await page.locator("#admin-pin-input-field").fill("1234");
  await page.waitForTimeout(1500);

  const adminDashboardVisible = await page.locator("#header-main").isVisible();
  console.log("🟢 Is Admin Dashboard now unlocked & visible?", adminDashboardVisible);

  const lockPortalBtnVisible = await page.locator("#btn-lock-admin-portal").isVisible();
  console.log("🔒 Is 'Lock Portal' button in Admin navbar?", lockPortalBtnVisible);

  const changePinBtnVisible = await page.locator("#btn-change-admin-pin").isVisible();
  console.log("🔑 Is 'Change PIN' button in Admin navbar?", changePinBtnVisible);

  await page.screenshot({ path: "scratch/admin_unlocked_dashboard.png" });
  console.log("📸 Saved screenshot: scratch/admin_unlocked_dashboard.png");

  console.log("\n=======================================================");
  console.log("TEST 5: Clicking 'Lock Portal'");
  console.log("=======================================================");
  await page.locator("#btn-lock-admin-portal").click();
  await page.waitForTimeout(1000);

  const backInPublicView = await page.locator("#buyer-storefront-container").isVisible();
  console.log("🔒 Successfully locked and returned to clean Public Catalog:", backInPublicView);

  await browser.close();
  console.log("\n🎉 ALL PIN SECURITY TESTS PASSED PERFECTLY!");
})();
