// Cloudflare Pages Function: /api/news
// Server-side RSS/Atom fetch (avoids browser CORS).
// Returns JSON: { ok:true, items:[{title,link,date,source,category}], errors?:[...] }

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const catRaw = (url.searchParams.get("cat") || "mix").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    // Category aliases (keep URLs stable even if UI wording changes)
    const catNorm = (c) => {
      if (!c) return "mix";
      const x = String(c).toLowerCase();
      if (["deutschland"].includes(x)) return "germany";
      if (["ausland", "welt", "weltnachrichten"].includes(x)) return "world";
      return x;
    };

    let cat = catNorm(catRaw);

    // Mainz removed (Merkurist has no stable RSS; HTML scraping is brittle and often blocked)
    if (cat === "mainz") cat = "mix";

    // For non-DE languages, "germany/world" categories are not reliable -> treat as mix.
    if (lang !== "de" && (cat === "germany" || cat === "world")) cat = "mix";

    const feeds = getFeeds(lang);
    const errors = [];
    const all = [];

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, {
          cf: { cacheTtl: 600, cacheEverything: true },
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Cloud9Zeitung/1.0; +https://cloud9mainz.pages.dev/)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            "Accept-Language": lang
          }
        });
        if (!r.ok) {
          errors.push({ feedUrl, status: r.status });
          continue;
        }
        const txt = await r.text();
        const parsed = parseFeed(txt, feedUrl);
        all.push(...parsed);
      } catch (e) {
        errors.push({ feedUrl, error: String(e?.message || e) });
      }
    }

    // De-duplicate by link
    const uniq = [];
    const seen = new Set();
    for (const it of all) {
      const key = (it.link || "").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      uniq.push(it);
    }

    // Category filtering (language-aware keywords)
    let items = uniq;
    if (cat !== "mix") items = filterByCategory(items, cat, lang);

    // If a category is empty, fall back to mix (better than showing nothing).
    if (!items.length && cat !== "mix") items = uniq;

    items = items.slice(0, max);

    return json({ ok: true, items, errors });
  } catch (e) {
    return json({ ok: false, items: [], error: String(e?.message || e) });
  }
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function getFeeds(lang) {
  // Multiple sources per language increases reliability (some publishers block server fetch).
  switch (lang) {
    case "fr":
      return [
        "https://www.france24.com/fr/rss",
        "https://www.rfi.fr/fr/rss",
        "https://feeds.bbci.co.uk/news/world/rss.xml"
      ];
    case "it":
      return [
        "https://www.ansa.it/sito/ansait_rss.xml",
        "https://www.rainews.it/rss/tutti.xml",
        "https://feeds.bbci.co.uk/news/world/rss.xml"
      ];
    case "en":
      return [
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://rss.dw.com/rdf/rss-en-all"
      ];
    case "vi":
      return [
        "https://vnexpress.net/rss/tin-moi-nhat.rss",
        "https://feeds.bbci.co.uk/news/world/rss.xml"
      ];
    case "de":
    default:
      return [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.swr.de/swraktuell/rss.xml"
      ];
  }
}

function parseFeed(txt, feedUrl) {
  // Detect Atom (<entry>) vs RSS (<item>)
  const isAtom = /<feed\b[\s\S]*?<entry\b/i.test(txt);
  const blocks = isAtom
    ? [...txt.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(m => m[0])
    : [...txt.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(m => m[0]);

  const out = [];
  for (const block of blocks) {
    const title = pick(block, "title");
    const link = isAtom ? pickAtomLink(block) : pick(block, "link");
    const date = pick(block, isAtom ? "updated" : "pubDate") || pick(block, "published") || "";

    if (!title || !link) continue;
    out.push({
      title: decodeHtml(title),
      link: decodeHtml(link),
      date: decodeHtml(date),
      source: hostname(link),
      category: guessCategory(title, hostname(link))
    });
  }
  return out;
}

function filterByCategory(items, cat, lang) {
  const keys = (KEYWORDS[lang] && KEYWORDS[lang][cat]) ? KEYWORDS[lang][cat] : null;
  if (!keys || !keys.length) {
    // DE-only: fallback keywords if missing language set
    return items.filter(it => (it.category || "mix") === cat);
  }
  return items.filter(it => {
    const hay = ((it.title || "") + " " + (it.source || "")).toLowerCase();
    return keys.some(k => hay.includes(k));
  });
}

function guessCategory(title, source) {
  const t = (title || "").toLowerCase();
  const s = (source || "").toLowerCase();
  // Very light heuristic used as fallback
  if (/(wetter|storm|weather|météo|meteo|thời tiết)/.test(t)) return "weather";
  if (/(wirtschaft|econom|économ|borsa|mercat|market|lạm phát|chứng khoán)/.test(t)) return "business";
  if (/(sport|fußball|football|calcio|tennis|nba|bundesliga|serie a)/.test(t)) return "sport";
  if (/(tagesschau\.de|swr\.de)/.test(s)) return "germany";
  return "mix";
}

// Language-aware keywords for category filtering (only for headline matching).
const KEYWORDS = {
  de: {
    weather: ["wetter", "sturm", "regen", "schnee", "glatteis", "unwetter", "orkan", "hochwasser", "hitze"],
    business: ["wirtschaft", "börse", "aktie", "markt", "inflation", "konjunktur", "unternehmen", "rezession"],
    sport: ["sport", "fußball", "bundesliga", "champions league", "tennis", "formel 1", "nba"],
    germany: ["deutschland", "bund", "berlin", "innenpolitik", "regierung", "bundestag"],
    world: ["ausland", "welt", "ukraine", "russland", "usa", "china", "israel", "gaza", "eu"]
  },
  en: {
    weather: ["weather", "storm", "rain", "snow", "heatwave", "flood"],
    business: ["business", "econom", "market", "stocks", "inflation", "company"],
    sport: ["sport", "football", "soccer", "nba", "tennis", "formula", "f1"]
  },
  fr: {
    weather: ["météo", "tempête", "pluie", "neige", "orages", "canicule", "inondation"],
    business: ["économie", "marché", "bourse", "inflation", "entreprise", "financ"],
    sport: ["sport", "football", "foot", "rugby", "tennis", "ligue", "nba"]
  },
  it: {
    weather: ["meteo", "maltempo", "pioggia", "neve", "temporale", "caldo", "alluvione"],
    business: ["econom", "mercat", "borsa", "inflazione", "azienda", "finanz"],
    sport: ["sport", "calcio", "serie a", "tennis", "nba", "formula", "f1"]
  },
  vi: {
    weather: ["thời tiết", "bão", "mưa", "nắng nóng", "lũ", "lụt", "băng tuyết"],
    business: ["kinh tế", "thị trường", "lạm phát", "doanh nghiệp", "chứng khoán", "giá vàng"],
    sport: ["thể thao", "bóng đá", "tennis", "nba", "f1"]
  }
};

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function pickAtomLink(entry) {
  // <link href="..."/>
  const m1 = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?>(?:<\/link>)?/i);
  if (m1) return m1[1];

  // <link>...</link>
  const m2 = entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m2 ? decodeHtml(m2[1]) : "";
}

function hostname(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "news";
  }
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
