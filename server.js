/**
 * 星仓 WMS · 轻量级仓储管理系统
 * 零第三方依赖，仅使用 Node.js 内置模块（http / fs / path / crypto）
 * 启动：node server.js  →  http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/* ============================ 数据层 ============================ */
let db;
const COLLECTIONS = ['products', 'warehouses', 'locations', 'inventory', 'logs', 'inboundOrders', 'outboundOrders'];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function saveDb() {
  ensureDir(DATA_DIR);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}
function loadDb() {
  ensureDir(DATA_DIR);
  if (fs.existsSync(DB_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = null; }
  }
  if (!db || !db.products) { db = seed(); saveDb(); }
  COLLECTIONS.forEach(k => { if (!Array.isArray(db[k])) db[k] = []; });
  if (!db.counters) db.counters = {};
}
function uid(prefix) { return prefix + '_' + crypto.randomBytes(6).toString('hex'); }
function nextSeq(key) {
  db.counters[key] = (db.counters[key] || 0) + 1;
  return db.counters[key];
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}
function nowIso() { return new Date().toISOString(); }
function pad(n) { return String(n).padStart(3, '0'); }

/* ============================ 初始种子数据 ============================ */
function seed() {
  const now = Date.now();
  const iso = (offsetMin) => new Date(now - (offsetMin || 0) * 60000).toISOString();

  const warehouses = [
    { id: 'wh_sh01', code: 'WH-SH01', name: '上海一号仓', address: '上海市浦东新区物流园 8 号', manager: '张伟', phone: '13800000001', createdAt: iso(6000) }
  ];

  const locations = [
    { id: 'loc_a0101', warehouseId: 'wh_sh01', code: 'A-01-01', zone: 'A', capacity: 100, status: 'ENABLED' },
    { id: 'loc_a0102', warehouseId: 'wh_sh01', code: 'A-01-02', zone: 'A', capacity: 100, status: 'ENABLED' },
    { id: 'loc_a0201', warehouseId: 'wh_sh01', code: 'A-02-01', zone: 'A', capacity: 120, status: 'ENABLED' },
    { id: 'loc_b0101', warehouseId: 'wh_sh01', code: 'B-01-01', zone: 'B', capacity: 80, status: 'ENABLED' },
    { id: 'loc_b0102', warehouseId: 'wh_sh01', code: 'B-01-02', zone: 'B', capacity: 80, status: 'ENABLED' },
    { id: 'loc_c0101', warehouseId: 'wh_sh01', code: 'C-01-01', zone: 'C', capacity: 200, status: 'ENABLED' },
    { id: 'loc_c0102', warehouseId: 'wh_sh01', code: 'C-01-02', zone: 'C', capacity: 200, status: 'ENABLED' },
    { id: 'loc_c0103', warehouseId: 'wh_sh01', code: 'C-01-03', zone: 'C', capacity: 200, status: 'ENABLED' }
  ];

  const products = [
    { id: 'p_001', code: 'SKU-1001', name: '无线蓝牙耳机', spec: '白色 / 标准版', unit: '个', category: '电子数码', barcode: '6901234560011', safetyStock: 50 },
    { id: 'p_002', code: 'SKU-1002', name: '氨基酸洗发水', spec: '750ml', unit: '瓶', category: '日用洗护', barcode: '6901234560028', safetyStock: 100 },
    { id: 'p_003', code: 'SKU-1003', name: '原木抽纸', spec: '3 层 * 120 抽', unit: '包', category: '家庭清洁', barcode: '6901234560035', safetyStock: 200 },
    { id: 'p_004', code: 'SKU-1004', name: '缓震运动鞋', spec: '42 码 / 黑色', unit: '双', category: '鞋服箱包', barcode: '6901234560042', safetyStock: 30 },
    { id: 'p_005', code: 'SKU-1005', name: '不锈钢保温杯', spec: '500ml / 银色', unit: '个', category: '生活用品', barcode: '6901234560059', safetyStock: 40 },
    { id: 'p_006', code: 'SKU-1006', name: 'Type-C 数据线', spec: '1.5m / 快充', unit: '条', category: '电子数码', barcode: '6901234560066', safetyStock: 80 }
  ];

  const inventory = [
    { id: 'inv_1', productId: 'p_001', locationId: 'loc_a0101', batchNo: 'B20261001', qty: 120, updatedAt: iso(120) },
    { id: 'inv_2', productId: 'p_002', locationId: 'loc_a0102', batchNo: 'B20261002', qty: 260, updatedAt: iso(90) },
    { id: 'inv_3', productId: 'p_003', locationId: 'loc_b0101', batchNo: 'B20261003', qty: 480, updatedAt: iso(60) },
    { id: 'inv_4', productId: 'p_004', locationId: 'loc_a0201', batchNo: 'B20261004', qty: 45, updatedAt: iso(45) },
    { id: 'inv_5', productId: 'p_005', locationId: 'loc_c0101', batchNo: 'B20261005', qty: 32, updatedAt: iso(30) },
    { id: 'inv_6', productId: 'p_006', locationId: 'loc_c0102', batchNo: 'B20261006', qty: 150, updatedAt: iso(20) }
  ];

  const logs = [
    { id: 'log_1', type: 'IN', productId: 'p_001', locationId: 'loc_a0101', qty: 120, refNo: 'RK20261010-001', remark: '初始入库', createdAt: iso(120) },
    { id: 'log_2', type: 'IN', productId: 'p_002', locationId: 'loc_a0102', qty: 260, refNo: 'RK20261010-001', remark: '初始入库', createdAt: iso(90) },
    { id: 'log_3', type: 'IN', productId: 'p_003', locationId: 'loc_b0101', qty: 480, refNo: 'RK20261011-001', remark: '初始入库', createdAt: iso(60) },
    { id: 'log_4', type: 'OUT', productId: 'p_003', locationId: 'loc_b0101', qty: 20, refNo: 'CK20261011-001', remark: '客户发货', createdAt: iso(30) }
  ];

  const inboundOrders = [
    {
      id: 'in_1', no: 'RK20261011-001', supplier: '华南日化供应链', warehouseId: 'wh_sh01',
      status: 'COMPLETED', remark: '常规补货', createdAt: iso(75), confirmedAt: iso(60),
      items: [
        { productId: 'p_003', qty: 500, locationId: 'loc_b0101' },
        { productId: 'p_006', qty: 150, locationId: 'loc_c0102' }
      ]
    }
  ];

  const outboundOrders = [
    {
      id: 'out_1', no: 'CK20261011-001', customer: '天猫旗舰店', warehouseId: 'wh_sh01',
      status: 'COMPLETED', remark: '双十一预售', createdAt: iso(40), confirmedAt: iso(30),
      items: [{ productId: 'p_003', qty: 20 }]
    }
  ];

  return {
    warehouses, locations, products, inventory, logs, inboundOrders, outboundOrders,
    counters: {}
  };
}

