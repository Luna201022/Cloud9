// Cloudflare Pages Function: /api/news
// Server-side RSS/Atom fetch (avoids browser CORS).
// Returns JSON: { ok:true, items:[{title,link,date,source,category}], errors?:[...] }

export async function onRequestGet({ request }) {
  const url = new URL(request.url);

  const lang = normLang(url.searchParams.get("lang") || "de");
  const cat = normCat(url.searchParams.get("cat") || "mix"); // mix|deutschland|welt|wetter|wirtschaft|sport
  const max = clampInt(url.searchParams.get("max"), 20, 1, 20);

  const feedUrls = getFeeds(lang, cat);

  const items = [];
  const errors = [];

  // Fetch feeds sequentially (simple + avoids too many outgoing connections at once)
  for (const feed of feedUrls) {
    if (items.length >= max) break;

    try {
      const res = await fetch(feed, {
        cf: { cacheTtl: 600, cacheEverything: true },
        redirect: "follow",
        headers: {
          // Some publishers block default bot UAs; this helps.
          "User-Agent": "Mozilla/5.0 (Cloud9 Kaffee; +https://cloud9mainz.pages.dev)",
          "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, text/html;q=0.8,*/*;q=0.1"
        }
      });

      if (!res.ok) {
        errors.push({ feed, status: res.status });
        continue;
      }

      const txt = await res.text();
      const parsed = parseFeed(txt, feed, cat);

      for (const it of parsed) {
        if (items.length >= max) break;

        // de-dup by link+title
        if (!it.title || !it.link) continue;
        const key = (it.link + "||" + it.title).toLowerCase();
        if (items.some(x => (x.link + "||" + x.title).toLowerCase() === key)) continue;

        items.push(it);
      }
    } catch (e) {
      errors.push({ feed, error: String(e?.message || e) });
    }
  }

  // Sort by date desc if available
  items.sort((a, b) => toTime(b.date) - toTime(a.date));

  return json({ ok: true, lang, cat, items: items.slice(0, max), errors: errors.slice(0, 10) });
}

/* ---------------- helpers ---------------- */

function normLang(v) {
  v = String(v || "").toLowerCase().trim();
  return (["de", "en", "fr", "it", "vi"].includes(v)) ? v : "de";
}

function normCat(v) {
  v = String(v || "").toLowerCase().trim();
  const map = {
    "mix": "mix",
    "de": "deutschland",
    "deutschland": "deutschland",
    "world": "welt",
    "welt": "welt",
    "weather": "wetter",
    "wetter": "wetter",
    "business": "wirtschaft",
    "wirtschaft": "wirtschaft",
    "sport": "sport",
    "sports": "sport"
  };
  return map[v] || "mix";
}

