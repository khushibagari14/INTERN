const { RATING_WORDS } = require('./extractor');


function cleanRecord(raw) {
  const title = (raw.title || '').trim();

  const priceMatch = (raw.priceRaw || '').match(/[\d.]+/);
  const price = priceMatch ? parseFloat(priceMatch[0]) : null;
  const currency = (raw.priceRaw || '').trim().charAt(0) || null;

  const rating = RATING_WORDS[raw.ratingWord] ?? null;

  const availabilityText = (raw.availabilityRaw || '').replace(/\s+/g, ' ').trim();
  const inStock = /in stock/i.test(availabilityText);
  const stockCountMatch = availabilityText.match(/\((\d+)\s+available\)/i);
  const stockCount = stockCountMatch ? parseInt(stockCountMatch[1], 10) : null;

  return {
    title,
    price,
    currency,
    rating,
    inStock,
    stockCount,
    detailUrl: raw.detailUrl || null,
  };
}

function cleanRecords(rawRecords) {
  return rawRecords
    .map(cleanRecord)
    // Drop anything we couldn't get a title for — not a usable record.
    .filter((r) => r.title.length > 0);
}

module.exports = { cleanRecord, cleanRecords };