/* ============================ HTTP 工具 ============================ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 5 * 1024 * 1024) { req.destroy(); reject(new Error('请求体过大')); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('请求体不是合法的 JSON')); }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(data);
}

/* ============================ 路由表 ============================ */
const routes = [];
function route(method, pattern, handler) { routes.push({ method, pattern, handler }); }

function matchRoute(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue;
    const rp = r.pattern.split('/').filter(Boolean);
    const pp = pathname.split('/').filter(Boolean);
    if (rp.length !== pp.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(':')) params[rp[i].slice(1)] = decodeURIComponent(pp[i]);
      else if (rp[i] !== pp[i]) { ok = false; break; }
    }
    if (ok) return { handler: r.handler, params };
  }
  return null;
}

/* ============================ 认证 ============================ */
const tokens = new Map(); // token -> { username, name, loginAt }
const USERS = [{ username: 'admin', password: '123456', name: '系统管理员' }];

route('POST', '/api/login', (req, res, params, query, body) => {
  const { username, password } = body || {};
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return json(res, 401, { message: '用户名或密码错误' });
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { username: user.username, name: user.name, loginAt: nowIso() });
  json(res, 200, { token, user: { username: user.username, name: user.name } });
});

route('GET', '/api/me', (req, res) => {
  json(res, 200, { user: req.user });
});

