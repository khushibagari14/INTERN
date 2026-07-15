# The Polite Scraper

A book-catalog scraper for [books.toscrape.com](https://books.toscrape.com) —
a site built specifically for scraping practice. Follows the pipeline:
**fetch → parse → extract → clean → structure**, with a "professionalism
layer": robots.txt compliance, rate limiting, and honest bot identification.

## What it does

1. **Checks `robots.txt`** before making any other request, and re-checks
   before every single page fetch. If a path is disallowed, the scraper
   skips it (or stops entirely if the very first page is disallowed).
2. **Fetches politely** — identifies itself with a descriptive
   `User-Agent` (name + contact URL, like a real bot should), and enforces
   a minimum delay between requests (1 second by default) so it never
   hammers the server.
3. **Parses** each listing page's HTML with `cheerio`.
4. **Extracts** raw fields per book: title, price, star rating, stock
   status, and a link to the book's detail page.
5. **Cleans** the raw strings into typed data — `"£51.77"` becomes the
   number `51.77` with `currency: "£"`; `"star-rating Three"` becomes
   `rating: 3`; `"In stock"` becomes `inStock: true`.
6. **Structures and saves** everything to `output/books.json`, following
   pagination ("next page" links) until it runs out of pages or hits the
   configured page limit.

## Setup

```bash
npm install
```

## Run it

```bash
node src/index.js
```

By default it crawls 5 pages (books.toscrape.com has 50 total). Override with:

```bash
MAX_PAGES=50 node src/index.js
```

Output goes to `output/books.json`, shaped like:

```json
{
  "source": "https://books.toscrape.com/",
  "scrapedAt": "2026-07-15T11:00:00.000Z",
  "pagesCrawled": 5,
  "recordCount": 100,
  "records": [
    {
      "title": "A Light in the Attic",
      "price": 51.77,
      "currency": "£",
      "rating": 3,
      "inStock": true,
      "stockCount": null,
      "detailUrl": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html"
    }
  ]
}
```

## Project structure

```
src/
  robotsChecker.js  - fetches and parses robots.txt, answers isAllowed(path)
  politeFetcher.js  - rate-limited HTTP client with a real User-Agent
  extractor.js      - HTML -> raw field extraction (cheerio selectors)
  clean.js          - raw strings -> typed, cleaned records
  index.js          - wires the pipeline together, handles pagination
output/
  books.json        - the final structured output (generated on run)
```

## Notes on the "professionalism layer"

- **robots.txt**: parsed manually (User-agent, Disallow, Allow groups),
  checked once at startup and again before every page fetch. Longest
  matching rule wins, matching standard robots.txt precedence.
- **Rate limiting**: a minimum 1-second gap is enforced between every
  request, regardless of how fast responses come back.
- **Identification**: the `User-Agent` string names the bot and links to
  where it came from — swap in your own contact info before pointing this
  at a site other than books.toscrape.com.
- If you point this at a different site, always re-check its
  `robots.txt` and terms of service first — this scraper was tested and
  tuned against books.toscrape.com's specific page structure.
