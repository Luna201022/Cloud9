export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const max = Math.min(parseInt(url.searchParams.get("max") || "6", 10) || 6, 20);

  const feedsByLang = {
    de: [
      "https://www.tagesschau.de/xml/rss2",              // DE
      "https://www.swr.de/swraktuell/rss.xml",           // RLP/BW (Mainz-Region)
      "https://www.bbc.co.uk/news/rss.xml"              // Welt
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
        cf: { cacheTtl: 600, cacheEverything: true },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      items.push(...parseRss(xml, feedUrl));
      if (items.length >= max) break;
    }

    const out = items.slice(0, max).map(it => ({
      title: it.title,
      link: it.link,
      source: it.source,
      date: it.date,
    }));

    return new Response(JSON.stringify({ ok: true, items: out }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}

function parseRss(xml, feedUrl) {
  const source = hostname(feedUrl);
  const items = [];
  const blocks = xml.split(/<item\b[^>]*>/i).slice(1);
  for (const block of blocks) {
    const title = pick(block, "title");
    const link = pick(block, "link");
    const pubDate = pick(block, "pubDate") || pick(block, "updated");
    if (!title || !link) continue;
    items.push({
      title
