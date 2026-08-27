// Parses and regenerates menu-data.js's MENU_DATA block, leaving everything
// else in the file (the header comment, CATEGORY_META) byte-for-byte intact.

const vm = require('vm');

const KEY_ORDER = ['id', 'name', 'nameTe', 'price', 'veg', 'thumb', 'photo', 'top', 'ingredients', 'ingredientsTe', 'status', 'weeklyDishInd'];

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

module.exports = { KEY_ORDER, parseMenuData, parseCategoryMeta, serializeMenuDataFile, findDishById, nextId };
