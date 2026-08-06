// Cloudflare Pages Function — served at /api/submit-photo
// Public endpoint: anyone can submit a photo here. Nothing goes live —
// it's stored as "pending" until approved via /api/uploads (admin only).
// Requires an R2 bucket bound as "UPLOADS" and reuses the existing "GUESTBOOK"
// KV namespace for metadata (different key prefix: "upload:").

const MAX_BYTES = 8 * 1024 * 1024; // 8MB per photo

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: "invalid form data" }, 400);
  }

  const file = form.get("photo");
  const name = (form.get("name") || "").toString().slice(0, 100);
  const comment = (form.get("comment") || "").toString().slice(0, 1000);

  if (!file || typeof file === "string") {
    return json({ error: "no photo provided" }, 400);
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return json({ error: "only image files are accepted" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "file too large (max 8MB)" }, 400);
  }

  const id = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  await env.UPLOADS.put("uploads/" + id, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const record = {
    id,
    name,
    comment,
    filename: file.name || "photo",
    contentType: file.type,
    size: file.size,
    ts: new Date().toISOString(),
    status: "pending",
  };
  await env.GUESTBOOK.put("upload:" + id, JSON.stringify(record));

  return json({ ok: true });
}
