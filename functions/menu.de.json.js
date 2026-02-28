export async function onRequestGet({ env, next }) {
  // Public menu should reflect Admin changes (KV) immediately.
  // If KV has no menu yet, fall back to the repo file.
  const data = await env.MENU_KV.get("menu.de.json");
  if (data) {
    return new Response(data, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const resp = await next();
  return new Response(resp.body, {
    status: resp.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
