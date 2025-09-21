const { chromium } = require("playwright");
const fs = require("fs");

const britishScrape = async () => {
  const browser = await chromium.launch({
    headless: false, // Đặt false để debug
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox", 
      "--disable-dev-shm-usage",
      "--disable-web-security",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Stealth techniques
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  await page.goto('https://ieltsregistration.britishcouncil.org/', { waitUntil: 'networkidle' });
  console.log('loaded');

  // Accept cookies if visible
  const acceptCookies = page.locator('button:has-text("Accept All Cookies")');
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click();
  }

  // 2. Click IELTS Academic
  await page.click("text=IELTS Academic");

  // 3. Select country
  await page.waitForSelector('input[placeholder*="Search by country"]');
  await page.fill('input[placeholder*="Search by country"]', "Vietnam");
  await page.waitForSelector('li:has-text("Vietnam")');
  await page.click('li:has-text("Vietnam")');

  // 4. Select city
  await page.fill('input[placeholder*="Search city"]', "Ha Noi");

  // Wait for the dropdown option to show up
  await page.waitForSelector('li:has-text("Hanoi")', { timeout: 5000 });

  // Click the option
  await page.click('li:has-text("Hanoi")');

  // Choose dates
  await page.waitForSelector('text="Let me choose the dates"', {
    timeout: 10000,
  });
  await page.click('text="Let me choose the dates"');

  // Make sure calendar is visible
  await page.waitForSelector('button[name="day"]', { timeout: 15000 });
  const calendar = page.locator('button[name="day"]').first();
  await calendar.scrollIntoViewIfNeeded();

  // Find all available days (have class .available)
  const availableDays = await page.$$eval(
    'button[name="day"].available',
    (buttons) =>
      buttons.map((btn) => ({
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        ariaLabel: btn.getAttribute("aria-label"),
      }))
  );

  if (availableDays.length === 0) {
    console.log("No available dates at all.");
    await browser.close();
    return;
  }

  // Pick the first available day as start date
  const startDay = availableDays[0].text;
  const startButton = page
    .locator(`button[name="day"].available:has-text("${startDay}")`)
    .first();
  await startButton.scrollIntoViewIfNeeded();
  await startButton.hover();
  await startButton.click();

  // Attempt to pick an end day 6 days after start (if available)
  let endDay = null;
  for (const d of availableDays) {
    if (parseInt(d.text) >= parseInt(startDay) + 6) {
      endDay = d.text;
      break;
    }
  }
  // fallback: last available day
  if (!endDay) endDay = availableDays[availableDays.length - 1].text;

  const endButton = page
    .locator(`button[name="day"].available:has-text("${endDay}")`)
    .first();
  await endButton.scrollIntoViewIfNeeded();
  await endButton.hover();
  await endButton.click();

  const searchBtn = page.locator('button:has-text("Search for tests")');
  await searchBtn.scrollIntoViewIfNeeded();
  await searchBtn.hover();
  await searchBtn.click();

  // 7. Wait for results
  await page.waitForSelector('[data-testid="results-container"]', {
    timeout: 60000,
  });

  // 8. Scrape test schedule items
  const tests = await page.$$eval(
    '[data-testid="results-container"] [data-examid]',
    (items) =>
      items.map((item) => ({
        venue: item
          .closest('[data-testid="page-container"]')
          ?.querySelector('[data-testid="venue-title"]')
          ?.textContent?.trim(),
        address: item
          .closest('[data-testid="page-container"]')
          ?.querySelector('[data-testid="venue-address"]')
          ?.textContent?.trim(),
        lrwDate: item
          .querySelector('[data-testid="lrw-date"]')
          ?.textContent?.trim(),
        lrwTime: item
          .querySelector('[data-testid="lrw-time"]')
          ?.textContent?.trim(),
        speakingDate: item
          .querySelector('[data-testid="speaking-date"]')
          ?.textContent?.trim(),
        speakingTime: item
          .querySelector('[data-testid="speaking-time"]')
          ?.textContent?.trim(),
        price: item
          .closest('[data-testid="page-container"]')
          ?.querySelector(".price-value")
          ?.textContent?.trim(),
      }))
  );

  // console.log(tests);
  fs.writeFileSync(
    "./data/british-coucil.json",
    JSON.stringify(tests, null, 2)
  );

  await browser.close();
};

module.exports = britishScrape;

// const britishScrape = require("./british-coucil")

// britishScrape()
