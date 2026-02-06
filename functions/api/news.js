// Cloudflare Pages Function: /api/news
// Server-side fetch (avoids browser CORS). Returns lightweight JSON: title, link, date, source, description.
// Legal-friendly: only headlines + short teaser + link.

const RSS_TIMEOUT_MS = 8000;
const GDELT_TIMEOUT_MS = 8000;

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(str) {
  return (str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function pickTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtmlEntities(m[1]).trim() : "";
}

function parseRSS(xml, sourceUrl, maxItems) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = pickTag(b, "title");
    let link = pickTag(b, "link");
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
      if (m) link = decodeHtmlEntities(m[1]);
    }
    const pubDate = pickTag(b, "pubDate") || pickTag(b, "updated") || pickTag(b, "published");
    const descRaw = pickTag(b, "description") || pickTag(b, "summary") || pickTag(b, "content");
    const description = stripTags(descRaw).slice(0, 160);

    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate,
      description,
      source: new URL(sourceUrl).hostname
    });
    if (items.length >= maxItems) break;
  }
  return items;
}

function feedsFor(lang) {
  // Use several RSS feeds per language to reduce "all blocked" risk.
  const feeds = {
    de: [
      "https://www.tagesschau.de/xml/rss2/",
      "https://www.deutschlandfunk.de/nachrichten-100.rss",
      "https://www.heise.de/rss/heise-atom.xml"
    ],
    en: [
      "https://feeds.bbci.co.uk/news/rss.xml",
      "https://www.euronews.com/rss?level=theme&name=news",
      "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
    ],
    fr: [
      "https://www.lemonde.fr/rss/une.xml",
      "https://www.euronews.com/rss?level=theme&name=news",
      "https://www.france24.com/fr/rss"
    ],
    it: [
      "https://www.ansa.it/sito/ansait_rss.xml",
      "https://www.euronews.com/rss?level=theme&name=news",
      "https://www.ilpost.it/feed/"
    ],
    vi: [
      "https://vnexpress.net/rss/tin-moi-nhat.rss",
      "https://thanhnien.vn/rss/home.rss",
      "https://www.euronews.com/rss?level=theme&name=news"
    ]
  };
  return feeds[lang] || feeds.en;
}

function gdeltQueryFor(lang) {
  // GDELT fallback: broad and safe queries so you always get something.
  // This is NOT copying articles; it's a public index + link out.
  const q = {
    de: "Germany OR Deutschland",
    en: "world OR Europe",
    fr: "France OR Europe",
    it: "Italia OR Europe",
    vi: "Vietnam OR Asia"
  };
  return q[lang] || q.en;
}

async function fetchWithTimeout(url, ms, headers = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "cloud9-news/1.0 (+Cloudflare Pages Function)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
        ...headers
      }
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function fetchRSS(lang, max) {
  const feeds = feedsFor(lang);
  const results = [];
  const errors = [];

  // sequential fetch keeps it simpler/safer for hosts that rate-limit; still fast enough (few feeds)
  for (const feedUrl of feeds) {
    try {
      const res = await fetchWithTimeout(feedUrl, RSS_TIMEOUT_MS);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const xml = await res.text();
      const items = parseRSS(xml, feedUrl, max);
      results.push(...items);
      if (results.length >= max) break;
    } catch (e) {
      errors.push({ feedUrl, error: String(e) });
    }
  }

  return { results, errors };
}

async function fetchGDELT(lang, max) {
  const errors = [];
  try {
    const query = encodeURIComponent(gdeltQueryFor(lang));
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=${max}&format=json`;
    const res = await fetchWithTimeout(url, GDELT_TIMEOUT_MS, { "Accept": "application/json" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const arts = (data.articles || []).slice(0, max);
    const items = arts.map(a => ({
      title: a.title || a.seendate || "News",
      link: a.url,
      pubDate: a.seendate || "",
      description: (a.sourceCountry ? `${a.sourceCountry} • ` : "") + (a.domain || ""),
      source: a.domain || "gdelt"
    })).filter(x => x.title && x.link);
    return { results: items, errors };
  } catch (e) {
    errors.push({ feedUrl: "gdelt", error: String(e) });
    return { results: [], errors };
  }
}

export async function onRequestGet({ request, env, context }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const max = Math.max(1, Math.min(10, parseInt(url.searchParams.get("max") || "6", 10)));

  const cacheKey = new Request(url.origin + `/api/news?lang=${lang}&max=${max}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const rss = await fetchRSS(lang, max);
  let items = rss.results;

  // Sort by date (if parsable)
  items.sort((a, b) => (Date.parse(b.pubDate || "") || 0) - (Date.parse(a.pubDate || "") || 0));

  let errors = rss.errors;

  // Fallback: if RSS yields nothing, try GDELT
  if (!items.length) {
    const gd = await fetchGDELT(lang, max);
    items = gd.results;
    errors = errors.concat(gd.errors);
  }

  const body = JSON.stringify({
    lang,
    updatedAt: new Date().toISOString(),
    items,
    errors
  });

  const resp = new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });

  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
