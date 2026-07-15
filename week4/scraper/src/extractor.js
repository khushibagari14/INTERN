const cheerio = require('cheerio');

const RATING_WORDS = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
};

// Parses one listing page's HTML and returns raw extracted records plus
// the "next page" link, if any. Extraction only — cleaning happens
// separately in clean.js.
function extractListingPage(html, pageUrl) {
  const $ = cheerio.load(html);
  const records = [];

  $('article.product_pod').each((_, el) => {
    const $el = $(el);

    const titleLinkEl = $el.find('h3 a');
    const title = titleLinkEl.attr('title');
    const relativeHref = titleLinkEl.attr('href');
    const detailUrl = relativeHref
      ? new URL(relativeHref, pageUrl).toString()
      : null;

    const priceRaw = $el.find('.price_color').first().text();

    const ratingClass = $el.find('p.star-rating').attr('class') || '';
    const ratingWord = ratingClass.replace('star-rating', '').trim();

    const availabilityRaw = $el.find('.instock.availability').text();

    records.push({
      title,
      priceRaw,
      ratingWord,
      availabilityRaw,
      detailUrl,
    });
  });

  const nextHref = $('li.next a').attr('href');
  const nextUrl = nextHref ? new URL(nextHref, pageUrl).toString() : null;

  return { records, nextUrl };
}

module.exports = { extractListingPage, RATING_WORDS };
