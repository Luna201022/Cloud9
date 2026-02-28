export async function onRequest(context) {
  const { request, env } = context;

  const KV = env.MENU_KV;          // Pages KV binding name must be MENU_KV
  const ADMIN_PIN = env.ADMIN_PIN; // Pages secret/var ADMIN_PIN

  if (!KV) return json({ ok:false, error:"MENU_KV missing" }, 500);

  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "menu.de.json";

  // CORS (so admin.html can call the API)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === "GET") {
    const value = await KV.get(key);
    if (!value) return json({ ok:false, error:"not_found", key }, 404);

    // IMPORTANT: always return UTF-8 JSON (prevents mojibake)
    return new Response(value, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store, max-age=0",
      },
    });
  }

  if (request.method === "POST") {
    // Auth: Bearer <PIN> OR ?pin=...
    const pin = getPin(request, url);
    if (!ADMIN_PIN || pin !== ADMIN_PIN) {
      return json({ ok:false, error:"unauthorized" }, 401);
    }

    let raw = "";
    try {
      raw = await request.text();
    } catch {
      return json({ ok:false, error:"bad_body" }, 400);
    }

    // Normalize: parse + stringify -> stored KV is clean UTF-8 JSON
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      return json({ ok:false, error:"invalid_json", sample: raw.slice(0, 120) }, 400);
    }

    const normalized = JSON.stringify(obj, null, 2);
    await KV.put(key, normalized);
    return json({ ok:true, key }, 200);
  }

  return json({ ok:false, error:"method_not_allowed" }, 405);
}

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function getPin(request, url) {
  const h = request.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  const qp = url.searchParams.get("pin");
  return (qp || "").trim();
}