/* ============================ 工具函数 ============================ */
function findProduct(id) { return db.products.find(p => p.id === id); }
function findLocation(id) { return db.locations.find(l => l.id === id); }
function findWarehouse(id) { return db.warehouses.find(w => w.id === id); }

function joinLog(log) {
  const p = findProduct(log.productId);
  const loc = findLocation(log.locationId);
  return {
    ...log,
    productName: p ? p.name : '未知商品',
    productCode: p ? p.code : '',
    unit: p ? p.unit : '',
    locationCode: loc ? loc.code : '',
    warehouseId: loc ? loc.warehouseId : ''
  };
}

function orderNo(prefix, key) {
  const t = todayStr();
  const seq = nextSeq(key + '-' + t);
  return `${prefix}${t}-${pad(seq)}`;
}

/* ============================ 商品 ============================ */
route('GET', '/api/products', (req, res, params, query) => {
  let list = [...db.products];
  const kw = (query.keyword || '').trim().toLowerCase();
  if (kw) list = list.filter(p => (p.name + ' ' + p.code + ' ' + (p.barcode || '')).toLowerCase().includes(kw));
  // 附加当前库存总量
  list = list.map(p => {
    const qty = db.inventory.filter(i => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
    return { ...p, stock: qty };
  });
  list.sort((a, b) => a.code.localeCompare(b.code));
  json(res, 200, list);
});

route('POST', '/api/products', (req, res, params, query, body) => {
  const { code, name, spec, unit, category, barcode, safetyStock } = body || {};
  if (!code || !name) return json(res, 400, { message: '商品编码与名称必填' });
  if (db.products.some(p => p.code === code)) return json(res, 409, { message: '商品编码已存在' });
  const item = {
    id: uid('p'), code, name,
    spec: spec || '', unit: unit || '个', category: category || '未分类',
    barcode: barcode || '', safetyStock: Number(safetyStock) || 0,
    createdAt: nowIso()
  };
  db.products.push(item); saveDb();
  json(res, 201, item);
});

route('PUT', '/api/products/:id', (req, res, params, query, body) => {
  const p = findProduct(params.id);
  if (!p) return json(res, 404, { message: '商品不存在' });
  const { code, name, spec, unit, category, barcode, safetyStock } = body || {};
  if (code && code !== p.code && db.products.some(x => x.code === code)) return json(res, 409, { message: '商品编码已存在' });
  Object.assign(p, {
    code: code ?? p.code, name: name ?? p.name, spec: spec ?? p.spec,
    unit: unit ?? p.unit, category: category ?? p.category,
    barcode: barcode ?? p.barcode, safetyStock: safetyStock != null ? Number(safetyStock) : p.safetyStock
  });
  saveDb();
  json(res, 200, p);
});

route('DELETE', '/api/products/:id', (req, res, params) => {
  const p = findProduct(params.id);
  if (!p) return json(res, 404, { message: '商品不存在' });
  const hasStock = db.inventory.some(i => i.productId === p.id && i.qty > 0);
  if (hasStock) return json(res, 400, { message: '该商品仍有库存，无法删除' });
  db.inventory = db.inventory.filter(i => i.productId !== p.id);
  db.products = db.products.filter(x => x.id !== p.id);
  saveDb();
  json(res, 200, { message: '已删除' });
});

/* ============================ 仓库 ============================ */
route('GET', '/api/warehouses', (req, res) => {
  const list = db.warehouses.map(w => ({
    ...w,
    locationCount: db.locations.filter(l => l.warehouseId === w.id).length
  }));
  json(res, 200, list);
});

route('POST', '/api/warehouses', (req, res, params, query, body) => {
  const { code, name, address, manager, phone } = body || {};
  if (!code || !name) return json(res, 400, { message: '仓库编码与名称必填' });
  if (db.warehouses.some(w => w.code === code)) return json(res, 409, { message: '仓库编码已存在' });
  const item = { id: uid('wh'), code, name, address: address || '', manager: manager || '', phone: phone || '', createdAt: nowIso() };
  db.warehouses.push(item); saveDb();
  json(res, 201, item);
});

route('PUT', '/api/warehouses/:id', (req, res, params, query, body) => {
  const w = findWarehouse(params.id);
  if (!w) return json(res, 404, { message: '仓库不存在' });
  Object.assign(w, body || {});
  saveDb();
  json(res, 200, w);
});

route('DELETE', '/api/warehouses/:id', (req, res, params) => {
  const w = findWarehouse(params.id);
  if (!w) return json(res, 404, { message: '仓库不存在' });
  if (db.locations.some(l => l.warehouseId === w.id)) return json(res, 400, { message: '仓库下仍有库位，无法删除' });
  db.warehouses = db.warehouses.filter(x => x.id !== w.id);
  saveDb();
  json(res, 200, { message: '已删除' });
});

/* ============================ 库位 ============================ */
route('GET', '/api/locations', (req, res, params, query) => {
  let list = [...db.locations];
  if (query.warehouseId) list = list.filter(l => l.warehouseId === query.warehouseId);
  const kw = (query.keyword || '').trim().toLowerCase();
  if (kw) list = list.filter(l => l.code.toLowerCase().includes(kw) || (l.zone || '').toLowerCase().includes(kw));
  list = list.map(l => {
    const used = db.inventory.filter(i => i.locationId === l.id).reduce((s, i) => s + i.qty, 0);
    return { ...l, used, occupancy: l.capacity ? Math.min(100, Math.round(used / l.capacity * 100)) : 0 };
  });
  list.sort((a, b) => a.code.localeCompare(b.code));
  json(res, 200, list);
});

route('POST', '/api/locations', (req, res, params, query, body) => {
  const { warehouseId, code, zone, capacity } = body || {};
  if (!warehouseId || !code) return json(res, 400, { message: '仓库与库位编码必填' });
  if (!findWarehouse(warehouseId)) return json(res, 400, { message: '仓库不存在' });
  if (db.locations.some(l => l.code === code && l.warehouseId === warehouseId)) return json(res, 409, { message: '该仓库下库位编码已存在' });
  const item = { id: uid('loc'), warehouseId, code, zone: zone || 'A', capacity: Number(capacity) || 100, status: 'ENABLED' };
  db.locations.push(item); saveDb();
  json(res, 201, item);
});

route('PUT', '/api/locations/:id', (req, res, params, query, body) => {
  const l = findLocation(params.id);
  if (!l) return json(res, 404, { message: '库位不存在' });
  const { code, zone, capacity, status } = body || {};
  Object.assign(l, {
    code: code ?? l.code, zone: zone ?? l.zone,
    capacity: capacity != null ? Number(capacity) : l.capacity,
    status: status ?? l.status
  });
  saveDb();
  json(res, 200, l);
});

route('DELETE', '/api/locations/:id', (req, res, params) => {
  const l = findLocation(params.id);
  if (!l) return json(res, 404, { message: '库位不存在' });
  const hasStock = db.inventory.some(i => i.locationId === l.id && i.qty > 0);
  if (hasStock) return json(res, 400, { message: '该库位仍有库存，无法删除' });
  db.locations = db.locations.filter(x => x.id !== l.id);
  saveDb();
  json(res, 200, { message: '已删除' });
});

/* ============================ 入库单 ============================ */
function decorateInbound(o) {
  const w = findWarehouse(o.warehouseId);
  return {
    ...o,
    warehouseName: w ? w.name : '未知仓库',
    totalQty: (o.items || []).reduce((s, i) => s + Number(i.qty || 0), 0),
    items: (o.items || []).map(it => {
      const p = findProduct(it.productId);
      const loc = findLocation(it.locationId);
      return { ...it, productName: p ? p.name : '未知商品', productCode: p ? p.code : '', unit: p ? p.unit : '', locationCode: loc ? loc.code : '' };
    })
  };
}

route('GET', '/api/inbound', (req, res) => {
  const list = [...db.inboundOrders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(decorateInbound);
  json(res, 200, list);
});

route('GET', '/api/inbound/:id', (req, res, params) => {
  const o = db.inboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '入库单不存在' });
  json(res, 200, decorateInbound(o));
});

