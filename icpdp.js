const { chromium } = require("playwright");
const fs = require('fs')

const scrapeICPDP = async () => {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Go to the page
  await page.goto("https://ielts.idp.com/vietnam/test-dates/hanoi/", {
    // waitUntil: "networkidle",
  });

  //   // Accept cookies if visible
  const acceptCookies = page.locator('button:has-text("Accept and Proceed")');
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click();
  }

  await page.waitForTimeout(2000);

  await page.waitForSelector('div[id="autom_filter_0"]', { timeout: 15000 });
  const typeExamFilter = page.locator('div[id="autom_filter_0"]').first();
  await typeExamFilter.scrollIntoViewIfNeeded();

  await page.click("#filterToogle_0 button");
  await page.waitForSelector('label:has-text("IELTS Academic")', {
    timeout: 5000,
  });
  await page.waitForTimeout(2000);
  await page.click('label:has-text("IELTS Academic")');

  await page.waitForTimeout(2000);
  await page.click("#input");

  const today = new Date();
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 7);

  // Function to parse aria-label like "Tuesday, September 23, 2025"
  function parseAriaDate(aria) {
    return new Date(aria);
  }

  // Grab all available dates
  const availableDates = page.locator(
    'div[role="gridcell"].ngb-dp-day:not(.disabled)'
  );
  const count1 = await availableDates.count();

  let startClicked = false;
  let startDateSelected, endDateSelected;

  await page.waitForTimeout(2000);

  for (let i = 0; i < 1; i++) {
    const dateElement = availableDates.nth(i);
    const ariaLabel = await dateElement.getAttribute("aria-label");
    const dateObj = parseAriaDate(ariaLabel);

    if (dateObj >= today) {
      await dateElement.click(); // click start date
      startDateSelected = dateObj;
      startClicked = true;
      break;
    }
  }

  if (!startClicked) {
    console.log("No available start date found");
    await browser.close();
    return;
  }

  await page.waitForTimeout(5000);

  // After clicking start date, get available dates again for end date
  const availableDates2 = page.locator(
    'div[role="gridcell"].ngb-dp-day:not(.disabled)'
  );
  const count2 = await availableDates2.count();

  for (let i = 0; i < count2; i++) {
    const dateElement = availableDates2.nth(i);
    const ariaLabel = await dateElement.getAttribute("aria-label");
    const dateObj = parseAriaDate(ariaLabel);

    if (dateObj >= nextDay) {
      await dateElement.click(); // click end date
      endDateSelected = dateObj;
      break;
    }
  }

  // Chờ container load xong
  await page.waitForTimeout(5000);

  // Lấy tất cả các container item (div có data-testid)
  const listingContainers = page.locator(
    'div[data-testid^="autom_listingpod_"]'
  );
  const containerCount = await listingContainers.count();

  const data = [];

  for (let c = 0; c < containerCount; c++) {
    const container = listingContainers.nth(c);

    // Lấy tất cả <a> bên trong container này
    const items = container.locator("a");
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);

      const link = await item.getAttribute("href");

      // Ngày thi
      const date = await item
        .locator("h2.heading2, h3.font-medium")
        .first()
        .innerText()
        .catch(() => null);

      // Giờ thi
      const time = await item
        .locator("h3.font-medium.no-wrap")
        .first()
        .innerText()
        .catch(() => null);

      // Module (IELTS Học thuật / IELTS General)
      const module = await item
        .locator("h3.heading4")
        .first()
        .innerText()
        .catch(() => null);

      // Địa điểm
      const location = await item
        .locator("span.location-event")
        .first()
        .innerText()
        .catch(() => null);

      // Giá tiền
      const price = await item
        .locator('span.test-details__text:has-text("VND")')
        .first()
        .innerText()
        .catch(() => null);

      data.push({
        link,
        date,
        time,
        module,
        location,
        price,
      });
    }
  }

  // console.log(data);
  fs.writeFileSync('./data/icpdp.json', JSON.stringify(data, null, 2));

  await browser.close();
}

module.exports = scrapeICPDP

