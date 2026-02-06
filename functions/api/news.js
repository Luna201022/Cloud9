// Cloudflare Pages Function: /api/news
// Returns JSON: { ok:true, items:[{title,link,date,source,category}] }
// Query params: lang=de|en|fr|it|vi, max=1..20, cat=mix|mainz|de|wetter|wirtschaft
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
  const max = Math.min(Math.max(parseInt(url.searchParams.get("max") || "20", 10) || 20, 1), 20);

  const key = new Request(url.toString(), request);

  // Try edge cache for 10 minutes
  try {
    const cache = caches.default;
    const cached = await cache.match(key);
    if (cached) return cached;
    const res = await buildResponse({ lang, cat, max });
    res.headers.set("cache-control", "public, max-age=600");
    res.headers.set("access-control-allow-origin", "*");
    res.headers.set("access-control-allow-methods", "GET, OPTIONS");
    await cache.put(key, res.clone());
    return res;
  } catch (e) {
    // If cache API fails for some reason, still serve.
    return await buildResponse({ lang, cat, max, noCache: true, error: e });
  }
}

async function buildResponse({ lang, cat, max, error }) {
  try {
    const feeds = resolveFeeds(lang, cat);

    // fetch all feeds in parallel, then flatten
    const fetched = await Promise.all(feeds.map(async (f) => {
      try {
        const r = await fetch(f.url, {
          headers: { "user-agent": "Cloud9Kaffee/1.0 (+news)" },
          cf: { cacheTtl: 600, cacheEverything: true },
        });
        if (!r.ok) return [];
        const txt = await r.text();
        const items = parseFeed(txt, max);
        return items.map(it => ({
          ...it,
          source: it.source || hostname(it.link || f.url) || f.sourceHint || "news",
          category: f.category,
        }));
      } catch {
        return [];
      }
    }));

    let items = fetched.flat();

    // Normalize & sort by date desc when possible
    items = items
      .filter(it => it && it.title && it.link)
      .map(it => ({
        title: clean(it.title),
        link: cleanLink(it.link),
        date: it.date ? clean(it.date) : "",
        source: it.source ? clean(it.source) : "news",
        category: it.category || "mix",
      }));

    items.sort((a, b) => (toTime(b.date) - toTime(a.date)));

    // cap
    items = items.slice(0, max);

    return json({ ok: true, items, note: error ? String(error) : undefined });
  } catch (e) {
    // Never throw 500 to the client; keep UI stable.
    return json({ ok: false, items: [], error: String(e) });
  }
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function resolveFeeds(lang, cat) {
  // DE categories: mix | mainz | de | wetter | wirtschaft
  const de = {
    mainz: [
      { category: "mainz", url: "https://www.swr.de/swraktuell/rheinland-pfalz/rss.xml", sourceHint: "swr.de" },
      { category: "mainz", url: "https://www.swr.de/swraktuell/rss.xml", sourceHint: "swr.de" },
      // optional local portal (if it exists it will be used; if not, it's safely ignored)
      { category: "mainz", url: "https://www.mainz.de/rss", sourceHint: "mainz.de" },
    ],
    de: [
      { category: "de", url: "https://www.tagesschau.de/xml/rss2", sourceHint: "tagesschau.de" },
    ],
    wirtschaft: [
      { category: "wirtschaft", url: "https://www.tagesschau.de/wirtschaft/index~rss2.xml", sourceHint: "tagesschau.de" },
      { category: "wirtschaft", url: "https://rss.dw.com/rdf/rss-de-all", sourceHint: "dw.com" },
    ],
    wetter: [
      { category: "wetter", url: "https://www.dwd.de/DWD/wetter/warnungen_aktuell/objekt_einbindung/rss/warnungen_rss.xml", sourceHint: "dwd.de" },
    ],
  };

  if (lang === "de") {
    if (cat === "mainz") return de.mainz;
    if (cat === "de" || cat === "deutschland") return de.de;
    if (cat === "wirtschaft") return de.wirtschaft;
    if (cat === "wetter") return de.wetter;
    // mix:
    return [...de.mainz, ...de.de, ...de.wirtschaft, ...de.wetter];
  }

  // Other langs keep simple mix (world-ish) and label as "mix"
  const byLang = {
    en: [{ category: "mix", url: "https://feeds.bbci.co.uk/news/rss.xml", sourceHint: "bbc.co.uk" }],
    fr: [{ category: "mix", url: "https://www.france24.com/fr/rss", sourceHint: "france24.com" }],
    it: [{ category: "mix", url: "https://www.rainews.it/rss/tutti.xml", sourceHint: "rainews.it" }],
    vi: [{ category: "mix", url: "https://vnexpress.net/rss/tin-moi-nhat.rss", sourceHint: "vnexpress.net" }],
  };
  return byLang[lang] || byLang.en;
}

function parseFeed(xml, limit) {
  const x = xml || "";
  // RSS
  const rssItems = [...x.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, limit).map(m => m[1]);
  if (rssItems.length) {
    return rssItems.map(block => ({
      title: pick(block, "title"),
      link: pick(block, "link") || pickAtomLink(block) || "",
      date: pick(block, "pubDate") || pick(block, "dc:date") || "",
      source: "",
    }));
  }

  // Atom
  const atomEntries = [...x.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].slice(0, limit).map(m => m[1]);
  if (atomEntries.length) {
    return atomEntries.map(block => ({
      title: pick(block, "title"),
      link: pickAtomLink(block) || pick(block, "link") || "",
      date: pick(block, "updated") || pick(block, "published") || "",
      source: "",
    }));
  }

  return [];
}

function pick(block, tag) {
  const re = new RegExp(`<${escapeRe(tag)}[^>]*>([\\s\\S]*?)<\\/${escapeRe(tag)}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickAtomLink(block) {
  // <link href="..."/>
  const m1 = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (m1) return decodeHtml(m1[1]);

  // <link>...</link>
  const m2 = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m2 ? decodeHtml(m2[1].trim()) : "";
}

function hostname(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function decodeHtml(s) {
  return String(s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function clean(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function cleanLink(s) {
  const v = clean(s);
  // Sometimes feeds provide relative or weird whitespace
  return v;
}

function toTime(d) {
  if (!d) return 0;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
