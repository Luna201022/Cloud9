// Cloudflare Pages Function: /api/news
// Returns JSON: { ok:true, items:[{title,link,date,source,category}] }

export async function onRequestGet({ request }) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300"
  };

  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    const feeds = getFeeds(lang, cat);
    const out = [];
    const seen = new Set();

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, {
          headers: { "user-agent": "Cloud9Kaffee/1.0 (+cloud9mainz.pages.dev)" },
          cf: { cacheTtl: 600 }
        });
        if (!r.ok) continue;

        const txt = await r.text();
        const items = parseFeed(txt);

        for (const it of items) {
          if (!it.title || !it.link) continue;
          const key = (it.link || it.title).trim();
          if (seen.has(key)) continue;
          seen.add(key);

          out.push({
            title: clean(it.title),
            link: it.link,
            date: it.date || "",
            source: hostname(it.link),
            category: cat
          });

          if (out.length >= max) break;
        }
        if (out.length >= max) break;
      } catch {
        // ignore broken feeds
      }
    }

    return new Response(JSON.stringify({ ok: true, items: out.slice(0, max) }), { headers });
  } catch (e) {
    // Keep status 200 so the UI can show a friendly message
    return new Response(JSON.stringify({ ok: false, items: [], error: String(e) }), { status: 200, headers });
  }
}

function getFeeds(lang, cat) {
  // Mainz removed (empty). Categories: mix, world, weather, business, sport
  const de = {
    mix: [
      "https://www.tagesschau.de/xml/rss2",
      "https://www.swr.de/swraktuell/rss.xml"
    ],
    world: [
      "https://www.tagesschau.de/ausland/index~rss2.xml",
      "https://feeds.bbci.co.uk/news/world/rss.xml"
    ],
    weather: [
      "https://www.dwd.de/DWD/warnungen/warnapp/rss_warn.rss",
      "https://www.tagesschau.de/inland/index~rss2.xml"
    ],
    business: [
      "https://www.tagesschau.de/wirtschaft/index~rss2.xml",
      "https://rss.dw.com/rdf/rss-de-wirtschaft"
    ],
    sport: [
      "https://www.sportschau.de/index~rss2.xml",
      "https://www.kicker.de/news/rss"
    ]
  };

  const en = {
    mix: ["https://feeds.bbci.co.uk/news/rss.xml"],
    world: ["https://feeds.bbci.co.uk/news/world/rss.xml"],
    weather: ["https://feeds.bbci.co.uk/news/rss.xml"],
    business: ["https://feeds.bbci.co.uk/news/business/rss.xml"],
    sport: ["https://feeds.bbci.co.uk/sport/rss.xml"]
  };

  const fr = {
    mix: ["https://www.france24.com/fr/rss"],
    world: ["https://www.france24.com/fr/rss"],
    weather: ["https://www.france24.com/fr/rss"],
    business: ["https://www.france24.com/fr/rss"],
    sport: ["https://www.france24.com/fr/rss"]
  };

  const it = {
    mix: ["https://www.rainews.it/rss/tutti.xml"],
    world: ["https://www.rainews.it/rss/tutti.xml"],
    weather: ["https://www.rainews.it/rss/tutti.xml"],
    business: ["https://www.rainews.it/rss/tutti.xml"],
    sport: ["https://www.rainews.it/rss/tutti.xml"]
  };

  const vi = {
    mix: ["https://vnexpress.net/rss/tin-moi-nhat.rss"],
    world: ["https://vnexpress.net/rss/the-gioi.rss"],
    weather: ["https://vnexpress.net/rss/thoi-su.rss"],
    business: ["https://vnexpress.net/rss/kinh-doanh.rss"],
    sport: ["https://vnexpress.net/rss/the-thao.rss"]
  };

  const byLang = { de, en, fr, it, vi };
  const sets = byLang[lang] || de;
  return (sets[cat] && sets[cat].length ? sets[cat] : sets.mix);
}

function parseFeed(xml) {
  // RSS <item> ... </item>
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  if (items.length) return items.map(parseRssItem);

  // Atom <entry> ... </entry>
  const entries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
  if (entries.length) return entries.map(parseAtomEntry);

  return [];
}

function parseRssItem(block) {
  const title = pick(block, "title");
  const link = pickLink(block);
  const date = pick(block, "pubDate") || pick(block, "dc:date") || pick(block, "date");
  return { title, link, date };
}

function parseAtomEntry(block) {
  const title = pick(block, "title");
  const link = pickAtomLink(block);
  const date = pick(block, "updated") || pick(block, "published");
  return { title, link, date };
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickLink(block) {
  // <link>...</link> OR <link>https://..</link>
  const m1 = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m1) return decodeHtml(m1[1].trim());

  // Some feeds use <guid isPermaLink="true">...</guid>
  const m2 = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  if (m2) return decodeHtml(m2[1].trim());

  return "";
}

function pickAtomLink(block) {
  // <link href="..."/>
  const m1 = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (m1) return m1[1];

  // <link>...</link>
  const m2 = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m2) return decodeHtml(m2[1].trim());

  return "";
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
    .replace(/&nbsp;/g, " ");
}

function clean(s) {
  return decodeHtml(String(s || "")).replace(/\s+/g, " ").trim();
}