route('POST', '/api/inbound', (req, res, params, query, body) => {
  const { supplier, warehouseId, remark, items } = body || {};
  if (!warehouseId) return json(res, 400, { message: '请选择仓库' });
  if (!Array.isArray(items) || items.length === 0) return json(res, 400, { message: '请至少添加一条明细' });
  for (const it of items) {
    if (!findProduct(it.productId)) return json(res, 400, { message: '存在无效商品' });
    if (!findLocation(it.locationId)) return json(res, 400, { message: '存在无效库位' });
    if (!(Number(it.qty) > 0)) return json(res, 400, { message: '数量必须大于 0' });
  }
  const order = {
    id: uid('in'), no: orderNo('RK', 'inbound'), supplier: supplier || '',
    warehouseId, remark: remark || '', status: 'PENDING',
    createdAt: nowIso(), confirmedAt: null,
    items: items.map(it => ({ productId: it.productId, qty: Number(it.qty), locationId: it.locationId }))
  };
  db.inboundOrders.push(order); saveDb();
  json(res, 201, decorateInbound(order));
});

route('POST', '/api/inbound/:id/confirm', (req, res, params) => {
  const o = db.inboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '入库单不存在' });
  if (o.status !== 'PENDING') return json(res, 400, { message: '仅待入库单据可确认' });
  for (const it of o.items) {
    let inv = db.inventory.find(i => i.productId === it.productId && i.locationId === it.locationId && i.batchNo === 'DEFAULT');
    if (inv) { inv.qty += it.qty; inv.updatedAt = nowIso(); }
    else {
      db.inventory.push({ id: uid('inv'), productId: it.productId, locationId: it.locationId, batchNo: 'DEFAULT', qty: it.qty, updatedAt: nowIso() });
    }
    db.logs.push({ id: uid('log'), type: 'IN', productId: it.productId, locationId: it.locationId, qty: it.qty, refNo: o.no, remark: '入库上架', createdAt: nowIso() });
  }
  o.status = 'COMPLETED'; o.confirmedAt = nowIso();
  saveDb();
  json(res, 200, decorateInbound(o));
});

