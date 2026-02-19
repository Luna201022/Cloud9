function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json({ ok: false, error: "No items" }, 400);

  const tableId = Number(body.tableId);
  const token = (body.token || null);

  // Optional: wenn du später Tisch-Token prüfen willst, hier einbauen
  // (z.B. tables in KV/D1). Für jetzt nur Basic-Validation:
  if (Number.isNaN(tableId)) {
    // tableId darf null sein, wenn noch kein QR genutzt wird
  }

  const order = {
    id: crypto.randomUUID(),
    tableId: Number.isFinite(tableId) ? tableId : null,
    items: items.map(i => ({
      id: String(i.id || ""),
      qty: Math.max(1, Number(i.qty) || 1),
      options: i.options || null
    })),
    note: body.note ? String(body.note) : null,
    total: Number(body.total) || null,
    status: "NEW",
    createdAt: Date.now()
  };

  const key = "orders:list";
  const raw = await env.MENU_KV.get(key);
  let list = [];
  if (raw) {
    try { list = JSON.parse(raw); } catch { list = []; }
  }
  if (!Array.isArray(list)) list = [];

  list.unshift(order);
  if (list.length > 200) list = list.slice(0, 200);

  await env.MENU_KV.put(key, JSON.stringify(list));

  return json({ ok: true, id: order.id });
}
