
export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const cat = (url.searchParams.get("cat") || "mix").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "20", 10) || 20, 20);

    const feedsByLang = {
      de: {
        mix: [
          "https://www.tagesschau.de/xml/rss2",
          "https://www.swr.de/swraktuell/rss.xml"
        ],
        world: ["https://www.tagesschau.de/xml/rss2"],
        weather: ["https://www.wetter.com/wetternews/rss.xml"],
        business: ["https://www.tagesschau.de/xml/rss2"],
        sport: ["https://www.sportschau.de/index~rss2.xml"]
      },
      en: {
        mix: ["https://feeds.bbci.co.uk/news/rss.xml"],
        world: ["https://feeds.bbci.co.uk/news/world/rss.xml"],
        weather: ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"],
        business: ["https://feeds.bbci.co.uk/news/business/rss.xml"],
        sport: ["https://feeds.bbci.co.uk/sport/rss.xml"]
      },
      fr: {
        mix: ["https://www.france24.com/fr/rss"],
        world: ["https://www.france24.com/fr/rss"],
        weather: ["https://www.france24.com/fr/rss"],
        business: ["https://www.france24.com/fr/rss"],
        sport: ["https://www.france24.com/fr/rss"]
      },
      it: {
        mix: ["https://www.rainews.it/rss/tutti.xml"],
        world: ["https://www.rainews.it/rss/tutti.xml"],
        weather: ["https://www.rainews.it/rss/tutti.xml"],
        business: ["https://www.rainews.it/rss/tutti.xml"],
        sport: ["https://www.rainews.it/rss/tutti.xml"]
      },
      vi: {
        mix: ["https://vnexpress.net/rss/tin-moi-nhat.rss"],
        world: ["https://vnexpress.net/rss/the-gioi.rss"],
        weather: ["https://vnexpress.net/rss/thoi-su.rss"],
        business: ["https://vnexpress.net/rss/kinh-doanh.rss"],
        sport: ["https://vnexpress.net/rss/the-thao.rss"]
      }
    };

    const feeds = (feedsByLang[lang] && feedsByLang[lang][cat]) || feedsByLang.de.mix;
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
            results.push({ title, link, date: pubDate || "", source: hostname(link) });
          }
        }
      } catch (e) {}
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
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "news"; }
}

function decodeHtml(s) {
  return s.replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, "$1")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
}
