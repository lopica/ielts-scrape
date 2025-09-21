const britishScrape = require("./british-coucil");
const scrapeICPDP = require("./icpdp");

(async () => {
  try {
    await britishScrape();
    await scrapeICPDP();
    console.log("Scrapes done");
  } catch (err) {
    console.error("Scrape error:", err);
    process.exit(1);
  }
})();
