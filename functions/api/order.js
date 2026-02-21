export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!env.ORDERS_KV) {
    return new Response(JSON.stringify({ ok: false, error: "ORDERS_KV missing" }), { status: 500, headers: { "Content-Type": "application/json", ...cors } });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  const tableId = body.tableId ?? null;
  const items = Array.isArray(body.items) ? body.items : [];
  const note = typeof body.note === "string" ? body.note : "";
  const total = typeof body.total === "number" ? body.total : null;

  if (!items.length) {
    return new Response(JSON.stringify({ ok: false, error: "No items" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  const cleanItems = items.map(it => ({
    id: String(it.id || ""),
    name: String(it.name || it.id || ""),
    qty: Math.max(1, parseInt(it.qty || 1, 10) || 1),
    options: it.options && typeof it.options === "object" ? it.options : {},
    unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : 0,
  })).filter(it => it.id);

  if (!cleanItems.length) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid items" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  const now = new Date().toISOString();
  const uid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  const key = `order:${Date.now()}:${uid}`;

  const order = {
    key,
    id: uid,
    tableId,
    items: cleanItems,
    note,
    total,
    status: "NEW",
    createdAt: now,
  };

  await env.ORDERS_KV.put(key, JSON.stringify(order));

  return new Response(JSON.stringify({ ok: true, key, id: uid }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
