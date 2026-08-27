# Agent Change Log

Running log of changes made by the coding agent in this repo. Newest entries at the top.

## 2026-08-27

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