route('POST', '/api/inbound/:id/cancel', (req, res, params) => {
  const o = db.inboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '入库单不存在' });
  if (o.status !== 'PENDING') return json(res, 400, { message: '仅待入库单据可作废' });
  o.status = 'CANCELLED';
  saveDb();
  json(res, 200, decorateInbound(o));
});

route('DELETE', '/api/inbound/:id', (req, res, params) => {
  const o = db.inboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '入库单不存在' });
  if (o.status === 'COMPLETED') return json(res, 400, { message: '已完成的入库单不可删除' });
  db.inboundOrders = db.inboundOrders.filter(x => x.id !== o.id);
  saveDb();
  json(res, 200, { message: '已删除' });
});

/* ============================ 出库单 ============================ */
function decorateOutbound(o) {
  const w = findWarehouse(o.warehouseId);
  return {
    ...o,
    warehouseName: w ? w.name : '未知仓库',
    totalQty: (o.items || []).reduce((s, i) => s + Number(i.qty || 0), 0),
    items: (o.items || []).map(it => {
      const p = findProduct(it.productId);
      return { ...it, productName: p ? p.name : '未知商品', productCode: p ? p.code : '', unit: p ? p.unit : '' };
    })
  };
}

route('GET', '/api/outbound', (req, res) => {
  const list = [...db.outboundOrders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(decorateOutbound);
  json(res, 200, list);
});

route('GET', '/api/outbound/:id', (req, res, params) => {
  const o = db.outboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '出库单不存在' });
  json(res, 200, decorateOutbound(o));
});

route('POST', '/api/outbound', (req, res, params, query, body) => {
  const { customer, warehouseId, remark, items } = body || {};
  if (!warehouseId) return json(res, 400, { message: '请选择仓库' });
  if (!Array.isArray(items) || items.length === 0) return json(res, 400, { message: '请至少添加一条明细' });
  for (const it of items) {
    if (!findProduct(it.productId)) return json(res, 400, { message: '存在无效商品' });
    if (!(Number(it.qty) > 0)) return json(res, 400, { message: '数量必须大于 0' });
  }
  const order = {
    id: uid('out'), no: orderNo('CK', 'outbound'), customer: customer || '',
    warehouseId, remark: remark || '', status: 'PENDING',
    createdAt: nowIso(), confirmedAt: null,
    items: items.map(it => ({ productId: it.productId, qty: Number(it.qty) }))
  };
  db.outboundOrders.push(order); saveDb();
  json(res, 201, decorateOutbound(order));
});

