// Cloudflare Pages Function — served at /api/guestbook
// Requires a KV namespace bound to this Pages project as "GUESTBOOK"
// (Dashboard: your Pages project > Settings > Functions > KV namespace bindings)

const ADMIN_CODE = "94172079";

function cors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: cors() });
  }

  const { email, comment, category, flagged } = body;
  if (!email || !comment || !category) {
    return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: cors() });
  }

  const id = "g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const record = {
    email: String(email).slice(0, 320),
    comment: String(comment).slice(0, 5000),
    category: String(category).slice(0, 50),
    flagged: !!flagged,
    ts: new Date().toISOString(),
  };

  await env.GUESTBOOK.put(id, JSON.stringify(record));
  return new Response(JSON.stringify({ ok: true }), { headers: cors() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code !== ADMIN_CODE) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors() });
  }

  const list = await env.GUESTBOOK.list();
  const entries = [];
  for (const key of list.keys) {
    const val = await env.GUESTBOOK.get(key.name);
    if (val) entries.push(JSON.parse(val));
  }
  entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  return new Response(JSON.stringify({ entries }), { headers: cors() });
}
