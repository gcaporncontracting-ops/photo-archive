// Cloudflare Pages Function — served at /api/uploads
// Admin-only. Same admin code as functions/api/guestbook.js — keep both in sync
// if you ever change it.

const ADMIN_CODE = "94172079";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code !== ADMIN_CODE) {
    return json({ error: "unauthorized" }, 401);
  }

  const action = url.searchParams.get("action") || "list";

  if (action === "file") {
    const id = url.searchParams.get("id");
    const obj = await env.UPLOADS.get("uploads/" + id);
    if (!obj) {
      return new Response("not found", { status: 404, headers: cors() });
    }
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
        ...cors(),
      },
    });
  }

  // action === "list"
  const list = await env.GUESTBOOK.list({ prefix: "upload:" });
  const entries = [];
  for (const key of list.keys) {
    const val = await env.GUESTBOOK.get(key.name);
    if (val) entries.push(JSON.parse(val));
  }
  entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return json({ entries });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "invalid json" }, 400);
  }

  const { code, id, action } = body;
  if (code !== ADMIN_CODE) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!id || !action) {
    return json({ error: "missing fields" }, 400);
  }

  const kvKey = "upload:" + id;
  const raw = await env.GUESTBOOK.get(kvKey);
  if (!raw) {
    return json({ error: "not found" }, 404);
  }
  const record = JSON.parse(raw);

  if (action === "approve") {
    record.status = "approved";
    await env.GUESTBOOK.put(kvKey, JSON.stringify(record));
  } else if (action === "reject") {
    await env.UPLOADS.delete("uploads/" + id);
    await env.GUESTBOOK.delete(kvKey);
  } else {
    return json({ error: "unknown action" }, 400);
  }

  return json({ ok: true });
}