route('POST', '/api/outbound/:id/confirm', (req, res, params) => {
  const o = db.outboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '出库单不存在' });
  if (o.status !== 'PENDING') return json(res, 400, { message: '仅待出库单据可确认' });

  const locIds = db.locations.filter(l => l.warehouseId === o.warehouseId).map(l => l.id);
  // 逐商品校验可用库存
  const shortages = [];
  for (const it of o.items) {
    const avail = db.inventory
      .filter(i => i.productId === it.productId && locIds.includes(i.locationId))
      .reduce((s, i) => s + i.qty, 0);
    if (avail < it.qty) {
      const p = findProduct(it.productId);
      shortages.push(`${p ? p.name : it.productId} 需 ${it.qty}，可用 ${avail}`);
    }
  }
  if (shortages.length) return json(res, 400, { message: '库存不足：' + shortages.join('；') });

  // 自动分配库位（按数量从多到少）
  for (const it of o.items) {
    let need = it.qty;
    const records = db.inventory
      .filter(i => i.productId === it.productId && locIds.includes(i.locationId) && i.qty > 0)
      .sort((a, b) => b.qty - a.qty);
    for (const rec of records) {
      if (need <= 0) break;
      const take = Math.min(rec.qty, need);
      rec.qty -= take; need -= take; rec.updatedAt = nowIso();
      db.logs.push({ id: uid('log'), type: 'OUT', productId: it.productId, locationId: rec.locationId, qty: take, refNo: o.no, remark: '出库拣货', createdAt: nowIso() });
    }
  }
  o.status = 'COMPLETED'; o.confirmedAt = nowIso();
  saveDb();
  json(res, 200, decorateOutbound(o));
});

route('POST', '/api/outbound/:id/cancel', (req, res, params) => {
  const o = db.outboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '出库单不存在' });
  if (o.status !== 'PENDING') return json(res, 400, { message: '仅待出库单据可作废' });
  o.status = 'CANCELLED';
  saveDb();
  json(res, 200, decorateOutbound(o));
});

route('DELETE', '/api/outbound/:id', (req, res, params) => {
  const o = db.outboundOrders.find(x => x.id === params.id);
  if (!o) return json(res, 404, { message: '出库单不存在' });
  if (o.status === 'COMPLETED') return json(res, 400, { message: '已完成的出库单不可删除' });
  db.outboundOrders = db.outboundOrders.filter(x => x.id !== o.id);
  saveDb();
  json(res, 200, { message: '已删除' });
});

/* ============================ 库存 & 流水 ============================ */
route('GET', '/api/inventory', (req, res, params, query) => {
  let list = [...db.inventory];
  if (query.productId) list = list.filter(i => i.productId === query.productId);
  if (query.warehouseId) {
    const locIds = db.locations.filter(l => l.warehouseId === query.warehouseId).map(l => l.id);
    list = list.filter(i => locIds.includes(i.locationId));
  }
  if (query.locationId) list = list.filter(i => i.locationId === query.locationId);
  const kw = (query.keyword || '').trim().toLowerCase();
  list = list.map(i => {
    const p = findProduct(i.productId);
    const loc = findLocation(i.locationId);
    const w = loc ? findWarehouse(loc.warehouseId) : null;
    return {
      id: i.id, productId: i.productId, productCode: p ? p.code : '', productName: p ? p.name : '未知商品',
      spec: p ? p.spec : '', unit: p ? p.unit : '', locationId: i.locationId,
      locationCode: loc ? loc.code : '', warehouseId: loc ? loc.warehouseId : '',
      warehouseName: w ? w.name : '', batchNo: i.batchNo, qty: i.qty, updatedAt: i.updatedAt
    };
  });
  if (kw) list = list.filter(i => (i.productName + ' ' + i.productCode + ' ' + i.locationCode).toLowerCase().includes(kw));
  list = list.filter(i => i.qty > 0);
  list.sort((a, b) => a.productCode.localeCompare(b.productCode) || a.locationCode.localeCompare(b.locationCode));
  json(res, 200, list);
});

