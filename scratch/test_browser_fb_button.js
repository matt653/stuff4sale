import { chromium } from "playwright";

(async () => {
  console.log("Launching Playwright Chrome to test FB Button on http://localhost:3000...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on("pageerror", (exception) => {
    console.error("!!! UNCAUGHT PAGE EXCEPTION !!!");
    console.error(exception);
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

    console.log("Looking for FB Hub / FB Ad buttons...");

    // Test Top Nav FB Hub button
    const topFbBtn = page.locator("#btn-open-fb-hub, button:has-text('Facebook')").first();
    if (await topFbBtn.isVisible()) {
      console.log("Clicking Top Nav FB Hub button...");
      await topFbBtn.click();
      await page.waitForTimeout(2000);

      const isModalVisible = await page.locator("#fb-hub-modal").isVisible();
      console.log("FB Hub Modal Visible:", isModalVisible);
    } else {
      console.log("Top FB Hub button not found.");
    }

    // Look for item card FB buttons
    const fbCardButtons = page.locator("[id^=btn-fb-post-]");
    const cardBtnCount = await fbCardButtons.count();
    console.log(`Found ${cardBtnCount} Item Card FB Ad buttons.`);

    if (cardBtnCount > 0) {
      console.log("Clicking first Item Card FB Ad button...");
      await fbCardButtons.first().click();
      await page.waitForTimeout(2000);

      const isModalVisible = await page.locator("#fb-hub-modal").isVisible();
      console.log("FB Hub Modal Visible after Card FB click:", isModalVisible);
    }

    const bodyText = await page.innerText("body");
    const isWhiteScreen = bodyText.trim() === "" || bodyText.length < 50;

    console.log("\n=================== TEST RESULT SUMMARY ===================");
    console.log("Page Status:", isWhiteScreen ? "🚨 WHITE SCREEN DETECTED!" : "✅ FB MODAL RENDERED CLEANLY");
    console.log("Total Uncaught Page Exceptions:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log("\n---------------- UNCAUGHT STACK TRACE(S) ----------------");
      consoleErrors.forEach((err, idx) => {
        console.log(`\nStack Trace #${idx + 1}:\n${err}`);
      });
      console.log("---------------------------------------------------------");
    }
    console.log("===========================================================\n");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
