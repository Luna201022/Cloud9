// Cloudflare Pages Function: /api/news
// Returns JSON: { ok:true, items:[{title,link,date,source}] }
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

    // Feeds: keep at least one "stable" feed per language so the API doesn't go empty.
    // Categories are *best-effort*; we also filter by keywords.
    const feedsByLang = {
      de: {
        mix: [
          "https://www.tagesschau.de/xml/rss2",
          "https://www.swr.de/swraktuell/rss.xml"
        ],
        world: [
          "https://www.tagesschau.de/xml/rss2",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        weather: [
          "https://news.google.com/rss/search?q=Wetter%20Deutschland&hl=de&gl=DE&ceid=DE:de"
        ],
        business: [
          "https://www.tagesschau.de/xml/rss2"
        ],
        sport: [
          "https://www.tagesschau.de/xml/rss2"
        ],
      },
      en: {
        mix: [
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        world: [
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        weather: [
          "https://news.google.com/rss/search?q=weather&hl=en-US&gl=US&ceid=US:en"
        ],
        business: [
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        sport: [
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
      },
      fr: {
        mix: [
          "https://www.france24.com/fr/rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        world: [
          "https://www.france24.com/fr/rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        weather: [
          "https://news.google.com/rss/search?q=m%C3%A9t%C3%A9o&hl=fr&gl=FR&ceid=FR:fr"
        ],
        business: [
          "https://www.france24.com/fr/rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        sport: [
          "https://www.france24.com/fr/rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
      },
      it: {
        mix: [
          "https://www.ilpost.it/feed/",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        world: [
          "https://www.ilpost.it/feed/",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        weather: [
          "https://news.google.com/rss/search?q=meteo&hl=it&gl=IT&ceid=IT:it"
        ],
        business: [
          "https://www.ilpost.it/feed/",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        sport: [
          "https://www.ilpost.it/feed/",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
      },
      vi: {
        mix: [
          "https://vnexpress.net/rss/tin-moi-nhat.rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        world: [
          "https://vnexpress.net/rss/tin-moi-nhat.rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        weather: [
          "https://news.google.com/rss/search?q=th%E1%BB%9Di%20ti%E1%BA%BFt&hl=vi&gl=VN&ceid=VN:vi"
        ],
        business: [
          "https://vnexpress.net/rss/tin-moi-nhat.rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
        sport: [
          "https://vnexpress.net/rss/tin-moi-nhat.rss",
          "https://feeds.bbci.co.uk/news/rss.xml"
        ],
      }
    };

    const langFeeds = feedsByLang[lang] || feedsByLang.de;
    const feeds = (langFeeds[cat] || langFeeds.mix || feedsByLang.de.mix).slice();

    const all = [];
    const errors = [];

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, {
          cf: { cacheTtl: 600, cacheEverything: true },
          headers: {
            "user-agent": "Cloud9/1.0 (+https://cloud9mainz.pages.dev)",
            "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
          }
        });
        if (!r.ok) { errors.push({ feedUrl, status: r.status }); continue; }

        const txt = await r.text();
        const items = parseFeed(txt, feedUrl);
        for (const it of items) all.push(it);
      } catch (e) {
        errors.push({ feedUrl, error: String(e?.message || e) });
      }
    }

    // De-duplicate
    const seen = new Set();
    const uniq = [];
    for (const it of all) {
      const key = (it.link || "") + "|" + (it.title || "") + "|" + (it.source || "");
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(it);
    }

    // Category filtering (best-effort)
    const filtered = filterByCategory(uniq, cat, lang);

    // Sort by date (desc) if possible
    filtered.sort((a, b) => {
      const ta = Date.parse(a.date || "") || 0;
      const tb = Date.parse(b.date || "") || 0;
      return tb - ta;
    });

    return new Response(JSON.stringify({ ok: true, items: filtered.slice(0, max), errors }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, items: [], error: String(e?.message || e) }), { headers });
  }
}

function filterByCategory(items, cat, lang) {

  // For German sources we can be much more precise by URL path (Tagesschau etc.)
  if (lang === "de") {
    const pathMap = { weather: "/wetter", business: "/wirtschaft", sport: "/sport", world: "/ausland" };
    const p = pathMap[cat];
    if (p) {
      const byPath = items.filter(it => (it.link || "").includes(p));
      if (byPath.length >= 5) return byPath; // good enough
      // else fall back to keyword filter below
      items = byPath.length ? byPath.concat(items) : items; // keep some relevance
    }
  }
  if (!cat || cat === "mix") return items;

  // Keywords per language (very small list, but better than "DE only")
  const kw = {
    de: {
      weather: ["wetter", "sturm", "regen", "schnee", "glatteis", "warnung", "temperatur", "orkan", "unwetter"],
      business: ["wirtschaft", "börse", "aktie", "markt", "inflation", "zins", "bank", "export", "konjunktur", "unternehmen"],
      sport: ["sport", "bundesliga", "champions", "f1", "formel", "tennis", "fußball", "basketball", "handball", "wm", "em"],
      world: []
    },
    en: {
      weather: ["weather", "storm", "rain", "snow", "ice", "warning", "temperature", "flood", "wind"],
      business: ["business", "market", "stocks", "shares", "inflation", "rate", "bank", "economy", "trade", "company"],
      sport: ["sport", "football", "soccer", "tennis", "formula", "f1", "nba", "nfl", "champions", "olympic"],
      world: []
    },
    fr: {
      weather: ["météo", "tempête", "pluie", "neige", "alerte", "inond", "température", "vent"],
      business: ["économie", "bourse", "marché", "inflation", "banque", "taux", "entreprise", "commerce", "financ"],
      sport: ["sport", "football", "tennis", "formule", "f1", "ligue", "champion", "olymp"],
      world: []
    },
    it: {
      weather: ["meteo", "tempesta", "pioggia", "neve", "allerta", "inond", "temperatura", "vento"],
      business: ["economia", "borsa", "mercato", "inflazione", "banca", "tassi", "azienda", "finanz", "commercio"],
      sport: ["sport", "calcio", "tennis", "formula", "f1", "serie", "campion", "olimpi"],
      world: []
    },
    vi: {
      weather: ["thời tiết", "bão", "mưa", "tuyết", "cảnh báo", "nhiệt độ", "gió", "lũ"],
      business: ["kinh tế", "thị trường", "cổ phiếu", "lạm phát", "ngân hàng", "doanh nghiệp", "xuất khẩu", "tài chính"],
      sport: ["thể thao", "bóng đá", "tennis", "f1", "olymp", "giải", "vô địch"],
      world: []
    }
  };

  const dict = kw[lang] || kw.en;
  const list = dict[cat] || [];
  const lc = (s) => (s || "").toLowerCase();

  if (cat === "world") {
    // World = everything that is not obviously weather/business/sport
    const isOther = (title) => {
      const t = lc(title);
      const w = (dict.weather || []).some(k => t.includes(k.toLowerCase()));
      const b = (dict.business || []).some(k => t.includes(k.toLowerCase()));
      const s = (dict.sport || []).some(k => t.includes(k.toLowerCase()));
      return !(w || b || s);
    };
    return items.filter(it => isOther(it.title));
  }

  return items.filter(it => {
    const t = lc(it.title);
    return list.some(k => t.includes(k.toLowerCase()));
  });
}

function parseFeed(xml, feedUrl) {
  const out = [];
  const isAtom = /<entry[\s>]/i.test(xml);
  const blocks = isAtom
    ? [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(m => m[0])
    : [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(m => m[0]);

  for (const block of blocks) {
    const title = pick(block, "title");
    const link = pickLink(block);
    const date = pick(block, "pubDate") || pick(block, "updated") || pick(block, "dc:date") || "";
    if (!title || !link) continue;
    out.push({
      title,
      link,
      date,
      source: hostname(link) || hostname(feedUrl)
    });
  }
  return out;
}

function pick(block, tag) {
  const re = new RegExp(`<${escapeRe(tag)}[^>]*>([\\s\\S]*?)<\\/${escapeRe(tag)}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickLink(block) {
  // RSS <link>...</link>
  const l1 = pick(block, "link");
  if (l1 && /^https?:\/\//i.test(l1)) return l1;

  // Atom <link href="..."/>
  const m1 = block.match(/<link[^>]*href\s*=\s*"([^"]+)"/i);
  if (m1 && m1[1]) return decodeHtml(m1[1].trim());

  // RSS sometimes uses <guid isPermaLink="true">https://...</guid>
  const g = pick(block, "guid");
  if (g && /^https?:\/\//i.test(g)) return g;

  // Atom sometimes has <id>https://...</id>
  const id = pick(block, "id");
  if (id && /^https?:\/\//i.test(id)) return id;

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

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