route('GET', '/api/logs', (req, res, params, query) => {
  let list = [...db.logs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (query.type) list = list.filter(l => l.type === query.type);
  const kw = (query.keyword || '').trim().toLowerCase();
  if (kw) list = list.map(joinLog).filter(l => (l.productName + ' ' + l.refNo + ' ' + l.locationCode).toLowerCase().includes(kw));
  else list = list.map(joinLog);
  const limit = Number(query.limit) || 200;
  json(res, 200, list.slice(0, limit));
});

/* ============================ 看板 ============================ */
route('GET', '/api/dashboard', (req, res) => {
  const totalStock = db.inventory.reduce((s, i) => s + i.qty, 0);
  const occupiedLocations = new Set(db.inventory.filter(i => i.qty > 0).map(i => i.locationId)).size;
  const today = new Date().toISOString().slice(0, 10);
  const isToday = (o) => (o.createdAt || '').slice(0, 10) === today || (o.confirmedAt || '').slice(0, 10) === today;
  const todayInbound = db.inboundOrders.filter(isToday).length;
  const todayOutbound = db.outboundOrders.filter(isToday).length;

  // 低库存预警：按商品汇总库存与安全库存比较
  const byProduct = {};
  db.inventory.forEach(i => { byProduct[i.productId] = (byProduct[i.productId] || 0) + i.qty; });
  const lowStock = [];
  db.products.forEach(p => {
    const qty = byProduct[p.id] || 0;
    if (p.safetyStock && qty < p.safetyStock) lowStock.push({ productId: p.id, productName: p.name, productCode: p.code, qty, safetyStock: p.safetyStock, unit: p.unit });
  });
  lowStock.sort((a, b) => (a.qty / a.safetyStock) - (b.qty / b.safetyStock));

  // 各仓库库存分布
  const byWarehouse = db.warehouses.map(w => {
    const locIds = db.locations.filter(l => l.warehouseId === w.id).map(l => l.id);
    const qty = db.inventory.filter(i => locIds.includes(i.locationId)).reduce((s, i) => s + i.qty, 0);
    return { warehouseId: w.id, warehouseName: w.name, qty };
  });

  const recentLogs = [...db.logs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8).map(joinLog);

  json(res, 200, {
    counts: {
      products: db.products.length, warehouses: db.warehouses.length,
      locations: db.locations.length, locationsOccupied: occupiedLocations,
      inboundOrders: db.inboundOrders.length, outboundOrders: db.outboundOrders.length
    },
    totalStock,
    todayInbound,
    todayOutbound,
    lowStock: lowStock.slice(0, 8),
    byWarehouse,
    recentLogs
  });
});

/* ============================ 启动服务 ============================ */
loadDb();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method;

  try {
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/login') {
        const body = await readBody(req);
        const m = matchRoute(method, pathname);
        return m.handler(req, res, m.params, Object.fromEntries(url.searchParams), body);
      }
      const auth = req.headers['authorization'] || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const me = tokens.get(token);
      if (!me) return json(res, 401, { message: '登录已过期，请重新登录' });
      req.user = me;

      const m = matchRoute(method, pathname);
      if (!m) return json(res, 404, { message: '接口不存在' });
      let body = null;
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') body = await readBody(req);
      return m.handler(req, res, m.params, Object.fromEntries(url.searchParams), body);
    }
    serveStatic(res, pathname);
  } catch (err) {
    console.error('[ERROR]', err.message);
    json(res, 500, { message: err.message || '服务器内部错误' });
  }
});

server.listen(PORT, () => {
  console.log('==============================================');
  console.log('  星仓 WMS 仓储管理系统已启动');
  console.log('  访问地址: http://localhost:' + PORT);
  console.log('  默认账号: admin / 123456');
  console.log('==============================================');
});
