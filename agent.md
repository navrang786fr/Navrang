# Agent Change Log

Running log of changes made by the coding agent in this repo. Newest entries at the top.

## 2026-08-27

- **Done:** Batch of admin panel improvements (commits `149f93a`..`23253c0`, rebased twice onto real live admin edits — the user is actively using the deployed dishes editor, e.g. uploaded photos for Cool Drinks and Ice Cream mid-session):
  - Dish editor: auto-populate Telugu name from a word-level dictionary mined from existing dish names (offline, no translation API); explicit mutually-exclusive Veg/Non-Veg checkboxes; dish list now shows thumbnails. Caught and fixed a real bug during testing — the Telugu auto-fill left a stale suggestion in place when the English name changed to something with no dictionary match, instead of clearing it.
  - `_lib/requestInfo.js`: enriches audit-log and access-log entries with country/region/city (via Vercel's built-in `x-vercel-ip-*` headers, zero extra latency) and parsed device/browser/OS from User-Agent. Both log pages display it.
  - Rebuilt `admin/index.html` from a plain tile grid into a real dashboard (live stat cards, recent-changes/recent-signins feeds). Added a shared SVG icon set used in the nav and dashboard. Styled `<input type="date">` (was unstyled browser default). Removed the redundant standalone `ratings-dashboard.html` — `admin/ratings.html` (behind login) is now the only ratings viewer.
  - `navrang-menu.html`: enlarged the logo to 112px as an absolutely-positioned overlapping crest (so the header banner's own height didn't grow), added "ماشاءالله" top-right.

- **Done:** Added customer activity tracking (commit `edfa84f`) — `order-app.js` now tracks search queries (debounced, 2+ chars) and dish-photo views via `navigator.sendBeacon` to a new public `POST /api/track` endpoint, tagged with an anonymous per-tab session id (no PII). Data lands in `activity-log.json` in the private admin-db repo (never the public site). New `admin/activity.html`: summary stats, top-searches/most-viewed-items bar charts, date filter, recent-activity table. Verified the debounce/threshold logic on the real order page via Playwright, then a live POST+GET round-trip against the deployed endpoint.

- **Done:** Fixed `navrang-menu.html` (the printable A4 menu) and added the logo (commit `00d2647`). The item-population script only queried `.category`, but the "Chicken/Mutton/Seafood Curries" and "Navrang Specials" sections used different class names (`.curries`, `.specials`) — so those two sections, 26 of 98 dishes, silently never rendered. Added `.category` alongside their existing classes. Also added the `navrang_logo.png` image to the page-1 hero and page-2 running header (previously text-only). Confirmed via Playwright: 98/98 items now render across all 9 categories.
- **Done:** Three quick order-page requests, each verified with Playwright before committing (commits `03be4a5`, `3e134c2`, `20facf1`):
  - Stacked the Arabic brand text below "Navrang" in the topbar (was inline beside it).
  - Added a sequential integer `id` (primary key) to all 98 dishes in `MENU_DATA` — sets up the admin dish-editing API (in progress, see below) to match dishes by a stable id instead of by name.
  - Added a price-range filter (Any/Under ₹100/₹100–200/₹200–300/₹300+) next to the Veg/Top Picks toggles, bilingual, combined with the existing search/veg/top filters via a shared `applyFilters()`. Made `.search-bar` wrap instead of overflow on narrow screens to fit the new control.

- **Done:** Built and deployed the full JSON-DB-backed admin panel (commit `0ae3d7a`) — login, ratings viewer, dish-rate editor (create/update, including photo upload), audit log, access log. `[[navrang-admin-panel]]`
  - **Security blocker surfaced and resolved via user choice:** everything in the `navrang786fr/Navrang` repo's `main` branch is publicly served by GitHub Pages (same as `ratings.json` today) — storing credentials/audit/access logs there would make them publicly downloadable. Asked the user; they chose a **new private GitHub repo** (`navrang786fr/navrang-admin-db`) over the public repo or an external DB, and **hashed** (scrypt) passwords over plaintext.
  - Created the private repo via `gh repo create`, seeded one admin user (username `admin`, scrypt hash+salt — plaintext password shown to the user once in chat, never committed anywhere).
  - Vercel env vars on the `ratings-api` project (piped directly so no secret touched disk): `ADMIN_GITHUB_TOKEN` (reusing the `gh` CLI's own OAuth token — pragmatic since fine-grained PATs can't be created non-interactively; a tightening opportunity later), `ADMIN_REPO`, `JWT_SECRET` (hand-rolled HMAC session tokens, no `jsonwebtoken` dependency — matches ratings-api's zero-dependency style).
  - New endpoints: `login.js`, `dishes.js` (GET full menu; POST create/update, diffs old vs new fields for the audit log, handles optional photo upload), `audit-log.js`, `access-log.js`. Shared libs: `_lib/github.js` (binary-safe file read/write + JSON-array read-modify-write-with-retry), `_lib/auth.js` (scrypt + HMAC tokens), `_lib/menuData.js` (VM-sandboxed parse/regenerate of just the `MENU_DATA` block in menu-data.js, leaving `CATEGORY_META` untouched).
  - Dish edits still land in **this** repo's `menu-data.js` (order.html needs zero changes) — the admin DB only holds credentials + logs, not the menu itself.
  - **Image upload** (added mid-build per follow-up request): the dish form's photo picker resizes client-side via Canvas (500×500 and 100×100, center-cropped JPEG) and sends both plus the original (downscaled to max 1600px only if >3MB, to stay under Vercel's request-body limit) as base64; the server slugifies the dish name and stores `images/menu/original/<slug>.<ext>`, `images/menu/<slug>-500.jpg`, `images/menu/<slug>-100.jpg`, then sets `thumb`/`photo` on the dish automatically.
  - Tested at three levels before calling it done: unit tests against a mocked GitHub API (create/update/diff/image-upload/auth-failure/validation-failure), a real-browser Playwright test of the Canvas resize (confirmed actual 500×500/100×100 output), and a live smoke test against the deployed Vercel functions (real login, real dishes GET, real access-log entry) — deliberately did **not** live-test a POST create/update against production `menu-data.js` to avoid polluting it, since the mocked tests already covered that path exactly against the real Contents API request/response shape.
  - Pages: `admin/login.html`, `admin/index.html` (nav home), `admin/ratings.html`, `admin/dishes.html`, `admin/audit-log.html`, `admin/access-log.html`, shared `admin/admin-shared.js` (session/auth/nav) + `admin/admin-style.css`.

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
