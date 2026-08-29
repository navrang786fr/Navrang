# Changelog

Version shown in the order-page and admin-panel footers (`vYY.MM`). Bumped when a
meaningfully-sized batch of changes ships; entries are grouped by that version, newest first.

## v26.08 — 2026-08

**Admin panel**
- New **Category Master** (`admin/categories.html`, `ratings-api/api/categories.js`): edit a
  category's English/Telugu title and short label. Categories can't be added/removed here —
  their ids are load-bearing (`MENU_DATA` is keyed by them) — this edits display text only.
- Dish editor: the category dropdown is now editable when editing an existing dish (was
  locked to the category it was created in). The backend moves the dish between category
  arrays in `menu-data.js`, validates the target category exists, and records the move in
  the audit log.
- Dish photo re-uploads now get a content-hash cache-buster (`?v=<hash>`) appended to their
  stored `thumb`/`photo` paths, so replacing a dish's photo is guaranteed to show up on the
  customer order page instead of possibly being served stale from a browser/CDN cache.
- Added a version label to the admin sidebar footer.

**Order page**
- `menu-data.js` is now loaded with a cache-busting query string on every page view (order
  page and both printable menus), so a live admin edit reflects immediately instead of
  waiting out a stale cached copy of the file.
- Tapping anywhere on a dish row (not just the photo) opens its detail dialog; the dialog
  now shows a loading spinner while the photo loads.
- Category filter chips: clearer selected/unselected styling (solid border + brand color
  instead of low-contrast beige-on-beige) so they read as tappable filters; fixed a bug
  where clicking a chip didn't reliably highlight it (a scroll-spy observer was racing the
  click and re-highlighting the wrong chip mid-scroll-animation).
- Dish thumbnails enlarged (84px → 104px); dish list images and category icons now lazy-load.
- Floating quick-links (Offers / Rate Your Food / Instagram): the label text is now
  clickable, not just the icon.
- Removed the redundant header star "Rate" button (still reachable via the CTA and the
  floating quick-links).
- "Egg Curries" category now shows its intended egg-shaped icon (a stray photo reference
  was overriding it, same as every other category).
- Added a version label to the order-page footer.

**Data**
- Egg Burji's unused `ingredients`/`ingredientsTe` fields removed (dead UI text, nothing
  else in the menu used this field).
