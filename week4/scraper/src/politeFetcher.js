const axios = require('axios');

// A small "be a good citizen" HTTP client:
// - identifies itself with a descriptive User-Agent (including contact info,
//   as real bots are expected to)
// - enforces a minimum delay between requests to the same run
// - retries once on transient network failure
// - never throws on 4xx/5xx directly; callers decide what to do
class PoliteFetcher {
  constructor({ userAgent, minDelayMs = 1000 }) {
    this.userAgent = userAgent;
    this.minDelayMs = minDelayMs;
    this.lastRequestAt = 0;
  }

  async _waitForRateLimit() {
    const elapsed = Date.now() - this.lastRequestAt;
    const remaining = this.minDelayMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    this.lastRequestAt = Date.now();
  }

  async get(url, attempt = 1) {
    await this._waitForRateLimit();

    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 15000,
        validateStatus: () => true,
      });
      return res;
    } catch (err) {
      if (attempt < 2) {
        // one retry on network-level failure (timeout, DNS, connection reset)
        return this.get(url, attempt + 1);
      }
      throw err;
    }
  }
}

module.exports = { PoliteFetcher };
