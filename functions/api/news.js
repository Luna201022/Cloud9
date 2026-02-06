// Cloudflare Pages Function: /api/news
// Server-side RSS fetch (avoids browser CORS). Returns lightweight JSON.
// Categories supported via ?cat=mix|world|weather|business|sport
// Language via ?lang=de|en|fr|it|vi, max via ?max=1..20

const RSS_TIMEOUT_MS = 8000;

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const catRaw = (url.searchParams.get("cat") || "mix").toLowerCase();
    const cat = normalizeCat(catRaw);
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    const feeds = getFeeds(lang);

    const results = [];
    const seen = new Set();

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, {
          cf: { cacheTtl: 600, cacheEverything: true },
          signal: AbortSignal.timeout ? AbortSignal.timeout(RSS_TIMEOUT_MS) : undefined
        });
        if (!r.ok) continue;

        const txt = await r.text();
        const parsed = parseFeed(txt);

        for (const it of parsed) {
          const title = (it.title || "").trim();
          const link = (it.link || "").trim();
          if (!title || !link) continue;
          if (seen.has(link)) continue;

          const category = classifyCategory(lang, link, title);

          // Apply category filter early to avoid unnecessary growth.
          if (cat !== "mix" && category !== cat) continue;

          seen.add(link);
          results.push({ title, link, date: pubDate || "", source: hostname(link), category });
          if (results.length >= max) break;
        }
      } catch (e) {
        // Ignore broken feeds/timeouts; do not throw 500.
      }
      if (results.length >= max) break;
    }

    return json({ ok: true, items: results.slice(0, max), lang, cat, max });
  } catch (e) {
    return json({ ok: false, items: [], error: String(e?.message || e) }, 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function normalizeCat(c) {
  // accept older/DE values
  const map = {
    deutschland: "world",
    welt: "world",
    wetter: "weather",
    wirtschaft: "business"
  };
  return map[c] || (["mix","world","weather","business","sport"].includes(c) ? c : "mix");
}

function getFeeds(lang) {
  // Keep this conservative: use a few stable feeds per language.
  switch (lang) {
    case "en":
      return [
        "https://feeds.bbci.co.uk/news/rss.xml"
      ];
    case "fr":
      return [
        "https://www.france24.com/fr/rss"
      ];
    case "it":
      return [
        "https://www.rainews.it/rss/tutti.xml"
      ];
    case "vi":
      return [
        "https://vnexpress.net/rss/tin-moi-nhat.rss"
      ];
    case "de":
    default:
      return [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.sportschau.de/rss/sportschau.rss",
        "https://www.swr.de/swraktuell/rss.xml",
        "https://merkurist.de/mainz/feed/"
      ];
  }
}

function parseFeed(xmlText) {
  // RSS: <item>...</item>
  const items = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  if (items.length) return items.map(block => ({
    title: pick(block, "title"),
    link: pickLink(block),
    pubDate: pick(block, "pubDate") || pick(block, "dc:date"),
    updated: pick(block, "updated"),
    description: pick(block, "description") || pick(block, "content:encoded")
  }));

  // Atom: <entry>...</entry>
  const entries = [...xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
  return entries.map(block => ({
    title: pick(block, "title"),
    link: pickAtomLink(block),
    pubDate: pick(block, "published"),
    updated: pick(block, "updated"),
    description: pick(block, "summary") || pick(block, "content")
  }));
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickLink(block) {
  // <link>https://..</link>
  const l = pick(block, "link");
  if (l && /^https?:\/\//i.test(l)) return l;

  // <link ...> inside Atom-ish blocks sometimes
  return pickAtomLink(block) || l;
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
    return "news";
  }
}

function classifyCategory(lang, link, title) {
  const u = (link || "").toLowerCase();
  const t = (title || "").toLowerCase();

  // shared
  const isSport = /\/sport\b|sport/.test(u) || /\bsport\b/.test(t);
  const isBusiness = /\/business\b|\/wirtschaft\b|boerse|konjunktur|markt|econom|économ|econo|kinh-doanh|business/.test(u) ||
                     /\bwirtschaft\b|\bboerse\b|\bmarkt\b|\bbusiness\b|\beconom/.test(t) ||
                     /\bkinh doanh\b/.test(t);
  const isWeather = /\/weather\b|\/wetter\b|meteo|thoi-tiet|tempo|wetter/.test(u) ||
                    /\bwetter\b|\bweather\b|\bmétéo\b|\bmeteo\b|\bthời tiết\b/.test(t);

  if (lang === "vi") {
    if (/the-thao|\/sport\b/.test(u) || /\bthể thao\b/.test(t)) return "sport";
    if (/kinh-doanh|\/business\b/.test(u) || /\bkinh doanh\b/.test(t)) return "business";
    if (/thoi-tiet|\/weather\b/.test(u) || /\bthời tiết\b/.test(t)) return "weather";
  }

  if (isWeather) return "weather";
  if (isBusiness) return "business";
  if (isSport) return "sport";
  return "world";
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
