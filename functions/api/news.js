export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, test: "alive" }), {
    headers: { "content-type": "application/json" }
  });
}
