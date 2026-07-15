const fs = require('fs');
const path = require('path');
const { RobotsChecker } = require('./robotsChecker');
const { PoliteFetcher } = require('./politeFetcher');
const { extractListingPage } = require('./extractor');
const { cleanRecords } = require('./clean');

const BASE_URL = 'https://books.toscrape.com/';
const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';

// A real, identifying User-Agent. Real bots should name themselves and give
// a way to be contacted — swap the URL for your own project page/email
// before running this against a site you don't control.
const USER_AGENT =
  'FlyRankInternScraperBot/1.0 (+https://github.com/khushibagari14/INTERN; educational scraping exercise)';

// Be polite: wait at least this long between requests to the same site.
const MIN_DELAY_MS = 1000;

// Cap how many listing pages we crawl, so a practice run doesn't hammer the
// site for no reason. books.toscrape.com has 50 pages total; override with
// MAX_PAGES=50 (or any number) to crawl more.
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '5', 10);

const OUTPUT_PATH = path.join(__dirname, '..', 'output', 'books.json');

async function run() {
  console.log(`Starting scrape of ${BASE_URL}`);
  console.log(`User-Agent: ${USER_AGENT}`);
  console.log(`Rate limit: ${MIN_DELAY_MS}ms between requests`);
  console.log(`Page limit: ${MAX_PAGES}`);

  // 1. Check robots.txt before doing anything else.
  const robots = new RobotsChecker(BASE_URL, USER_AGENT);
  await robots.load();

  if (!robots.isAllowed('/catalogue/page-1.html')) {
    console.error('robots.txt disallows this path for our user-agent. Stopping.');
    process.exit(1);
  }
  console.log('robots.txt check passed — allowed to crawl catalogue pages.\n');

  const fetcher = new PoliteFetcher({ userAgent: USER_AGENT, minDelayMs: MIN_DELAY_MS });

  let currentUrl = START_URL;
  let pageCount = 0;
  const allRawRecords = [];

  // 2 & 3. Fetch + parse/extract, following pagination.
  while (currentUrl && pageCount < MAX_PAGES) {
    if (!robots.isAllowed(currentUrl)) {
      console.warn(`Skipping ${currentUrl} — disallowed by robots.txt`);
      break;
    }

    pageCount += 1;
    console.log(`Fetching page ${pageCount}: ${currentUrl}`);

    const res = await fetcher.get(currentUrl);

    if (res.status !== 200) {
      console.warn(`  -> got HTTP ${res.status}, stopping pagination here.`);
      break;
    }

    const { records, nextUrl } = extractListingPage(res.data, currentUrl);
    console.log(`  -> extracted ${records.length} records`);
    allRawRecords.push(...records);

    currentUrl = nextUrl;
  }

  // 4. Clean.
  const cleaned = cleanRecords(allRawRecords);
  console.log(`\nCleaned ${cleaned.length} of ${allRawRecords.length} raw records`);

  // 5. Structure + save.
  const output = {
    source: BASE_URL,
    scrapedAt: new Date().toISOString(),
    pagesCrawled: pageCount,
    recordCount: cleaned.length,
    records: cleaned,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved to ${OUTPUT_PATH}`);
}

run().catch((err) => {
  console.error('Scrape failed:', err.message);
  process.exit(1);
});
