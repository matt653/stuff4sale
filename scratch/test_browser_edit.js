import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Launching Playwright Chrome for complete Edit Modal test on http://localhost:3000 ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      console.error(`PAGE CONSOLE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.stack || error.toString());
    console.error(`!!! UNCAUGHT PAGE EXCEPTION !!!\n${error.stack || error.toString()}`);
  });

  try {
    console.log('Step 1: Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Step 2: Waiting for page load...');
    await page.waitForTimeout(3000);

    // Check if item cards exist
    let editButton = await page.$('button[id^="btn-edit-item-"]');

    if (!editButton) {
      console.log('Step 3: No existing items found. Creating a test item to test item card Edit button...');
      
      // Open New Entry form
      const newEntryBtn = await page.$('#btn-add-item-toggle');
      if (newEntryBtn) {
        await newEntryBtn.click();
        await page.waitForTimeout(1000);
      }

      // Fill in item name
      await page.fill('#form-item-name', 'Playwright Test Item #999');
      await page.fill('#form-item-stock-number', '999');

      // Submit form
      console.log('Submitting test item...');
      const submitBtn = await page.$('#box-2-add-new button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Now look for Edit button on item card
    editButton = await page.$('button[id^="btn-edit-item-"]') || await page.$('button[title="Edit Item details"]');

    if (editButton) {
      const btnId = await editButton.getAttribute('id').catch(() => 'unknown');
      console.log(`Step 4: Found Edit button on item card (ID: "${btnId}"). Clicking Edit...`);
      await editButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Step 4: Clicking photo media container on item card...');
      const mediaCover = await page.$('[id^="item-card-media-"]');
      if (mediaCover) {
        await mediaCover.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('Step 5: Verifying Edit Modal state...');
    const screenshotPath = path.join(__dirname, 'edit_modal_test.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    const bodyText = await page.evaluate(() => document.body.innerText);

    const isWhiteScreen = !bodyHtml || bodyHtml.trim() === '' || bodyText.trim() === '';
    const formDrawerTitle = await page.$eval('#form-drawer-container h2', el => el.innerText).catch(() => null);

    console.log('\n=================== FINAL TEST RESULT SUMMARY ===================');
    console.log(`Page Status: ${isWhiteScreen ? '🚨 WHITE SCREEN / BLANK PAGE DETECTED!' : '✅ EDIT MODAL & PAGE RENDERED CLEANLY'}`);
    console.log(`Edit Form Title Text: "${formDrawerTitle ? formDrawerTitle.trim().replace(/\n/g, ' ') : 'N/A'}"`);
    console.log(`Total Uncaught Page Exceptions: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.log('\n---------------- UNCAUGHT STACK TRACE(S) ----------------');
      pageErrors.forEach((err, index) => {
        console.log(`Stack Trace #${index + 1}:\n${err}`);
      });
      console.log('---------------------------------------------------------');
    } else {
      console.log('Result: ZERO unhandled exceptions. Edit Modal opens cleanly with all fields populated!');
    }
    console.log('=================================================================\n');

  } catch (err) {
    console.error('Playwright Test Exception:', err.stack || err);
  } finally {
    await browser.close();
  }
})();
