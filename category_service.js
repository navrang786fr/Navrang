// Helper for server.py to read and mutate menu-data.js categories locally
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const md = require('./ratings-api/api/_lib/menuData.js');

const ROOT_DIR = __dirname;
const MENU_DATA_PATH = path.join(ROOT_DIR, 'menu-data.js');
const CAT_IMG_DIR = path.join(ROOT_DIR, 'images', 'menu', 'categories');

if (!fs.existsSync(CAT_IMG_DIR)) {
  fs.mkdirSync(CAT_IMG_DIR, { recursive: true });
}

function getCategories() {
  const raw = fs.readFileSync(MENU_DATA_PATH, 'utf8');
  const { restSrc } = md.parseMenuData(raw);
  return md.parseCategoryMeta(restSrc);
}

function getDishes() {
  const raw = fs.readFileSync(MENU_DATA_PATH, 'utf8');
  const { menuData, restSrc } = md.parseMenuData(raw);
  const categories = md.parseCategoryMeta(restSrc).map(c => ({
    id: c.id,
    title: c.title,
    titleTe: c.titleTe
  }));
  return { menu: menuData, categories };
}

function saveCategory(payload) {
  const action = payload.action === 'create' ? 'create' : 'update';
  const raw = fs.readFileSync(MENU_DATA_PATH, 'utf8');
  const { menuData, restSrc } = md.parseMenuData(raw);
  const categories = md.parseCategoryMeta(restSrc);

  let id = String(payload.id || '').trim();
  if (action === 'create' && !id) {
    id = md.nextCategoryId(categories);
  }

  // Handle image saving if base64 data URL
  let imgPath = payload.image ? String(payload.image).trim() : '';
  if (imgPath.startsWith('data:image/')) {
    const m = /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/.exec(imgPath);
    if (m) {
      const ext = 'jpg';
      const buffer = Buffer.from(m[2], 'base64');
      const filename = `${id}.${ext}`;
      const fullPath = path.join(CAT_IMG_DIR, filename);
      fs.writeFileSync(fullPath, buffer);
      const v = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
      imgPath = `images/menu/categories/${filename}?v=${v}`;
    }
  }

  const submitted = {
    title: String(payload.title || '').trim(),
    titleTe: String(payload.titleTe || '').trim(),
    short: String(payload.short || payload.title || '').trim(),
    shortTe: String(payload.shortTe || payload.titleTe || '').trim()
  };
  if (imgPath) {
    submitted.image = imgPath;
  }

  let finalCategory = null;
  if (action === 'create') {
    const DEFAULT_ICON = '<path d="M18 8h22a4 4 0 014 4v40l-15-9-15 9V12a4 4 0 014-4z"/>';
    finalCategory = Object.assign({ id, icon: DEFAULT_ICON }, submitted);
    categories.push(finalCategory);
    if (!menuData[id]) menuData[id] = [];
  } else {
    const cat = md.findCategoryById(categories, id);
    if (!cat) throw new Error('Category not found: ' + id);
    Object.assign(cat, submitted);
    if (!cat.image) delete cat.image;
    finalCategory = cat;
  }

  const newRestSrc = md.serializeCategoryMetaFile(categories);
  const newContent = md.serializeMenuDataFile(menuData, newRestSrc);
  fs.writeFileSync(MENU_DATA_PATH, newContent, 'utf8');

  return { ok: true, category: finalCategory };
}

const cmd = process.argv[2];
try {
  if (cmd === 'get-categories') {
    console.log(JSON.stringify(getCategories()));
  } else if (cmd === 'get-dishes') {
    console.log(JSON.stringify(getDishes()));
  } else if (cmd === 'save-category') {
    const input = fs.readFileSync(0, 'utf8');
    const payload = JSON.parse(input);
    const res = saveCategory(payload);
    console.log(JSON.stringify(res));
  } else {
    console.error('Unknown command:', cmd);
    process.exit(1);
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message || String(err) }));
  process.exit(1);
}
