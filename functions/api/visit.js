// Cloudflare Pages Function — served at /api/visit
// Increments a simple running counter each time it's called, stored in the
// existing "GUESTBOOK" KV namespace under the key "visitor-count".

function cors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}

export async function onRequestGet(context) {
  const { env } = context;
  let count = 0;
  try {
    const raw = await env.GUESTBOOK.get("visitor-count");
    count = raw ? parseInt(raw, 10) : 0;
  } catch (e) {
    count = 0;
  }
  count += 1;
  await env.GUESTBOOK.put("visitor-count", String(count));

  return new Response(JSON.stringify({ count }), { headers: cors() });
}
