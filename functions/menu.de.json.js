export async function onRequestGet({ env }) {
  const key = "menu.de.json";
  const data = await env.MENU_KV.get(key);

  if (!data) {
    return new Response(
      JSON.stringify({ error: "Menu not set yet" }),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  return new Response(data, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
