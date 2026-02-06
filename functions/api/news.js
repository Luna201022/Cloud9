// Cloudflare Pages Function: /api/news
// Server-side fetch (avoids browser CORS). Returns lightweight JSON: title, link, date, source, description.
// Categories: mix | mainz | deutschland | wetter | wirtschaft | sport

export async function onRequestGet({ request }) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    const { feeds, includeMerkurist } = getSources(lang, cat);

    const items = [];
    const seen = new Set();

    // Optional: Merkurist (Mainz) HTML scrape
    if (includeMerkurist) {
      const mItems = await fetchMerkurist(max);
      for (const it of mItems) pushUnique(items, seen, it, max);
    }

    // RSS sources
    for (const feedUrl of feeds) {
      if (items.length >= max) break;
      try {
        const r = await fetch(feedUrl, {
          cf: { cacheTtl: 600, cacheEverything: true },
          headers: { "user-agent": "Cloud9NewsBot/1.0 (+https://cloud9mainz.pages.dev)" }
        });
        if (!r.ok) continue;

        const txt = await r.text();
        const parsed = parseRss(txt, feedUrl, max);

        for (const it of parsed) {
          if (items.length >= max) break;
          pushUnique(items, seen, it, max);
        }
      } catch {
        // ignore single feed failure
      }
    }

    return new Response(JSON.stringify({ ok: true, lang, cat, items }), { status: 200, headers });
  } catch (e) {
    // Never throw 500 to the UI; return ok=false but status 200 so the frontend can show the error gracefully.
    return new Response(JSON.stringify({ ok: false, items: [], error: String(e) }), { status: 200, headers });
  }
}

function getSources(lang, cat) {
  // Non-DE stays language-based without categories for simplicity.
  if (lang !== "de") {
    const feedsByLang = {
      en: ["https://feeds.bbci.co.uk/news/rss.xml", "https://rss.dw.com/rdf/rss-en-all"],
      fr: ["https://www.france24.com/fr/rss"],
      it: ["https://www.rainews.it/rss/tutti.xml"],
      vi: ["https://vnexpress.net/rss/tin-moi-nhat.rss"]
    };
    return { feeds: feedsByLang[lang] || ["https://www.tagesschau.de/xml/rss2"], includeMerkurist: false };
  }

  const FEEDS = {
    tagesschau: "https://www.tagesschau.de/xml/rss2",
    swr: "https://www.swr.de/swraktuell/rss.xml",
    wetter: "https://wetter.com/wetter_rss/wetter.xml",
    sport: "https://www.sportschau.de/index~rss2.xml",
    dw: "https://rss.dw.com/rdf/rss-de-all"
  };

  // Categories (DE)
  switch (cat) {
    case "mainz":
      return { feeds: [FEEDS.swr], includeMerkurist: true };
    case "deutschland":
      return { feeds: [FEEDS.tagesschau], includeMerkurist: false };
    case "wetter":
      return { feeds: [FEEDS.wetter], includeMerkurist: false };
    case "wirtschaft":
      return { feeds: [FEEDS.dw], includeMerkurist: false };
    case "sport":
      return { feeds: [FEEDS.sport], includeMerkurist: false };
    case "mix":
    default:
      return { feeds: [FEEDS.tagesschau, FEEDS.swr, FEEDS.wetter, FEEDS.sport, FEEDS.dw], includeMerkurist: true };
  }
}

function parseRss(xml, feedUrl, max) {
  const out = [];
  const blocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  for (const block of blocks) {
    if (out.length >= max) break;

    const title = pick(block, "title");
    const link = pickLink(block);
    const pubDate = pick(block, "pubDate") || pick(block, "updated") || pick(block, "dc:date");
    const desc = pick(block, "description") || pick(block, "content:encoded");

    if (title && link) {
      out.push({
        title: tidy(title),
        link: tidy(link),
        date: tidy(pubDate || ""),
        source: hostname(link) || hostname(feedUrl),
        description: tidy(stripHtml(desc || ""))
      });
    }
  }
  return out;
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

// Some feeds use <link href="..."/> or <link>...</link> inside items.
// We prioritize <link> then fallback to href attribute.
function pickLink(block) {
  // <link>...</link>
  const m1 = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m1) return decodeHtml(m1[1].trim());

  // <link href="..."/>
  const m2 = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (m2) return decodeHtml(m2[1].trim());

  // <guid isPermaLink="true">...</guid>
  const m3 = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  if (m3) return decodeHtml(m3[1].trim());

  return "";
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
    .replace(/&nbsp;/g, " ");
}

function stripHtml(s) {
  return String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function tidy(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function pushUnique(arr, seen, it, max) {
  const link = (it.link || "").trim();
  if (!link || seen.has(link)) return;
  seen.add(link);
  arr.push(it);
  if (arr.length > max) arr.length = max;
}

// Merkurist has no stable public RSS. We do a best-effort scrape from the Mainz landing page.
async function fetchMerkurist(max) {
  const url = "https://merkurist.de/mainz/";
  try {
    const r = await fetch(url, {
      cf: { cacheTtl: 600, cacheEverything: true },
      headers: { "user-agent": "Cloud9NewsBot/1.0 (+https://cloud9mainz.pages.dev)" }
    });
    if (!r.ok) return [];

    const html = await r.text();

    // Try JSON-LD first (often present on news sites)
    const items = [];
    const re = /"headline"\s*:\s*"([^"]+)"[\s\S]*?"url"\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) && items.length < max) {
      const title = decodeHtml(m[1]);
      const link = decodeHtml(m[2]).replace(/\\\//g, "/");
      if (link && title) {
        items.push({
          title: tidy(title),
          link: link.startsWith("http") ? link : ("https://merkurist.de" + link),
          date: "",
          source: "merkurist.de",
          description: ""
        });
      }
    }

    if (items.length) return items;

    // Fallback: plain <a href="...">Title</a> (rough)
    const re2 = /<a[^>]+href="(https?:\/\/merkurist\.de\/mainz\/[^"]+)"[^>]*>([^<]{20,200})<\/a>/gi;
    while ((m = re2.exec(html)) && items.length < max) {
      const link = decodeHtml(m[1]);
      const title = stripHtml(decodeHtml(m[2]));
      items.push({ title: tidy(title), link, date: "", source: "merkurist.de", description: "" });
    }
    return items;
  } catch {
    return [];
  }
}
