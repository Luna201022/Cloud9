export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") || "de").toLowerCase();
  const max = Math.min(parseInt(url.searchParams.get("max") || "6", 10) || 6, 20);

  const feedsByLang = {
    de: [
      { url: "https://www.tagesschau.de/xml/rss2", cat: "de" },
      { url: "https://www.swr.de/swraktuell/rss.xml", cat: "lokal" }
    ],
    en: [{ url: "https://feeds.bbci.co.uk/news/rss.xml", cat: "welt" }],
    fr: [{ url: "https://www.france24.com/fr/rss", cat: "welt" }],
    it: [{ url: "https://www.rainews.it/rss/tutti.xml", cat: "welt" }],
    vi: [{ url: "https://vnexpress.net/rss/tin-moi-nhat.rss", cat: "welt" }]
  };

  const feeds = feedsByLang[lang] || feedsByLang.de;
  const results = [];
  const errors = [];

  for (const f of feeds) {
    try {
      const r = await fetch(f.url, { cf: { cacheTtl: 600 } });
      if (!r.ok) throw new Error("HTTP " + r.status);

      const txt = await r.text();
      const items = [...txt.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, max);

      for (const m of items) {
        const block = m[1];
        const title = pick(block, "title");
        const link = pickLink(block);
        const pubDate = pick(block, "pubDate");

        if (title && link) {
          results.push({
            title,
            link,
            date: pubDate || "",
            source: hostname(link),
            category: f.cat
          });
        }
      }
    } catch (e) {
      errors.push({ feed: f.url, error: String(e) });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    items: results.slice(0, max),
    errors
  }), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function pickLink(block) {
  let m = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m) return decodeHtml(m[1].trim());
  m = block.match(/<link[^>]*href="([^"]+)"/i);
  return m ? decodeHtml(m[1].trim()) : "";
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
    .replace(/&#39;/g, "'");
}
