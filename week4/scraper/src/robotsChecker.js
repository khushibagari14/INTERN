const axios = require('axios');
const { URL } = require('url');

// Fetches and parses robots.txt for a given origin, and tells us whether a
// given path is allowed for our bot's user-agent.
//
// This is a small, deliberately simple parser: it understands `User-agent`,
// `Disallow`, and `Allow` lines, matched against either our specific bot
// name or the wildcard `*` group. That covers the vast majority of real
// robots.txt files without pulling in a dependency.
class RobotsChecker {
  constructor(baseUrl, userAgent) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    this.rules = []; // { disallow: [...paths], allow: [...paths] }
    this.loaded = false;
  }

  async load() {
    const robotsUrl = new URL('/robots.txt', this.baseUrl).toString();
    try {
      const res = await axios.get(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (res.status !== 200 || typeof res.data !== 'string') {
        // No robots.txt, or it's unreachable -> treat as "everything allowed"
        this.loaded = true;
        return;
      }

      this._parse(res.data);
      this.loaded = true;
    } catch {
      // Network error fetching robots.txt -> fail safe by allowing nothing
      // extra, but also not blocking the whole run. We treat this the same
      // as "no robots.txt found".
      this.loaded = true;
    }
  }

  _parse(text) {
    const lines = text.split('\n').map((l) => l.trim());
    let currentGroups = [];
    let matchesUs = false;
    let matchesWildcard = false;

    const ourAgentLower = this.userAgent.toLowerCase();
    const disallowFor = { us: [], wildcard: [] };
    const allowFor = { us: [], wildcard: [] };

    for (const rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;

      const [rawKey, ...rest] = line.split(':');
      if (!rawKey || rest.length === 0) continue;
      const key = rawKey.trim().toLowerCase();
      const value = rest.join(':').trim();

      if (key === 'user-agent') {
        // A new User-agent line starts a new group (or continues one if
        // multiple User-agent lines appear back to back).
        const agent = value.toLowerCase();
        matchesWildcard = agent === '*';
        matchesUs = ourAgentLower.includes(agent) && agent !== '*';
        continue;
      }

      if (key === 'disallow' && value) {
        if (matchesUs) disallowFor.us.push(value);
        if (matchesWildcard) disallowFor.wildcard.push(value);
      }

      if (key === 'allow' && value) {
        if (matchesUs) allowFor.us.push(value);
        if (matchesWildcard) allowFor.wildcard.push(value);
      }
    }

    // Prefer rules specifically addressed to us; fall back to wildcard.
    this.disallow = disallowFor.us.length > 0 ? disallowFor.us : disallowFor.wildcard;
    this.allow = allowFor.us.length > 0 ? allowFor.us : allowFor.wildcard;
  }

  isAllowed(pathOrUrl) {
    if (!this.loaded) {
      throw new Error('RobotsChecker.load() must be called before isAllowed()');
    }
    const path = pathOrUrl.startsWith('http')
      ? new URL(pathOrUrl).pathname
      : pathOrUrl;

    const disallow = this.disallow || [];
    const allow = this.allow || [];

    // Longest matching rule wins (standard robots.txt precedence behavior).
    let bestMatch = { length: -1, allowed: true };

    for (const rule of disallow) {
      if (rule === '') continue; // empty Disallow means "allow everything"
      if (path.startsWith(rule) && rule.length > bestMatch.length) {
        bestMatch = { length: rule.length, allowed: false };
      }
    }
    for (const rule of allow) {
      if (path.startsWith(rule) && rule.length > bestMatch.length) {
        bestMatch = { length: rule.length, allowed: true };
      }
    }

    return bestMatch.allowed;
  }
}

module.exports = { RobotsChecker };
