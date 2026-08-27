# Agent Change Log

Running log of changes made by the coding agent in this repo. Newest entries at the top.

## 2026-08-27

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
