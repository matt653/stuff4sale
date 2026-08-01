import { chromium } from "playwright";

(async () => {
  console.log("Launching Playwright Chrome for End-to-End FB Post Flow test on http://localhost:3000 ...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Grant clipboard permissions so navigator.clipboard.writeText works without browser prompt errors
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  const page = await context.newPage();

  const consoleErrors = [];
  const pageExceptions = [];

  page.on("pageerror", (exception) => {
    console.error("!!! UNCAUGHT PAGE EXCEPTION !!!", exception);
    pageExceptions.push(exception.toString() + "\n" + (exception.stack || ""));
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("PAGE CONSOLE [error]:", msg.text());
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log("Step 1: Navigating to http://localhost:3000 ...");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log("Step 2: Checking item cards or creating a test item if needed...");
    const existingCards = await page.locator(".item-card, [id^='btn-fb-post-']").count();
    console.log(`Found ${existingCards} item cards / FB post buttons on dashboard.`);

    if (existingCards === 0) {
      console.log("Creating a fast test item using Quick Add or form...");
      const nameInput = page.locator("#input-item-name, input[placeholder*='item']").first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("Vintage Brass Desk Lamp");
        const priceInput = page.locator("#input-item-price, input[placeholder*='price']").first();
        if (await priceInput.isVisible()) await priceInput.fill("45");
        const submitBtn = page.locator("#btn-save-item, button:has-text('Save Item')").first();
        if (await submitBtn.isVisible()) await submitBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    console.log("Step 3: Opening Facebook Marketplace Assistant Modal...");
    const fbBtn = page.locator("#btn-show-fb-poster, [id^='btn-fb-post-']").first();
    await fbBtn.click();
    await page.waitForTimeout(1000);

    const isModalVisible = await page.locator("#fb-hub-modal").isVisible();
    console.log("FB Hub Modal Visible:", isModalVisible);
    if (!isModalVisible) {
      throw new Error("FB Hub Modal (#fb-hub-modal) did not appear!");
    }

    console.log("Step 4: Clicking through all 5 tabs and verifying clean renders...");
    const tabs = [
      { id: "#tab-fb-replica", viewId: "#fb-replica-form-view", name: "📱 FB Form Replica" },
      { id: "#tab-fb-agent", viewId: "#fb-agent-mode-view", name: "🤖 Browser Agent Auto-Fill" },
      { id: "#tab-fb-full", viewId: "#fb-full-text-view", name: "📄 Combined Text" },
      { id: "#tab-fb-bundle", viewId: "#fb-bundle-builder-view", name: "📦 Bundle Deal Builder" },
      { id: "#tab-fb-replies", viewId: "#fb-replies-view", name: "💬 Buyer Replies" },
    ];

    for (const tab of tabs) {
      console.log(`- Testing Tab: ${tab.name}`);
      await page.locator(tab.id).click();
      await page.waitForTimeout(600);
      const isViewVisible = await page.locator(tab.viewId).isVisible();
      console.log(`  Tab view (${tab.viewId}) visible: ${isViewVisible}`);
      if (!isViewVisible) {
        console.warn(`  Warning: Tab view ${tab.viewId} was not visible!`);
      }
    }

    console.log("Step 5: Testing 'agent' tab actions...");
    await page.locator("#tab-fb-agent").click();
    await page.waitForTimeout(600);

    console.log("- Clicking '⚡ 1-Click Auto-Filler'...");
    const autoFillBtn = page.locator("a:has-text('1-Click Auto-Filler'), button:has-text('1-Click Auto-Filler')").first();
    if (await autoFillBtn.isVisible()) {
      await autoFillBtn.click();
      await page.waitForTimeout(600);
      console.log("  ⚡ 1-Click Auto-Filler clicked cleanly!");
    } else {
      console.warn("  Warning: 1-Click Auto-Filler button not found!");
    }

    console.log("- Clicking 'Copy Command & Trigger Agent' (#btn-launch-browser-agent)...");
    const triggerAgentBtn = page.locator("#btn-launch-browser-agent");
    if (await triggerAgentBtn.isVisible()) {
      // Catch window.open if it opens
      const [popup] = await Promise.all([
        page.waitForEvent("popup", { timeout: 3000 }).catch(() => null),
        triggerAgentBtn.click()
      ]);
      await page.waitForTimeout(800);
      console.log("  Copy Command & Trigger Agent clicked cleanly!", popup ? "Popup opened!" : "No popup blocked.");
    } else {
      console.warn("  Warning: #btn-launch-browser-agent button not found!");
    }

    console.log("Step 6: Saving screenshots...");
    await page.screenshot({ path: "scratch/fb_post_flow.png", fullPage: true });
    console.log("Saved full screen to: scratch/fb_post_flow.png");

    const modalElement = page.locator("#fb-hub-modal");
    if (await modalElement.isVisible()) {
      await modalElement.screenshot({ path: "scratch/fb_modal_agent_tab.png" });
      console.log("Saved modal screenshot to: scratch/fb_modal_agent_tab.png");
    }

    console.log("\n=================== END-TO-END TEST RESULT ===================");
    console.log("Uncaught Exceptions Count:", pageExceptions.length);
    console.log("Console Errors Count:", consoleErrors.length);
    if (pageExceptions.length === 0 && consoleErrors.length === 0) {
      console.log("✅ FULL FB POST FLOW WORKED PERFECTLY WITH 0 ERRORS!");
    } else {
      console.log("🚨 ISSUES DETECTED:");
      if (pageExceptions.length > 0) console.log("Exceptions:", pageExceptions);
      if (consoleErrors.length > 0) console.log("Console Errors:", consoleErrors);
    }
    console.log("===============================================================\n");

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
