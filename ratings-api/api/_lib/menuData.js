// Parses and regenerates menu-data.js's MENU_DATA block, leaving everything
// else in the file (the header comment, CATEGORY_META) byte-for-byte intact.

const vm = require('vm');

const KEY_ORDER = ['id', 'name', 'nameTe', 'price', 'strike', 'veg', 'thumb', 'photo', 'top', 'ingredients', 'ingredientsTe', 'status', 'weeklyDishInd'];

function splitFile(raw) {
  const lines = raw.split(/\r?\n/);
  let closeIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '};') { closeIdx = i; break; }
  }
  if (closeIdx === -1) throw new Error('menu-data.js: could not find MENU_DATA closing "};"');
  const menuDataSrc = lines.slice(0, closeIdx + 1).join('\n');
  const restSrc = lines.slice(closeIdx + 1).join('\n');
  return { menuDataSrc, restSrc };
}

/** Safely evaluate the MENU_DATA block (trusted, admin-generated content) and return the object. */
function parseMenuData(raw) {
  const { menuDataSrc, restSrc } = splitFile(raw);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(menuDataSrc, sandbox);
  return { menuData: sandbox.MENU_DATA, restSrc };
}

/** Also parse CATEGORY_META from the rest of the file (for category id/title lookups). */
function parseCategoryMeta(restSrc) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(restSrc, sandbox);
  return sandbox.CATEGORY_META || [];
}

function serializeVal(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(function (x) { return JSON.stringify(x); }).join(', ') + ']';
  return String(v);
}

function serializeDish(d) {
  const parts = [];
  KEY_ORDER.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(d, k)) parts.push(k + ': ' + serializeVal(d[k]));
  });
  Object.keys(d).forEach(function (k) {
    if (KEY_ORDER.indexOf(k) === -1) parts.push(k + ': ' + serializeVal(d[k]));
  });
  return '{ ' + parts.join(', ') + ' }';
}

/** Rebuild the full menu-data.js file text from a (mutated) MENU_DATA object + the untouched rest-of-file text. */
function serializeMenuDataFile(menuData, restSrc) {
  const catOrder = Object.keys(menuData);
  let out = '/* Navrang menu data — edit prices/items here; the page renders from this object. */\n';
  out += 'var MENU_DATA = {\n';
  catOrder.forEach(function (catId, ci) {
    out += '  "' + catId + '": [\n';
    const items = menuData[catId];
    items.forEach(function (item, ii) {
      out += '    ' + serializeDish(item) + (ii < items.length - 1 ? ',' : '') + '\n';
    });
    out += '  ]' + (ci < catOrder.length - 1 ? ',' : '') + '\n';
  });
  out += '};';
  const joined = out + '\n' + restSrc;
  return joined.endsWith('\n') ? joined : joined + '\n';
}

/** Rebuild the CATEGORY_META block (header comment + declaration) from a (mutated) categories array. */
function serializeCategoryMetaFile(categories) {
  let out = '/* Category display order, titles and icons — shared by the printed menu and the order app. */\n';
  out += 'var CATEGORY_META = [\n';
  categories.forEach(function (c, i) {
    const firstLineKeys = ['id', 'title', 'titleTe', 'short', 'shortTe'];
    const firstLine = firstLineKeys.map(function (k) { return k + ': ' + JSON.stringify(c[k]); }).join(', ') + ',';
    out += '  { ' + firstLine + '\n';
    if (c.image) out += '    image: ' + JSON.stringify(c.image) + ',\n';
    out += '    icon: ' + JSON.stringify(c.icon) + ' }' + (i < categories.length - 1 ? ',' : '') + '\n';
  });
  out += '];\n';
  return out;
}

function findCategoryById(categories, id) {
  return categories.find(function (c) { return c.id === id; }) || null;
}

function findDishById(menuData, id) {
  for (const catId in menuData) {
    const idx = menuData[catId].findIndex(function (d) { return d.id === id; });
    if (idx !== -1) return { catId, idx, dish: menuData[catId][idx] };
  }
  return null;
}

function nextId(menuData) {
  let max = 0;
  Object.values(menuData).forEach(function (items) {
    items.forEach(function (d) { if (typeof d.id === 'number' && d.id > max) max = d.id; });
  });
  return max + 1;
}

/** Next incremental category id (a string, since ids are used as MENU_DATA object keys) —
 * only counts existing purely-numeric ids, so the fixed slug ids (e.g. "egg-curries") never
 * collide with newly created ones. */
function nextCategoryId(categories) {
  let max = 0;
  categories.forEach(function (c) {
    if (/^\d+$/.test(String(c.id)) && Number(c.id) > max) max = Number(c.id);
  });
  return String(max + 1);
}

module.exports = { KEY_ORDER, parseMenuData, parseCategoryMeta, serializeMenuDataFile, serializeCategoryMetaFile, findDishById, findCategoryById, nextId, nextCategoryId };
