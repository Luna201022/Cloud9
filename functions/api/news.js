export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "6", 10) || 6, 20);

    const feedsByLang = {
      de: [
        "https://www.tagesschau.de/xml/rss2",
        "https://www.swr.de/swraktuell/rss.xml"
      ],
      en: [
        "https://feeds.bbci.co.uk/news/rss.xml"
      ],
      fr: [
        "https://www.france24.com/fr/rss"
      ],
      it: [
        "https://www.rainews.it/rss/tutti.xml"
      ],
      vi: [
        "https://vnexpress.net/rss/tin-moi-nhat.rss"
      ]
    };

    const feeds = feedsByLang[lang] || feedsByLang.de;

    const results = [];

    for (const feedUrl of feeds) {
      try {
        const r = await fetch(feedUrl, { cf: { cacheTtl: 600 } });
        if (!r.ok) continue;

        const txt = await r.text();

        const items = [...txt.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
          .slice(0, max)
          .map(m => m[1]);

        for (const block of items) {
          const title = pick(block, "title");
          const link = pick(block, "link");
          const pubDate = pick(block, "pubDate");

          if (title && link) {
            results.push({
              title,
              link,
              date: pubDate || "",
              source: hostname(link)
            });
          }
        }
      } catch (e) {
        // Feed kaputt? Ignorieren, nicht 500 werfen
      }
    }

    return new Response(JSON.stringify({ ok: true, items: results.slice(0, max) }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, items: [], error: String(e) }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
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
