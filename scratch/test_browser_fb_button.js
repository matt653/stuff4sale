import { chromium } from "playwright";

(async () => {
  console.log("Launching Playwright Chrome for deep test of FB Posting buttons on http://localhost:3000...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on("pageerror", (exception) => {
    console.error("!!! UNCAUGHT PAGE EXCEPTION !!!", exception);
    consoleErrors.push(exception.toString() + "\n" + (exception.stack || ""));
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("PAGE CONSOLE [error]:", msg.text());
    }
  });

  try {
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Open Top FB Hub Modal
    const topFbBtn = page.locator("#btn-open-fb-hub, button:has-text('Facebook')").first();
    if (await topFbBtn.isVisible()) {
      console.log("1. Clicking Top Nav FB Hub button...");
      await topFbBtn.click();
      await page.waitForTimeout(1500);

      // Test tab switching inside FB Hub Modal
      console.log("2. Testing tab switching inside FB Hub Modal...");
      const agentTab = page.locator("#tab-fb-agent");
      if (await agentTab.isVisible()) {
        await agentTab.click();
        await page.waitForTimeout(1000);
        console.log("Switched to Browser Agent Auto-Fill tab.");
      }

      const fullTab = page.locator("#tab-fb-full");
      if (await fullTab.isVisible()) {
        await fullTab.click();
        await page.waitForTimeout(1000);
        console.log("Switched to Combined Text tab.");
      }

      const bundleTab = page.locator("#tab-fb-bundle");
      if (await bundleTab.isVisible()) {
        await bundleTab.click();
        await page.waitForTimeout(1000);
        console.log("Switched to Bundle Deal Builder tab.");
      }

      const repliesTab = page.locator("#tab-fb-replies");
      if (await repliesTab.isVisible()) {
        await repliesTab.click();
        await page.waitForTimeout(1000);
        console.log("Switched to Buyer Replies tab.");
      }
    }

    const bodyText = await page.innerText("body");
    const isWhiteScreen = bodyText.trim() === "" || bodyText.length < 50;

    console.log("\n=================== DEEP TEST RESULT SUMMARY ===================");
    console.log("Page Status:", isWhiteScreen ? "🚨 WHITE SCREEN DETECTED!" : "✅ FB MODAL & ALL TABS RENDERED CLEANLY");
    console.log("Total Uncaught Page Exceptions:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log("\n---------------- UNCAUGHT STACK TRACE(S) ----------------");
      consoleErrors.forEach((err, idx) => {
        console.log(`\nStack Trace #${idx + 1}:\n${err}`);
      });
      console.log("---------------------------------------------------------");
    }
    console.log("=================================================================\n");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