function clampInt(v, fallback, min, max) {
  const n = parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getFeeds(lang, cat) {
  // Feeds are grouped by category (category is “what this feed roughly represents”).
  // For non-DE languages, "deutschland" is treated as "welt".
  if (lang !== "de" && cat === "deutschland") cat = "welt";

  const FEEDS = {
    de: {
      mix: [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.swr.de/swraktuell/rss.xml"
      ],
      deutschland: [
        "https://www.tagesschau.de/xml/rss2"
      ],
      welt: [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.dw.com/de/top-thema/s-9117?maca=de-rss-de-all-1119-rdf"
      ],
      wetter: [
        // If this is blocked/404, the function will just skip it.
        "https://www.dwd.de/DWD/wetter/warnings/rss/DE.rss",
        "https://www.tagesschau.de/xml/rss2"
      ],
      wirtschaft: [
        "https://www.tagesschau.de/wirtschaft/konjunktur/index~rss2.xml",
        "https://www.handelsblatt.com/contentexport/feed/schlagzeilen"
      ],
      sport: [
        "https://www.kicker.de/news/fussball/rss2.xml",
        "https://www.sportschau.de/index~rss2.xml"
      ]
    },

    en: {
      mix: [
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://rss.dw.com/rdf/rss-en-all"
      ],
      welt: [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.dw.com/rdf/rss-en-all"
      ],
      wetter: [
        "https://feeds.bbci.co.uk/weather/rss.xml",
        "https://feeds.bbci.co.uk/news/rss.xml"
      ],
      wirtschaft: [
        "https://feeds.bbci.co.uk/news/business/rss.xml",
        "https://rss.dw.com/rdf/rss-en-all"
      ],
      sport: [
        "https://feeds.bbci.co.uk/sport/rss.xml"
      ]
    },

    fr: {
      mix: [
        "https://www.france24.com/fr/rss",
        "https://www.lemonde.fr/rss/une.xml"
      ],
      welt: [
        "https://www.france24.com/fr/rss",
        "https://www.lemonde.fr/international/rss_full.xml"
      ],
      wetter: [
        // fallback – many weather providers block bots; if empty it will still not crash
        "https://www.lemonde.fr/rss/une.xml"
      ],
      wirtschaft: [
        "https://www.lemonde.fr/economie/rss_full.xml",
        "https://www.france24.com/fr/rss"
      ],
      sport: [
        "https://www.lemonde.fr/sport/rss_full.xml"
      ]
    },

    it: {
      mix: [
        "https://www.rainews.it/rss/tutti.xml",
        "https://www.ansa.it/sito/ansait_rss.xml",
        "https://rss.dw.com/rdf/rss-it-all"
      ],
      welt: [
        "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",
        "https://rss.dw.com/rdf/rss-it-all"
      ],
      wetter: [
        "https://www.rainews.it/rss/tutti.xml"
      ],
      wirtschaft: [
        "https://www.ansa.it/sito/notizie/economia/economia_rss.xml",
        "https://rss.dw.com/rdf/rss-it-all"
      ],
      sport: [
        "https://www.ansa.it/sito/notizie/sport/sport_rss.xml"
      ]
    },

    vi: {
      mix: [
        "https://vnexpress.net/rss/tin-moi-nhat.rss"
      ],
      welt: [
        "https://vnexpress.net/rss/the-gioi.rss"
      ],
      wetter: [
        "https://vnexpress.net/rss/thoi-su.rss"
      ],
      wirtschaft: [
        "https://vnexpress.net/rss/kinh-doanh.rss"
      ],
      sport: [
        "https://vnexpress.net/rss/the-thao.rss"
      ]
    }
  };

  const byLang = FEEDS[lang] || FEEDS.de;
  const list = byLang[cat] || byLang.mix || FEEDS.de.mix;

  // Ensure we always have at least one feed
  return (Array.isArray(list) && list.length) ? list : FEEDS.de.mix;
}

function parseFeed(xml, feedUrl, category) {
  const out = [];

  // RSS: <item>...</item>
  const rssItems = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);

  for (const block of rssItems) {
    const title = pick(block, "title");
    const link = pick(block, "link") || pickAtomLink(block);
    const date = pick(block, "pubDate") || pick(block, "dc:date") || pick(block, "date");

    if (title && link) {
      out.push({
        title,
        link,
        date: date || "",
        source: hostname(link) || hostname(feedUrl),
        category
      });
    }
  }

  // Atom: <entry>...</entry>
  const atomEntries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);

  for (const block of atomEntries) {
    const title = pick(block, "title");
    const link = pickAtomLink(block) || pick(block, "link");
    const date = pick(block, "updated") || pick(block, "published");

    if (title && link) {
      out.push({
        title,
        link,
        date: date || "",
        source: hostname(link) || hostname(feedUrl),
        category
      });
    }
  }

  return out;
}

function pick(block, tag) {
  const re = new RegExp(`<${escapeRe(tag)}[^>]*>([\\s\\S]*?)<\\/${escapeRe(tag)}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickAtomLink(entry) {
  // <link href="..."/>
  const m1 = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (m1) return decodeHtml(m1[1]);

  // <link>...</link>
  const m2 = entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m2 ? decodeHtml(m2[1].trim()) : "";
}

function hostname(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
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

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTime(d) {
  const t = Date.parse(String(d || ""));
  return Number.isFinite(t) ? t : 0;
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
