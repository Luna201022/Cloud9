export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
  const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

  const FEEDS = {
    // Germany / general
    de: {
      de: [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.swr.de/swraktuell/rss.xml",
      ],
      wirtschaft: [
        "https://www.tagesschau.de/wirtschaft/index~rss2.xml",
        "https://www.swr.de/swraktuell/wirtschaft/rss.xml",
        "https://www.handelsblatt.com/contentexport/feed/schlagzeilen",
      ],
      sport: [
        "https://www.tagesschau.de/sport/index~rss2.xml",
      ],
      wetter: [
        "https://www.tagesschau.de/wetter/index~rss2.xml",
      ],
      mainz: [
        // Merkurist doesn't offer a classic RSS; use their Google News sitemap.
        "https://merkurist.de/googlenewssitemap",
        "https://www.swr.de/swraktuell/rheinland-pfalz/rss.xml",
      ],
    },

    // Other languages keep simple
    en: { mix: ["https://feeds.bbci.co.uk/news/rss.xml"] },
    fr: { mix: ["https://www.france24.com/fr/rss"] },
    it: { mix: ["https://www.rainews.it/rss/tutti.xml"] },
    vi: { mix: ["https://vnexpress.net/rss/tin-moi-nhat.rss"] },
  };

  try {
    const feedSet = FEEDS[lang] || FEEDS.de;
    const map = feedSet[cat] || feedSet.mix || feedSet.de || [];
    let feedUrls = Array.isArray(map) ? map : [];

    // Mix: combine DE categories
    if (lang === "de" && cat === "mix") {
      feedUrls = [
        ...(feedSet.mainz || []),
        ...(feedSet.de || []),
        ...(feedSet.wetter || []),
        ...(feedSet.wirtschaft || []),
        ...(feedSet.sport || []),
      ];
    }

    const items = await collectItems(feedUrls, { maxPerFeed: max, totalMax: max, category: cat, lang });

    return json({ ok: true, items }, 200);
  } catch (e) {
    return json({ ok: false, items: [], error: String(e?.message || e) }, 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

async function collectItems(feedUrls, { maxPerFeed, totalMax, category, lang }) {
  const out = [];
  const seen = new Set();

  for (const feedUrl of feedUrls) {
    if (out.length >= totalMax) break;
    try {
      const r = await fetch(feedUrl, { cf: { cacheTtl: 300 } });
      if (!r.ok) continue;
      const txt = await r.text();

      let parsed = [];
      if (txt.includes("<urlset") && txt.includes("news:news")) {
        parsed = parseGoogleNewsSitemap(txt, feedUrl);
      } else if (txt.includes("<entry")) {
        parsed = parseAtom(txt, feedUrl);
      } else {
        parsed = parseRss(txt, feedUrl);
      }

      for (const it of parsed.slice(0, maxPerFeed)) {
        if (!it.link || seen.has(it.link)) continue;
        seen.add(it.link);
        out.push({
          title: it.title || "",
          link: it.link,
          date: it.date || "",
          source: it.source || hostname(it.link) || hostname(feedUrl),
          description: it.description || "",
          category: categoryLabel(lang, category),
        });
        if (out.length >= totalMax) break;
      }
    } catch {
      // ignore broken feed
    }
  }

  return out.slice(0, totalMax);
}

function categoryLabel(lang, cat) {
  if (lang !== "de") return cat;
  const m = {
    mix: "Mix",
    mainz: "Mainz",
    de: "Deutschland",
    wetter: "Wetter",
    wirtschaft: "Wirtschaft",
    sport: "Sport",
  };
  return m[cat] || "News";
}

function parseRss(xml, feedUrl) {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  return blocks.map(b => ({
    title: pick(b, "title"),
    link: pick(b, "link"),
    date: pick(b, "pubDate") || pick(b, "dc:date"),
    description: pick(b, "description"),
    source: hostname(pick(b, "link")) || hostname(feedUrl),
  })).filter(x => x.title && x.link);
}

function parseAtom(xml, feedUrl) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
  return entries.map(e => {
    const title = pick(e, "title");
    const date = pick(e, "updated") || pick(e, "published");
    const link = pickAtomLink(e);
    const desc = pick(e, "summary") || pick(e, "content");
    return { title, link, date, description: desc, source: hostname(link) || hostname(feedUrl) };
  }).filter(x => x.title && x.link);
}

function parseGoogleNewsSitemap(xml, feedUrl) {
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].map(m => m[1]);
  return urls.map(u => {
    const link = pick(u, "loc");
    const title = pickNs(u, "news:title");
    const date = pickNs(u, "news:publication_date");
    return {
      title,
      link,
      date,
      description: "",
      source: hostname(link) || hostname(feedUrl),
    };
  }).filter(x => x.title && x.link);
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(stripCdata(m[1]).trim()) : "";
}
function pickNs(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(stripCdata(m[1]).trim()) : "";
}

function pickAtomLink(entry) {
  // <link href="..."/>
  const m1 = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (m1) return m1[1];
  // <link>...</link>
  const m2 = entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m2 ? decodeHtml(stripCdata(m2[1]).trim()) : "";
}

function hostname(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function stripCdata(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
