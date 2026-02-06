export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const max = Math.min(parseInt(url.searchParams.get("max") || "6", 10) || 6, 20);

  const feedsByLang = {
    de: [
      "https://www.tagesschau.de/xml/rss2",
      "https://www.swr.de/swraktuell/rss.xml",
      "https://www.bbc.co.uk/news/rss.xml"
    ],
    en: [
      "https://www.bbc.co.uk/news/rss.xml",
      "https://rss.dw.com/rdf/rss-en-all"
    ],
    fr: [
      "https://www.france24.com/fr/rss",
      "https://www.bbc.co.uk/news/rss.xml"
    ],
    it: [
      "https://www.rainews.it/rss/tutti.xml",
      "https://www.bbc.co.uk/news/rss.xml"
    ],
    vi: [
      "https://vnexpress.net/rss/tin-moi-nhat.rss",
      "https://www.bbc.co.uk/news/rss.xml"
    ]
  };

  const feeds = feedsByLang[lang] || feedsByLang.de;

  try {
    const items = [];

    for (const feedUrl of feeds) {
      const res = await fetch(feedUrl, {
        headers: { "user-agent": "Cloud9Kaffee/1.0 (+rss)" },
        cf: { cacheTtl: 600, cacheEverything: true }
      });

      if (!res.ok) continue;

      const xml = await res.text();
      items.push(...parseRss(xml, feedUrl));

      if (items.length >= max) break;
    }

    return json({ ok: true, items: items.slice(0, max) }, 200);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}

function parseRss(xml, feedUrl) {
  const source = hostname(feedUrl);
  const out = [];
  const blocks = xml.split(/<item\b[^>]*>/i).slice(1);

  for (const block of blocks) {
    const title = pick(block, "title");
    const link = pick(block, "link");
    const date = pick(block, "pubDate") || "";
    if (!title || !link) continue;

    out.push({
      title: decodeHtml(title).trim(),
      link: decodeHtml(link).trim(),
      date: decodeHtml(date).trim(),
      source
    });
  }

  return out;
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function hostname(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "news";
  }
}

function decodeHtml(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
