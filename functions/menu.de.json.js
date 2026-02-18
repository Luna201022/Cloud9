export async function onRequestGet({ request, env, next }) {
  // 1) Erst KV versuchen
  const key = "menu.de.json";
  const data = await env.MENU_KV.get(key);

  if (data) {
    return new Response(data, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  // 2) Fallback: originale Datei aus dem Repo (Pages Asset) ausliefern
  // next() liefert die statische Datei /menu.de.json aus deinem GitHub-Deploy aus
  const resp = await next();
  // sicherstellen, dass es JSON bleibt
  return new Response(resp.body, {
    status: resp.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
