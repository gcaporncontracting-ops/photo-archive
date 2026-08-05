# The Archive — deploy on GitHub + Cloudflare Pages (free)

## What's in here
- `index.html` — the whole site (title screen, guestbook, gallery, admin).
- `functions/api/guestbook.js` — a Cloudflare Pages Function. This is your API:
  it saves guestbook entries and lets the admin view them, backed by Cloudflare KV
  (a free key-value store). No separate server, no cost.

## 1. Push to GitHub
1. Create a new **public or private** repo on GitHub (e.g. `photo-archive`).
2. Upload these two items (`index.html` and the `functions/` folder) to the repo root,
   keeping the folder structure exactly as-is.

## 2. Connect Cloudflare Pages
1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Pick your repo.
3. Build settings: leave the build command **empty**, set output directory to `/`
   (this is a static site, nothing to build).
4. Click **Save and Deploy**. You'll get a free URL like
   `https://photo-archive-xyz.pages.dev` — that's your live site.

## 3. Add the KV store (this is what makes the guestbook actually work)
1. In the Cloudflare dashboard: **Workers & Pages** → **KV** → **Create namespace**,
   name it e.g. `guestbook`.
2. Go back to your Pages project → **Settings** → **Functions** →
   **KV namespace bindings** → **Add binding**.
   - Variable name: `GUESTBOOK` (must match exactly — this is what `guestbook.js` reads).
   - KV namespace: the one you just created.
3. Trigger a new deployment (push any small commit, or hit **Retry deployment**
   in the dashboard) so the Function picks up the binding.

That's it — every push to your GitHub repo auto-redeploys the site, free, with your
own `.pages.dev` URL (and you can attach a custom domain for free too, under
**Custom domains** in the Pages project).

## Notes
- The admin code is `94172079`, set at the top of `functions/api/guestbook.js` and
  again inside `index.html` (`ADMIN_CODE` constant) — change both if you want a new one.
- The banned words ("petrol", "kacela") and the 25-word minimum live near the top of
  the `<script>` block in `index.html`.
- The "signed once" check is stored in the visitor's browser (`localStorage`), so
  clearing browser data or switching devices resets it for that person — the
  guestbook data itself (admin's copy) is safe in KV regardless.
- **Google Drive images**: make sure every image file, and ideally the parent
  folders, are shared as "Anyone with the link – Viewer." Otherwise visitors
  outside your Google account will see broken images.
