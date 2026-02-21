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

  const list = await env.ORDERS_KV.list({ prefix: "order:" });
  const keys = (list.keys || []).map(k => k.name);

  const orders = [];
  for (const key of keys) {
    try {
      const raw = await env.ORDERS_KV.get(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      orders.push(obj);
    } catch (e) {}
  }

  orders.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  return json({ ok: true, count: orders.length, orders }, 200, request);
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
