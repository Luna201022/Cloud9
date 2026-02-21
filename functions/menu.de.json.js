export async function onRequestGet({ next }) {
  // Always serve the repository asset to avoid stale/corrupted KV content.
  // (KV can still be used by admin endpoints, but the public menu always comes from the file.)
  const resp = await next();
  return new Response(resp.body, {
    status: resp.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
