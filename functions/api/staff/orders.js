function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, 401);
}

function readBearer(request) {
  const h = request.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function staffPin(env) {
  return env.STAFF_PIN || env.ADMIN_PIN || "";
}

export async function onRequestGet({ request, env }) {
  const pin = readBearer(request);
  if (!pin || pin !== staffPin(env)) return unauthorized();

  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") || 0);

  const raw = await env.MENU_KV.get("orders:list");
  let list = [];
  if (raw) { try { list = JSON.parse(raw); } catch { list = []; } }
  if (!Array.isArray(list)) list = [];

  // nur offene anzeigen
  const open = list.filter(o => (o.status === "NEW" || o.status === "ACK") && (!since || o.createdAt >= since));

  return json({ ok: true, orders: open });
}

export async function onRequestPost({ request, env }) {
  const pin = readBearer(request);
  if (!pin || pin !== staffPin(env)) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return json({ ok:false, error:"Invalid JSON" }, 400); }

  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !["ACK","DONE","CANCELLED"].includes(status)) {
    return json({ ok:false, error:"Bad request" }, 400);
  }

  const raw = await env.MENU_KV.get("orders:list");
  let list = [];
  if (raw) { try { list = JSON.parse(raw); } catch { list = []; } }
  if (!Array.isArray(list)) list = [];

  const idx = list.findIndex(o => o.id === id);
  if (idx === -1) return json({ ok:false, error:"Not found" }, 404);

  list[idx].status = status;
  list[idx].updatedAt = Date.now();
  await env.MENU_KV.put("orders:list", JSON.stringify(list));

  return json({ ok:true });
}
