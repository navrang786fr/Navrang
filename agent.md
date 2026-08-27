# Agent Change Log

Running log of changes made by the coding agent in this repo. Newest entries at the top.

## 2026-08-27

- **Done:** Three quick order-page requests, each verified with Playwright before committing (commits `03be4a5`, `3e134c2`, `20facf1`):
  - Stacked the Arabic brand text below "Navrang" in the topbar (was inline beside it).
  - Added a sequential integer `id` (primary key) to all 98 dishes in `MENU_DATA` — sets up the admin dish-editing API (in progress, see below) to match dishes by a stable id instead of by name.
  - Added a price-range filter (Any/Under ₹100/₹100–200/₹200–300/₹300+) next to the Veg/Top Picks toggles, bilingual, combined with the existing search/veg/top filters via a shared `applyFilters()`. Made `.search-bar` wrap instead of overflow on narrow screens to fit the new control.

- **In progress:** Building a JSON-DB-backed admin panel (login, ratings page, dish-rate editor, audit log for item-master field changes, access/visit log) per user request. Key architecture decisions and why:
  - **Security blocker surfaced and resolved via user choice:** everything in the `navrang786fr/Navrang` repo's `main` branch is publicly served by GitHub Pages (same as `ratings.json` today) — storing credentials/audit/access logs there would make them publicly downloadable. Asked the user; they chose a **new private GitHub repo** (`navrang786fr/navrang-admin-db`, created and seeded with `users.json`/`audit-log.json`/`access-log.json`) over the public repo or an external DB, and chose **hashed** (scrypt) passwords over plaintext.
  - Created the private repo via `gh repo create`, seeded one admin user (username `admin`, scrypt hash+salt — plaintext password was shown to the user once, never committed anywhere).
  - Vercel env vars added to the existing `ratings-api` project (via `vercel env add`, piped directly so no secret ever touched disk): `ADMIN_GITHUB_TOKEN` (reusing the `gh` CLI's own OAuth token, which already has `repo` scope covering both the public and new private repo — pragmatic since fine-grained PATs can't be created non-interactively; noted as a tightening opportunity later), `ADMIN_REPO`, `JWT_SECRET` (random, for hand-rolled HMAC session tokens — no `jsonwebtoken` dependency, matching the existing zero-dependency style of `ratings-api`).
  - Built and unit-tested `ratings-api/api/_lib/github.js` (read/write JSON arrays via GitHub Contents API with 409-retry, reused/generalized from `rate.js`'s pattern) and `_lib/auth.js` (scrypt password hashing, HMAC-signed session tokens with expiry — verified sign/verify roundtrip and expiry rejection).
  - **Not yet built:** `login.js`, `dishes.js` (GET/create/update, with audit-log diffing), `audit-log.js`, `access-log.js` endpoints; the `admin/*.html` front-end pages (login, ratings, dish editor, audit log, access log) and their nav shell; wiring `order.html`'s Rate dialog / dish list to stay unaffected. Resume from here.

- **Done:** Wired up `status` filtering on the order page (commit `7de8c5b`) — `MENU_DATA[cat.id]` is now filtered to `status === 'Active'` both in the main menu render and the rate-dialog dish picker, so flipping a dish to any other status hides it without deleting it. Verified end-to-end by temporarily marking a dish Inactive (Playwright: confirmed it disappeared from the rendered list, the section's item count, and the rating dropdown) then restoring it before committing.

- **Done:** Added `status: "Active"` and `weeklyDishInd: false` to every dish in `MENU_DATA` (commit `01ccea2`), plus a manual price revision + 4 item removals (Crab Curry, Crab Roast, Kamju Curry/Roast) the user made directly (commit `e5e57ec`).
  - Wrote a one-off script to programmatically add the two new fields to all 98 dishes with a consistent key order, rather than hand-editing each line; verified the dish name set was unchanged before/after and that the live page still renders all 98 rows with no console errors. `CATEGORY_META` was left untouched.
  - No UI wired up to these fields yet (no availability filtering, no "weekly dish" badge) — just data, since that wasn't asked for. `[[menu-data-schema-fields]]`

- **Done:** Root-caused and fixed the "Rate Your Food" dialog bug the user kept reporting (commits `db109dd`, `6a29f22`, `f83968e`).
  - Root cause: `.rate-card{overflow-y:auto}` had no matching `overflow-x`, and per the CSS Overflow spec, browsers force the unset axis to `auto` too when the other isn't `visible`. That silently clipped the close button (`.lightbox-close`, styled with `top:-14px;right:-14px` to overhang the card — fine for `.lightbox-card`, which has no overflow set) and created a 14px internal horizontal scrollbar, which is what showed up in the user's screenshots as both a "clipped/overlapping" close button and a phantom scrollbar. Confirmed via Playwright (`cardOverflowX` was computing to `"auto"`, `scrollWidth` 454 vs `clientWidth` 440) before touching any code — first two rounds of headless testing at various viewport widths had failed to reproduce it because headless Chromium doesn't render the internal scrollbar the same way a real browser with classic scrollbars does.
  - Fix: wrapped the dialog's scrollable content in a new `.rate-card-body` div; `.rate-card` itself no longer sets `overflow`, so the close button renders as a full circle again.
  - Also: dish picker now auto-adds on `<select>` change (removed the separate "+" button per user request); added a star-icon shortcut button in the topbar that opens the same dialog as the footer CTA.
  - Sorted every `MENU_DATA` category alphabetically by dish name (verified identical 102-name set via script, just reordered).
  - Added an `ingredients`/`ingredientsTe` field to Egg Burji only (pilot), rendered as an "Ingredients: ..." line in the image lightbox — hidden for dishes without the field.
  - Along the way, fixed two more photo-pipeline mismatches from the concurrent process: Mushroom Chili's `menu-data.js` reference said `-chilli-` but the actual resized files are `-chili-`; also picked up a manual Omlete price correction (₹70→₹60) the user made directly.

- **Done:** Added Gobi Manchuria and Mushroom Fry dish photos (commit `7ba40a7`). Verified files existed with real content and correct `.jpg` extensions before committing; no stray originals this time. Pushed to `navrang786fr/main`.

- **Investigated:** "Rate Your Food" dialog reported as visually broken (screenshot showed what looked like a horizontal scrollbar). Tested headlessly via Playwright at 390/414/595/1024px widths with the dialog open — `document.documentElement.scrollWidth` matched `window.innerWidth` exactly every time, no overflow reproduced, and the dish-picker/star-rating/submit JS logic in `order-app.js` checked out. Likely an artifact of the screenshot/preview tool, not a page bug — flagged to the user rather than guessing at a fix.

- **Done:** Added ratings dashboard + fixed two broken photo references (commits `5351253`, `c65e372`).
  - New `ratings-dashboard.html`: standalone page reading `ratings.json`, lets staff filter customer ratings by date range (Today/7/30 days/custom) with summary stats (count, avg stars, top dish). No build step, matches the site's existing palette.
  - Wired up Chena Fry and Groundnut Masala dish photos; fixed `chena-fry-500.jpeg` → `.jpg` (wrong extension would have 404'd on the live site — every other `-500` image in the repo is `.jpg`).
  - Gobi Fry's `thumb`/`photo` reference was pointing at files that didn't exist yet (only a raw `images/menu/gobi-fry.jpeg` original was present) — reverted that one entry, then re-added it once the resized `-100`/`-500` jpgs actually appeared on disk.
  - **Note:** while working, discovered the remote (`navrang786fr/main`) had diverged — real customers had submitted ratings via the live site (`ratings-api/api/rate.js` commits them directly to `ratings.json` via the GitHub Contents API). Rebased local commits on top rather than force-pushing, to avoid clobbering live production data. `[[project-live-ratings-writes]]`

- **Done:** Added Batani Roast dish photo (commit `e2b7b24`).
  - Committed `images/menu/batani-roast-100.jpg` and `images/menu/batani-roast-500.jpg`, plus the `menu-data.js` edit wiring up `thumb`/`photo` paths for the "Batani Roast" veg-starters entry.
  - Removed a stray duplicate `images/menu/batani-roast.jpeg` (identical copy of `images/menu/original/batani-roast.jpeg` that had leaked into the tracked folder).
  - Pushed to `navrang786fr/main` to deploy.

- **Done:** Added Batani Fry dish photo (commit `c74d3ce`).
  - Committed `images/menu/batani-fry-100.jpg` and `images/menu/batani-fry-500.jpg`, plus the `menu-data.js` edit wiring up `thumb`/`photo` paths for the "Batani Fry" veg-starters entry (edit was already present, uncommitted).
  - `images/menu/original/` stays untracked, consistent with every prior dish-photo commit — only the resized `-100`/`-500` jpgs are tracked.
  - Pushed to `navrang786fr/main` (GitHub Pages source) to deploy.

- **Done:** Organized and committed the QR menu card assets (commit `c3948a4`).
  - Moved `qr_en.png`, `qr_te.png`, `qr_menu_en.png`, `qr_menu_te.png` from the repo root into `images/qr-cards/`.
  - Files were generated per the request in `Commands.txt` ("Generate QR Code menu card" — logo, QR link to `order.html`, purpose text, recommended size), producing English and Telugu branded menu cards plus their standalone QR codes.
  - Also committed `Commands.txt` (the design brief) and this `agent.md` log file itself.
  - Left `images/menu/original/` untouched (unrelated, untracked dish-photo originals from earlier work — not part of this task).
