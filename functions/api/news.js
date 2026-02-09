// Cloudflare Pages Function: /api/news
// Server-side RSS/Atom fetch (avoids browser CORS).
// Returns JSON: { ok:true, items:[{title,link,date,source,category}], errors?:[...] }

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
    // Aliases (keep URLs stable even if UI wording changes)
    const catNorm = (c) => {
      if (!c) return "mix";
      const x = String(c).toLowerCase();
      if (["deutschland"].includes(x)) return "germany";
      if (["ausland","welt","weltnachrichten"].includes(x)) return "world";
      return x;
    };
    const cat2 = catNorm(cat);

    // Special: Mainz (Merkurist) – HTML scrape (no RSS available)
    if (lang === "de" && cat2 === "mainz") {
      const items = await fetchMerkurist(max);
      return json({ ok: true, items });
    }
 // mix|world|weather|business|sport
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    const feeds = getFeeds(lang);
    const errors = [];
    const all = [];

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, {
          cf: { cacheTtl: 600, cacheEverything: true },
          headers: {
            // Some publishers block generic UA/Accept; this helps a lot.
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
        const items = parseFeed(txt, feedUrl);
        all.push(...items);
      } catch (e) {
        errors.push({ feedUrl, error: String(e?.message || e) });
      }
    }

    // De-dupe (same link or same title)
    const seen = new Set();
    const deduped = [];
    for (const it of all) {
      const k = (it.link || "") + "||" + (it.title || "");
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(it);
    }

    // Sort newest first (best-effort)
    deduped.sort((a, b) => (toTime(b.date) - toTime(a.date)));

    const filtered = filterByCategory(deduped, cat, lang).slice(0, max);

    return json({ ok: true, items: filtered, errors }, 200);
  } catch (e) {
    // Don't fail hard; keep frontend stable.
    return json({ ok: false, items: [], error: String(e?.message || e) }, 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function getFeeds(lang) {
  // Keep feeds simple + reliable.
  // Categories are derived via keyword filtering (so they work for all languages).
  const feedsByLang = {
    de: [
      "https://www.tagesschau.de/xml/rss2",
      "https://www.swr.de/swraktuell/rss.xml"
    ],
    en: [
      "https://feeds.bbci.co.uk/news/rss.xml",
      "https://rss.dw.com/rdf/rss-en-all"
    ],
    fr: [
      "https://rss.dw.com/rdf/rss-fr-all",
      "https://www.france24.com/fr/rss"
    ],
    it: [
      "https://rss.dw.com/rdf/rss-it-all",
      "https://www.ilpost.it/feed/"
    ],
    vi: [
      "https://vnexpress.net/rss/tin-moi-nhat.rss"
    ]
  };
  return feedsByLang[lang] || feedsByLang.de;
}

function parseFeed(txt, feedUrl) {
  // Try RSS <item> first
  const items = [];
  const rssItems = [...txt.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  for (const block of rssItems) {
    const title = pick(block, "title");
    const link = pickLink(block);
    const pubDate = pick(block, "pubDate") || pick(block, "dc:date");
    if (title && link) {
      items.push({
        title,
        link,
        date: pubDate || "",
        source: hostname(link || feedUrl),
        category: "mix"
      });
    }
  }

  // Atom <entry>
  const atomEntries = [...txt.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
  for (const block of atomEntries) {
    const title = pick(block, "title");
    const link = pickAtomLink(block);
    const updated = pick(block, "updated") || pick(block, "published");
    if (title && link) {
      items.push({
        title,
        link,
        date: updated || "",
        source: hostname(link || feedUrl),
        category: "mix"
      });
    }
  }

  return items;
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickLink(block) {
  // RSS: <link>https://..</link>
  const v = pick(block, "link");
  if (v) return v;
  // Sometimes: <link href="..."/>
  const m = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return m ? decodeHtml(m[1]) : "";
}

function pickAtomLink(entry) {
  // Atom: <link href="..."/>
  let m = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (m) return decodeHtml(m[1]);
  // Atom: <link>...</link>
  m = entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m ? decodeHtml(m[1]) : "";
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
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function toTime(v) {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}


async function fetchMerkurist(max) {
  const out = [];
  try {
    const r = await fetch("https://merkurist.de/mainz/", { cf: { cacheTtl: 300 } });
    if (!r.ok) return out;
    const html = await r.text();

    // crude extraction: pick links that look like article pages
    const seen = new Set();
    const rx = /<a[^>]+href="(\/mainz\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = rx.exec(html)) && out.length < max * 3) {
      const href = m[1];
      const raw = m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!raw || raw.length < 10) continue;
      const link = "https://merkurist.de" + href;
      if (seen.has(link)) continue;
      seen.add(link);
      out.push({
        title: raw,
        link,
        date: "",
        source: "merkurist.de",
        category: "mainz",
        description: ""
      });
    }
  } catch (e) {}
  return out.slice(0, max);
}

function filterByCategory(items, cat, lang) {
  if (!cat || cat === "mix") return items;
  if (cat === "world") return items; // "world" = unfiltered mix, just a label in UI

  const titleOf = (it) => (it.title || "").toLowerCase();

  const kw = {
    weather: [
      "wetter","sturm","regen","schnee","glätte","hitze","temperatur","warn","forecast","weather","storm","rain","snow","heat",
      "météo","tempête","pluie","neige","canicule","meteo","temporale","pioggia","neve","caldo",
      "thời tiết","bão","mưa","tuyết","nắng nóng"
    ],
    business: [
      "wirtschaft","konjunktur","börse","aktie","aktien","dax","eur","inflation","zins","bank","unternehmen","export",
      "economy","business","market","stock","inflation","interest rate","company","trade",
      "économie","bourse","marché","inflation","banque","entreprise",
      "economia","borsa","mercato","inflazione","banca","azienda",
      "kinh tế","chứng khoán","lạm phát","lãi suất","doanh nghiệp"
    ],
    sport: [
      "sport","fußball","bundesliga","champions league","dfb","wm","em","tor","match","spiel","trainer",
      "football","soccer","nba","nfl","nhl","mlb","match","tournament","olymp",
      "sport","football","match","tournoi","olymp",
      "sport","calcio","partita","serie a","olimpi",
      "thể thao","bóng đá","trận","giải","olympic"
    ]
  };

  const list = kw[cat] || [];
  const out = [];
  for (const it of items) {
    const tt = titleOf(it);
    if (list.some(k => tt.includes(k))) out.push({ ...it, category: cat });
  }
  return out;
}
