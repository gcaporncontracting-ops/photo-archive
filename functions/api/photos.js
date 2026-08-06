// Cloudflare Pages Function — served at /api/photos
// Nothing in this file is ever sent to the browser; it only runs server-side.
// This keeps the Drive API key, folder IDs, and the locked-room password hidden
// from anyone viewing the site's page source.

const DRIVE_API_KEY = "AIzaSyCICmLJb14gT4KYGbMLmAO2ZiqdTVuPK8g";

const FOLDERS = {
  leisure:   { label: "Leisure",   folderId: "1eAP-Cw3HOp-RzhprhFM1S5hpdfxmz4O1" },
  sport:     { label: "Sport",     folderId: "1sXJd89n6VPgvy2hwNr_g4S1o6CNod2NW" },
  work:      { label: "Work",      folderId: "1LGjJxIU4MrnXEV5DEc-K7e6oqH2XrdJb" },
  "under-age": { label: "Under-age", folderId: "13aiTKaOE0a4Ctz4jAnycdzdoqkVAWETC" },
  pets:      { label: "Pets",      folderId: "1OIedvh3PRDVVAL1nHh9yEyBIx3kZoAKa" },
  family:    { label: "Family",    folderId: "1TJcItwbFaOQONNEkRJlpvw1jB9ki-nxc" },
  locked:    { label: "Another Life",    folderId: "1NyKWB-3xXpJZ4Pf0EYA67B6joZ415n3b" },
};

const LOCKED_ROOMS = {
  locked: "shame",
};

function cors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const room = url.searchParams.get("room");
  const password = url.searchParams.get("password") || "";

  const folder = FOLDERS[room];
  if (!folder) {
    return new Response(JSON.stringify({ error: "unknown room" }), { status: 404, headers: cors() });
  }

  if (LOCKED_ROOMS[room] && password !== LOCKED_ROOMS[room]) {
    return new Response(JSON.stringify({ error: "wrong password" }), { status: 401, headers: cors() });
  }

  const q = encodeURIComponent(`'${folder.folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=name&key=${DRIVE_API_KEY}`;

  try {
    const res = await fetch(driveUrl);
    const data = await res.json();
    if (data.error) {
      return new Response(JSON.stringify({ error: "drive api error" }), { status: 502, headers: cors() });
    }
    const ids = (data.files || []).map((f) => f.id);
    return new Response(JSON.stringify({ label: folder.label, ids }), { headers: cors() });
  } catch (e) {
    return new Response(JSON.stringify({ error: "fetch failed" }), { status: 502, headers: cors() });
  }
}
