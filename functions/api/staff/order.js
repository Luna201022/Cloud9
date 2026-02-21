export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders(request) });
  }

  const auth = request.headers.get("Authorization") || "";
  const expected = `Bearer ${env.ADMIN_PIN || ""}`;
  if (!env.ADMIN_PIN || auth !== expected) {
    return json({ ok: false, error: "unauthorized" }, 401, request);
  }

  if (!env.ORDERS_KV) {
    return json({ ok: false, error: "ORDERS_KV missing" }, 500, request);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405, request);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: "invalid_json" }, 400, request); }

  const key = (body?.key || "").trim();
  if (!key.startsWith("order:")) {
    return json({ ok: false, error: "missing_or_invalid_key" }, 400, request);
  }

  const action = (body?.action || "").toLowerCase();
  const status = (body?.status || "").toUpperCase();

  if (action === "delete") {
    await env.ORDERS_KV.delete(key);
    return json({ ok: true, action: "delete", key }, 200, request);
  }

  if (!status) {
    return json({ ok: false, error: "missing_status" }, 400, request);
  }

  const raw = await env.ORDERS_KV.get(key);
  if (!raw) return json({ ok: false, error: "not_found" }, 404, request);

  let obj;
  try { obj = JSON.parse(raw); }
  catch { return json({ ok:false, error:"corrupt_order" }, 500, request); }

  obj.status = status;
  obj.updatedAt = Date.now();
  await env.ORDERS_KV.put(key, JSON.stringify(obj));

  return json({ ok: true, action: "status", key, status }, 200, request);
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}
function json(obj, status, request) {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders(request) });
}
