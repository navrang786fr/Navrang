# Agent Change Log

Running log of changes made by the coding agent in this repo. Newest entries at the top.

## 2026-08-27

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
