function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, 401);
}

function checkAuth(request, env) {
  const pin = env.ADMIN_PIN || "";
  const auth = request.headers.get("Authorization") || "";
  if (!pin) return false;
  return auth === `Bearer ${pin}`;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.ORDERS_KV) return json({ ok: false, error: "ORDERS_KV missing" }, 500);
  if (!checkAuth(request, env)) return unauthorized();

  const url = new URL(request.url);
  const onlyNew = url.searchParams.get("onlyNew") === "1";

  const listed = await env.ORDERS_KV.list({ prefix: "order:" });
  const keys = (listed.keys || []).map(k => k.name).sort().reverse().slice(0, 80);

  const values = await Promise.all(keys.map(k => env.ORDERS_KV.get(k)));
  let orders = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      const o = JSON.parse(values[i] || "null");
      if (!o) continue;
      o.key = o.key || keys[i];
      if (onlyNew && (o.status || "NEW") !== "NEW") continue;
      orders.push(o);
    } catch (e) {}
  }

  // sort by createdAt desc if present
  orders.sort((a,b) => String(b.createdAt||"").localeCompare(String(a.createdAt||"")));

  return json({ ok: true, count: orders.length, orders });
}
