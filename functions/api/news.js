export async function onRequest({ request }) {
  // CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }

  try {
    const url = new URL(request.url);
    const lang = (url.searchParams.get("lang") || "de").toLowerCase();
    const max = Math.min(parseInt(url.searchParams.get("max") || "6", 10) || 6, 20);

    const feedsByLang = {
      de: ["https://www.tagesschau.de/xml/rss2", "https://www.swr.de/swraktuell/rss.xml", "https://feeds.bbci.co.uk/news/rss.xml"],
      en: ["https://feeds.bbci.co.uk/news/rss.xml", "https://rss.dw.com/rdf/rss-en-all"],
      fr: ["https://www.france24.com/fr/rss", "https://feeds.bbci.co.uk/news/rss.xml"],
      it: ["https://www.rainews.it/rss/tutti.xml", "https://feeds.bbci.co.uk/news/rss.xml"],
      vi: ["https://vnexpress.net/rss/tin-moi-nhat.rss", "https://feeds.bbci.co.uk/news/rss.xml"]
    };
    const feeds = feedsByLang[lang] || feedsByLang.de;

    const items = [];
    for (const feedUrl of feeds) {
      const res = await fetch(feedUrl, {
        headers: { "user-agent": "Cloud9Cafe/1.0" },
        cf: { cacheTtl: 600, cacheEverything: true }
      });
      if (!res.ok) continue;
      const xml = await res.text();

      const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const block of blocks) {
        const title = pick(block, "title");
        const link = pickLink(block);
        const date = pick(block, "pubDate") || pick(block, "updated") || "";
        if (title && link) items.push({ title, link, date, source: hostname(link) });
        if (items.length >= max) break;
      }
      if (items.length >= max) break;
    }

    return json({ ok: true, items: items.slice(0, max) });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 200);
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decode(m[1].trim()) : "";
}

function pickLink(block) {
  const m1 = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (m1) return m1[1];
  const m2 = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return m2 ? decode(m2[1].trim()) : "";
}

function hostname(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "news"; }
}

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
