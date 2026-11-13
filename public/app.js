/* ============================================================
 * 星仓 WMS · 前端单页应用
 * 纯原生 JS，无构建、无框架依赖
 * ============================================================ */
(function () {
  'use strict';

  const state = { token: null, user: null, route: 'dashboard' };

  /* -------------------------- 图标 -------------------------- */
  const PATHS = {
    logo: '<path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/>',
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    warehouse: '<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-6h10v6"/><path d="M7 12h10"/>',
    inbound: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    outbound: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    inventory: '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 7v10l9 5 9-5V7"/><path d="M12 12v10"/>',
    logs: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    close: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    empty: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (PATHS[name] || '') + '</svg>';
  }

  /* -------------------------- 基础工具 -------------------------- */
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const val = (scope, sel) => { const el = $(sel, scope); return el ? el.value.trim() : ''; };
  const num = (n) => Number(n) || 0;

  function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function todayLabel() {
    const d = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${wk}`;
  }
  function debounce(fn, wait) {
    let t; return function () { const ctx = this, args = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(ctx, args), wait); };
  }

  function toast(msg, type) {
    const root = $('#toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
    el.innerHTML = '<span class="t-dot"></span><span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all .22s';
      setTimeout(() => el.remove(), 240);
    }, 2600);
  }

  function emptyState(text) {
    return '<div class="empty">' + icon('empty') + '<div>' + esc(text) + '</div></div>';
  }

  /* -------------------------- API -------------------------- */
  async function api(path, opts) {
    opts = opts || {};
    const headers = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    const res = await fetch('/api' + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (res.status === 401) { logout(); throw new Error(data.message || '登录已过期，请重新登录'); }
    if (!res.ok) throw new Error(data.message || ('请求失败 (' + res.status + ')'));
    return data;
  }

  /* -------------------------- 弹窗 -------------------------- */
  function openModal(opts) {
    const root = $('#modal-root');
    root.innerHTML =
      '<div class="modal-mask" data-mask><div class="modal ' + (opts.wide ? 'wide' : '') + '">' +
        '<div class="modal-head"><h3>' + esc(opts.title || '') + '</h3><button class="close" data-close>' + icon('close') + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        '<div class="modal-foot">' +
          (opts.hideCancel ? '' : '<button class="btn" data-close>取消</button>') +
          '<button class="btn btn-primary" data-ok>' + esc(opts.okText || '确定') + '</button>' +
        '</div>' +
      '</div></div>';

    const mask = $('[data-mask]', root);
    const close = () => { root.innerHTML = ''; };
    $$('[data-close]', root).forEach(b => b.onclick = close);
    mask.addEventListener('mousedown', e => { if (e.target === mask) close(); });

    const modalEl = $('.modal', root);
    const bodyEl = $('.modal-body', root);
    if (opts.onMount) opts.onMount({ modalEl, bodyEl, close });

    const okBtn = $('[data-ok]', root);
    okBtn.onclick = async () => {
      if (!opts.onOk) { close(); return; }
      try {
        okBtn.disabled = true;
        const r = await opts.onOk({ modalEl, bodyEl, close });
        if (r !== false) close();
      } catch (e) {
        toast(e.message, 'error');
      } finally {
        okBtn.disabled = false;
      }
    };
    return { close, modalEl, bodyEl };
  }

  function confirmDialog(message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const root = $('#modal-root');
      root.innerHTML =
        '<div class="modal-mask"><div class="modal" style="max-width:430px">' +
          '<div class="modal-head"><h3>' + esc(opts.title || '操作确认') + '</h3></div>' +
          '<div class="modal-body"><p style="color:var(--text-2);line-height:1.75">' + esc(message) + '</p></div>' +
          '<div class="modal-foot"><button class="btn" data-cancel>取消</button><button class="btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger') + '" data-ok>' + esc(opts.okText || '确定') + '</button></div>' +
        '</div></div>';
      const done = v => { root.innerHTML = ''; resolve(v); };
      $('[data-cancel]', root).onclick = () => done(false);
      $('[data-ok]', root).onclick = () => done(true);
    });
  }

  /* -------------------------- 登录 -------------------------- */
  function showLogin() {
    state.token = null; state.user = null;
    const app = $('#app');
    app.innerHTML =
      '<div class="login-wrap">' +
        '<div class="login-hero">' +
          '<div class="login-brand"><div class="login-logo">' + icon('logo') + '</div><span>星仓 WMS</span></div>' +
          '<div>' +
            '<h1>让每一件货物<br/>都有迹可循</h1>' +
            '<p>面向仓库团队的一体化仓储管理系统，覆盖商品档案、库位管理、入库上架、出库拣货与库存预警。</p>' +
            '<div class="login-features">' +
              '<div class="login-feature"><span class="dot">✓</span>实时库存与库位可视化</div>' +
              '<div class="login-feature"><span class="dot">✓</span>入库 / 出库单据全流程留痕</div>' +
              '<div class="login-feature"><span class="dot">✓</span>安全库存智能预警</div>' +
            '</div>' +
          '</div>' +
          '<div class="login-foot">© 2026 星仓 WMS · 轻量级仓储管理系统</div>' +
        '</div>' +
        '<div class="login-panel">' +
          '<div class="login-box">' +
            '<h2>欢迎回来</h2>' +
            '<div class="sub">登录仓储管理后台</div>' +
            '<form id="loginForm">' +
              '<div class="field"><label>账号</label><input class="input" id="lgUser" value="admin" autocomplete="username" placeholder="请输入账号"></div>' +
              '<div class="field"><label>密码</label><input class="input" id="lgPass" type="password" value="123456" autocomplete="current-password" placeholder="请输入密码"></div>' +
              '<button class="btn btn-primary btn-block" type="submit">登 录</button>' +
            '</form>' +
            '<p class="muted" style="margin-top:18px;text-align:center;font-size:12.5px">演示账号 admin / 123456</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      try {
        btn.disabled = true; btn.textContent = '登录中…';
        const data = await api('/login', { method: 'POST', body: { username: $('#lgUser').value.trim(), password: $('#lgPass').value } });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('wms_token', data.token);
        startApp();
        toast('登录成功，欢迎 ' + data.user.name, 'success');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '登 录';
      }
    });
  }

  function logout() {
    localStorage.removeItem('wms_token');
    state.token = null; state.user = null;
    $('#modal-root').innerHTML = '';
    showLogin();
  }

  /* -------------------------- 路由 -------------------------- */
  const ROUTES = {
    dashboard: { title: '仪表看板', sub: '仓储运营总览', icon: 'dashboard', page: pageDashboard },
    products: { title: '商品管理', sub: '商品档案与安全库存', icon: 'box', page: pageProducts },
    warehouses: { title: '仓库库位', sub: '仓库与库位资源', icon: 'warehouse', page: pageWarehouses },
    inbound: { title: '入库管理', sub: '收货上架与单据', icon: 'inbound', page: pageInbound },
    outbound: { title: '出库管理', sub: '拣货发货与单据', icon: 'outbound', page: pageOutbound },
    inventory: { title: '库存查询', sub: '实时库存分布', icon: 'inventory', page: pageInventory },
    logs: { title: '库存流水', sub: '出入库操作记录', icon: 'logs', page: pageLogs }
  };
  const NAV = [
    { group: '概览', keys: ['dashboard'] },
    { group: '基础数据', keys: ['products', 'warehouses'] },
    { group: '业务操作', keys: ['inbound', 'outbound', 'inventory'] },
    { group: '报表', keys: ['logs'] }
  ];

  function currentRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    return ROUTES[h] ? h : 'dashboard';
  }

  function renderApp() {
    const r = ROUTES[state.route];
    const initial = (state.user && state.user.name ? state.user.name : '管')[0];
    const navHtml = NAV.map(g =>
      '<div class="side-group-title">' + g.group + '</div>' +
      g.keys.map(k => {
        const item = ROUTES[k];
        return '<div class="nav-item ' + (state.route === k ? 'active' : '') + '" data-route="' + k + '">' + icon(item.icon) + '<span>' + item.title + '</span></div>';
      }).join('')
    ).join('');

    $('#app').innerHTML =
      '<div class="shell">' +
        '<aside class="sidebar">' +
          '<div class="side-brand"><div class="logo">' + icon('logo') + '</div><div class="name">星仓 WMS<small>仓储管理系统</small></div></div>' +
          '<div class="side-nav">' + navHtml + '</div>' +
          '<div class="side-foot"><div class="side-user">' +
            '<div class="avatar">' + esc(initial) + '</div>' +
            '<div class="u-meta"><div class="u-name">' + esc(state.user.name) + '</div><div class="u-role">仓储管理员</div></div>' +
            '<div class="logout" id="logoutBtn" title="退出登录">' + icon('logout') + '</div>' +
          '</div></div>' +
        '</aside>' +
        '<div class="main">' +
          '<header class="topbar"><div class="crumb">' + r.title + '<small>' + r.sub + '</small></div><div class="spacer"></div><div class="date">' + todayLabel() + '</div></header>' +
          '<div class="content" id="content"></div>' +
        '</div>' +
      '</div>';

    $$('.nav-item').forEach(el => el.onclick = () => { location.hash = '#/' + el.dataset.route; });
    $('#logoutBtn').onclick = logout;
    loadPage();
  }

  function loadPage() {
    const r = ROUTES[state.route];
    if (!r) return;
    Promise.resolve(r.page()).catch(e => toast(e.message, 'error'));
  }

  function startApp() {
    state.route = currentRoute();
    renderApp();
    window.addEventListener('hashchange', () => {
      if (!state.token) return;
      state.route = currentRoute();
      renderApp();
    });
  }

  /* -------------------------- 通用渲染片段 -------------------------- */
  function statusBadge(s) {
    if (s === 'COMPLETED') return '<span class="badge green">已完成</span>';
    if (s === 'PENDING') return '<span class="badge orange">待处理</span>';
    if (s === 'CANCELLED') return '<span class="badge gray">已作废</span>';
    return '<span class="badge gray">' + esc(s) + '</span>';
  }
  function productOptions(products, selected) {
    return '<option value="">选择商品</option>' + products.map(p =>
      '<option value="' + p.id + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.code) + ' · ' + esc(p.name) + '</option>'
    ).join('');
  }
  function locationOptions(locations, warehouseId, selected) {
    return '<option value="">选择库位</option>' + locations.filter(l => l.warehouseId === warehouseId).map(l =>
      '<option value="' + l.id + '"' + (l.id === selected ? ' selected' : '') + '>' + esc(l.code) + '</option>'
    ).join('');
  }

  /* -------------------------- 页面：仪表盘 -------------------------- */
  async function pageDashboard() {
    const d = await api('/dashboard');
    const c = d.counts;
    const occupancy = c.locations ? Math.round(c.locationsOccupied / c.locations * 100) : 0;
    const maxWh = Math.max(1, ...d.byWarehouse.map(w => w.qty));

    const lowHtml = d.lowStock.length ? d.lowStock.map(p =>
      '<div class="low-item"><div class="info"><div class="p-name">' + esc(p.productName) + '</div><div class="p-meta">' + esc(p.productCode) + ' · 安全库存 ' + p.safetyStock + '</div></div>' +
      '<div class="qty low">' + p.qty + '<span class="muted" style="font-weight:400"> / ' + p.safetyStock + ' ' + esc(p.unit) + '</span></div></div>'
    ).join('') : emptyState('暂无低库存商品，库存健康');

    const feedHtml = d.recentLogs.length ? d.recentLogs.map(l => {
      const cls = l.type === 'IN' ? 'in' : l.type === 'OUT' ? 'out' : 'adjust';
      const label = l.type === 'IN' ? '入' : l.type === 'OUT' ? '出' : '调';
      const sign = l.type === 'OUT' ? '-' : '+';
      return '<div class="feed-item"><div class="feed-dot ' + cls + '">' + label + '</div><div style="flex:1;min-width:0"><div class="f-main"><strong>' + esc(l.productName) + '</strong> <span class="muted">' + sign + l.qty + ' ' + esc(l.unit) + '</span></div><div class="f-sub">' + esc(l.refNo || '—') + ' · ' + (l.locationCode ? '库位 ' + esc(l.locationCode) + ' · ' : '') + fmt(l.createdAt) + '</div></div></div>';
    }).join('') : emptyState('暂无库存动态');

    $('#content').innerHTML =
      '<div class="stat-grid">' +
        '<div class="stat"><div class="icon blue">' + icon('inventory') + '</div><div><div class="val">' + d.totalStock + '<span style="font-size:13px;font-weight:600;color:var(--text-3);margin-left:4px">件</span></div><div class="lbl">当前库存总量</div></div></div>' +
        '<div class="stat"><div class="icon cyan">' + icon('box') + '</div><div><div class="val">' + c.products + ' <span style="font-size:13px;font-weight:600;color:var(--text-3)">SKU</span></div><div class="lbl">商品种类</div></div></div>' +
        '<div class="stat"><div class="icon green">' + icon('warehouse') + '</div><div><div class="val">' + occupancy + '%</div><div class="lbl">库位占用率 ' + c.locationsOccupied + '/' + c.locations + '</div></div></div>' +
        '<div class="stat"><div class="icon orange">' + icon('inbound') + '</div><div><div class="val">' + d.todayInbound + ' / ' + d.todayOutbound + '</div><div class="lbl">今日入库 / 出库单</div></div></div>' +
      '</div>' +
      '<div class="grid-2b" style="margin-bottom:18px">' +
        '<div class="card"><div class="card-head"><h3>低库存预警</h3><div class="spacer"></div><span class="badge orange">' + d.lowStock.length + ' 项</span></div><div class="low-list">' + lowHtml + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>仓库库存分布</h3></div><div class="card-pad">' +
          d.byWarehouse.map(w =>
            '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px"><span>' + esc(w.warehouseName) + '</span><strong>' + w.qty + '</strong></div><div class="bar"><i style="width:' + (w.qty / maxWh * 100) + '%"></i></div></div>'
          ).join('') +
          '<div style="display:flex;gap:24px;margin-top:22px;padding-top:18px;border-top:1px dashed var(--border)">' +
            '<div><div style="font-size:22px;font-weight:800">' + c.warehouses + '</div><div class="muted" style="font-size:12px">仓库数</div></div>' +
            '<div><div style="font-size:22px;font-weight:800">' + c.locations + '</div><div class="muted" style="font-size:12px">库位总数</div></div>' +
            '<div><div style="font-size:22px;font-weight:800">' + c.inboundOrders + '</div><div class="muted" style="font-size:12px">入库单</div></div>' +
            '<div><div style="font-size:22px;font-weight:800">' + c.outboundOrders + '</div><div class="muted" style="font-size:12px">出库单</div></div>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>最近库存动态</h3><div class="spacer"></div><span class="muted" style="font-size:12.5px">实时更新</span></div><div class="feed">' + feedHtml + '</div></div>';
  }

  /* -------------------------- 页面：商品 -------------------------- */
  async function pageProducts() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>商品档案</h3><div class="spacer"></div><button class="btn btn-primary btn-sm" id="addProduct">' + icon('plus') + ' 新增商品</button></div>' +
        '<div class="toolbar" style="padding:16px 22px 0"><div class="search">' + icon('search') + '<input class="input" id="pSearch" placeholder="搜索商品名称 / 编码 / 条码"></div></div>' +
        '<div class="table-wrap" id="pTable" style="margin-top:14px"></div>' +
      '</div>';
    $('#addProduct').onclick = () => openProductForm(null);
    const deb = debounce(() => loadProducts($('#pSearch').value.trim()), 280);
    $('#pSearch').addEventListener('input', deb);
    await loadProducts('');
  }

  async function loadProducts(keyword) {
    const table = $('#pTable');
    if (!table) return;
    table.innerHTML = '<div class="empty">加载中…</div>';
    const list = await api('/products' + (keyword ? '?keyword=' + encodeURIComponent(keyword) : ''));
    if (!list.length) { table.innerHTML = emptyState('还没有商品，点击右上角新增'); return; }
    table.innerHTML =
      '<table class="tbl"><thead><tr><th>商品编码</th><th>商品名称</th><th>规格</th><th>单位</th><th>分类</th><th>当前库存</th><th>安全库存</th><th>操作</th></tr></thead><tbody>' +
      list.map(p =>
        '<tr>' +
          '<td class="mono">' + esc(p.code) + '</td>' +
          '<td><strong>' + esc(p.name) + '</strong></td>' +
          '<td class="muted">' + (esc(p.spec) || '—') + '</td>' +
          '<td>' + esc(p.unit) + '</td>' +
          '<td>' + esc(p.category) + '</td>' +
          '<td class="num">' + p.stock + '</td>' +
          '<td class="num ' + (p.safetyStock && p.stock < p.safetyStock ? 'low' : '') + '" style="' + (p.safetyStock && p.stock < p.safetyStock ? 'color:var(--danger)' : '') + '">' + p.safetyStock + '</td>' +
          '<td><button class="btn btn-sm btn-ghost" data-edit="' + p.id + '">编辑</button> <button class="btn btn-sm btn-danger" data-del="' + p.id + '">删除</button></td>' +
        '</tr>'
      ).join('') + '</tbody></table>';

    $$('[data-edit]', table).forEach(b => b.onclick = () => openProductForm(list.find(x => x.id === b.dataset.edit)));
    $$('[data-del]', table).forEach(b => b.onclick = async () => {
      const p = list.find(x => x.id === b.dataset.del);
      if (await confirmDialog('确定删除商品「' + p.name + '」吗？')) {
        try { await api('/products/' + p.id, { method: 'DELETE' }); toast('已删除', 'success'); loadProducts($('#pSearch') ? $('#pSearch').value.trim() : ''); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
  }

  function openProductForm(p) {
    const isEdit = !!p;
    openModal({
      title: isEdit ? '编辑商品' : '新增商品',
      body:
        '<div class="form-grid">' +
          '<div class="field"><label>商品编码 *</label><input class="input" id="pfCode" value="' + esc(p ? p.code : '') + '" placeholder="如 SKU-1007"></div>' +
          '<div class="field"><label>商品名称 *</label><input class="input" id="pfName" value="' + esc(p ? p.name : '') + '" placeholder="如 无线充电器"></div>' +
          '<div class="field"><label>规格</label><input class="input" id="pfSpec" value="' + esc(p ? p.spec : '') + '" placeholder="如 白色 / 标准版"></div>' +
          '<div class="field"><label>单位</label><input class="input" id="pfUnit" value="' + esc(p ? p.unit : '个') + '"></div>' +
          '<div class="field"><label>分类</label><input class="input" id="pfCat" value="' + esc(p ? p.category : '') + '" placeholder="如 电子数码"></div>' +
          '<div class="field"><label>条码</label><input class="input" id="pfBarcode" value="' + esc(p ? p.barcode : '') + '" placeholder="选填"></div>' +
          '<div class="field"><label>安全库存</label><input class="input" type="number" min="0" id="pfSafety" value="' + (p ? p.safetyStock : 0) + '"></div>' +
        '</div>',
      okText: isEdit ? '保存' : '创建',
      onOk: async ({ bodyEl }) => {
        const body = {
          code: val(bodyEl, '#pfCode'), name: val(bodyEl, '#pfName'), spec: val(bodyEl, '#pfSpec'),
          unit: val(bodyEl, '#pfUnit'), category: val(bodyEl, '#pfCat'), barcode: val(bodyEl, '#pfBarcode'),
          safetyStock: num(val(bodyEl, '#pfSafety'))
        };
        if (!body.code || !body.name) throw new Error('商品编码与名称必填');
        if (isEdit) await api('/products/' + p.id, { method: 'PUT', body });
        else await api('/products', { method: 'POST', body });
        toast(isEdit ? '商品已更新' : '商品已创建', 'success');
        loadProducts($('#pSearch') ? $('#pSearch').value.trim() : '');
      }
    });
  }

  /* -------------------------- 页面：仓库与库位 -------------------------- */
  let whTab = 'warehouses';

  async function pageWarehouses() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>仓库与库位</h3><div class="spacer"></div>' +
          '<button class="btn btn-sm ' + (whTab === 'warehouses' ? 'btn-primary' : '') + '" id="tabWh">仓库管理</button>' +
          '<button class="btn btn-sm ' + (whTab === 'locations' ? 'btn-primary' : '') + '" id="tabLoc">库位管理</button>' +
        '</div>' +
        '<div id="whBody"></div>' +
      '</div>';
    $('#tabWh').onclick = () => { whTab = 'warehouses'; pageWarehouses(); };
    $('#tabLoc').onclick = () => { whTab = 'locations'; pageWarehouses(); };
    if (whTab === 'warehouses') renderWarehouses();
    else renderLocations();
  }

  async function renderWarehouses() {
    const body = $('#whBody');
    body.innerHTML =
      '<div class="toolbar" style="padding:16px 22px 0"><div class="spacer"></div><button class="btn btn-primary btn-sm" id="addWh">' + icon('plus') + ' 新增仓库</button></div>' +
      '<div class="table-wrap" id="whTable" style="margin-top:12px"></div>';
    $('#addWh').onclick = () => openWarehouseForm(null);
    const list = await api('/warehouses');
    const t = $('#whTable');
    if (!list.length) { t.innerHTML = emptyState('还没有仓库'); return; }
    t.innerHTML =
      '<table class="tbl"><thead><tr><th>仓库编码</th><th>仓库名称</th><th>地址</th><th>负责人</th><th>联系电话</th><th>库位数量</th><th>操作</th></tr></thead><tbody>' +
      list.map(w =>
        '<tr><td class="mono">' + esc(w.code) + '</td><td><strong>' + esc(w.name) + '</strong></td><td class="muted">' + (esc(w.address) || '—') + '</td><td>' + (esc(w.manager) || '—') + '</td><td>' + (esc(w.phone) || '—') + '</td><td class="num">' + w.locationCount + '</td>' +
        '<td><button class="btn btn-sm btn-ghost" data-edit="' + w.id + '">编辑</button> <button class="btn btn-sm btn-danger" data-del="' + w.id + '">删除</button></td></tr>'
      ).join('') + '</tbody></table>';
    $$('[data-edit]', t).forEach(b => b.onclick = () => openWarehouseForm(list.find(x => x.id === b.dataset.edit)));
    $$('[data-del]', t).forEach(b => b.onclick = async () => {
      const w = list.find(x => x.id === b.dataset.del);
      if (await confirmDialog('确定删除仓库「' + w.name + '」吗？')) {
        try { await api('/warehouses/' + w.id, { method: 'DELETE' }); toast('已删除', 'success'); renderWarehouses(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
  }

  function openWarehouseForm(w) {
    const isEdit = !!w;
    openModal({
      title: isEdit ? '编辑仓库' : '新增仓库',
      body:
        '<div class="form-grid">' +
          '<div class="field"><label>仓库编码 *</label><input class="input" id="wfCode" value="' + esc(w ? w.code : '') + '" placeholder="如 WH-BJ01"></div>' +
          '<div class="field"><label>仓库名称 *</label><input class="input" id="wfName" value="' + esc(w ? w.name : '') + '"></div>' +
          '<div class="field full"><label>地址</label><input class="input" id="wfAddr" value="' + esc(w ? w.address : '') + '"></div>' +
          '<div class="field"><label>负责人</label><input class="input" id="wfMgr" value="' + esc(w ? w.manager : '') + '"></div>' +
          '<div class="field"><label>联系电话</label><input class="input" id="wfPhone" value="' + esc(w ? w.phone : '') + '"></div>' +
        '</div>',
      okText: isEdit ? '保存' : '创建',
      onOk: async ({ bodyEl }) => {
        const body = { code: val(bodyEl, '#wfCode'), name: val(bodyEl, '#wfName'), address: val(bodyEl, '#wfAddr'), manager: val(bodyEl, '#wfMgr'), phone: val(bodyEl, '#wfPhone') };
        if (!body.code || !body.name) throw new Error('仓库编码与名称必填');
        if (isEdit) await api('/warehouses/' + w.id, { method: 'PUT', body });
        else await api('/warehouses', { method: 'POST', body });
        toast(isEdit ? '仓库已更新' : '仓库已创建', 'success');
        renderWarehouses();
      }
    });
  }

  async function renderLocations() {
    const body = $('#whBody');
    body.innerHTML =
      '<div class="toolbar" style="padding:16px 22px 0"><div class="spacer"></div><button class="btn btn-primary btn-sm" id="addLoc">' + icon('plus') + ' 新增库位</button></div>' +
      '<div class="table-wrap" id="locTable" style="margin-top:12px"></div>';
    const [warehouses, list] = await Promise.all([api('/warehouses'), api('/locations')]);
    const whMap = {}; warehouses.forEach(w => whMap[w.id] = w.name);
    $('#addLoc').onclick = () => openLocationForm(null, warehouses);
    const t = $('#locTable');
    if (!list.length) { t.innerHTML = emptyState('还没有库位'); return; }
    t.innerHTML =
      '<table class="tbl"><thead><tr><th>库位编码</th><th>所属仓库</th><th>区域</th><th>容量</th><th>已用</th><th>占用率</th><th>操作</th></tr></thead><tbody>' +
      list.map(l => {
        const cls = l.occupancy >= 90 ? 'danger' : l.occupancy >= 60 ? 'warn' : '';
        return '<tr><td class="mono"><strong>' + esc(l.code) + '</strong></td><td>' + esc(whMap[l.warehouseId] || '—') + '</td><td>' + esc(l.zone) + '</td><td class="num">' + l.capacity + '</td><td class="num">' + l.used + '</td>' +
          '<td style="min-width:150px"><div style="display:flex;align-items:center;gap:10px"><div class="bar ' + cls + '" style="flex:1"><i style="width:' + l.occupancy + '%"></i></div><span class="muted" style="font-size:12px;width:34px">' + l.occupancy + '%</span></div></td>' +
          '<td><button class="btn btn-sm btn-ghost" data-edit="' + l.id + '">编辑</button> <button class="btn btn-sm btn-danger" data-del="' + l.id + '">删除</button></td></tr>';
      }).join('') + '</tbody></table>';
    $$('[data-edit]', t).forEach(b => b.onclick = () => openLocationForm(list.find(x => x.id === b.dataset.edit), warehouses));
    $$('[data-del]', t).forEach(b => b.onclick = async () => {
      const l = list.find(x => x.id === b.dataset.del);
      if (await confirmDialog('确定删除库位「' + l.code + '」吗？')) {
        try { await api('/locations/' + l.id, { method: 'DELETE' }); toast('已删除', 'success'); renderLocations(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
  }

  function openLocationForm(l, warehouses) {
    const isEdit = !!l;
    openModal({
      title: isEdit ? '编辑库位' : '新增库位',
      body:
        '<div class="form-grid">' +
          '<div class="field full"><label>所属仓库 *</label><select class="select" id="lfWh" ' + (isEdit ? 'disabled' : '') + '>' +
            warehouses.map(w => '<option value="' + w.id + '"' + (l && l.warehouseId === w.id ? ' selected' : '') + '>' + esc(w.name) + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>库位编码 *</label><input class="input" id="lfCode" value="' + esc(l ? l.code : '') + '" placeholder="如 D-01-01"></div>' +
          '<div class="field"><label>区域</label><input class="input" id="lfZone" value="' + esc(l ? l.zone : 'A') + '" placeholder="如 A"></div>' +
          '<div class="field"><label>容量</label><input class="input" type="number" min="1" id="lfCap" value="' + (l ? l.capacity : 100) + '"></div>' +
        '</div>',
      okText: isEdit ? '保存' : '创建',
      onOk: async ({ bodyEl }) => {
        const body = { warehouseId: val(bodyEl, '#lfWh'), code: val(bodyEl, '#lfCode'), zone: val(bodyEl, '#lfZone'), capacity: num(val(bodyEl, '#lfCap')) || 100 };
        if (!body.code) throw new Error('库位编码必填');
        if (isEdit) { delete body.warehouseId; await api('/locations/' + l.id, { method: 'PUT', body }); }
        else await api('/locations', { method: 'POST', body });
        toast(isEdit ? '库位已更新' : '库位已创建', 'success');
        renderLocations();
      }
    });
  }

  /* -------------------------- 页面：入库 -------------------------- */
  async function pageInbound() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>入库单</h3><div class="spacer"></div><button class="btn btn-primary btn-sm" id="addIn">' + icon('plus') + ' 新建入库单</button></div>' +
        '<div class="table-wrap" id="inTable" style="margin-top:6px"></div>' +
      '</div>';
    $('#addIn').onclick = openInboundCreate;
    await loadInbound();
  }

  async function loadInbound() {
    const list = await api('/inbound');
    const t = $('#inTable');
    if (!t) return;
    if (!list.length) { t.innerHTML = emptyState('暂无入库单，点击右上角新建'); return; }
    t.innerHTML =
      '<table class="tbl"><thead><tr><th>入库单号</th><th>供应商</th><th>仓库</th><th>入库数量</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>' +
      list.map(o =>
        '<tr><td class="mono">' + esc(o.no) + '</td><td>' + (esc(o.supplier) || '—') + '</td><td>' + esc(o.warehouseName) + '</td><td class="num">' + o.totalQty + '</td><td>' + statusBadge(o.status) + '</td><td class="muted">' + fmt(o.createdAt) + '</td><td style="white-space:nowrap">' + inboundActions(o) + '</td></tr>'
      ).join('') + '</tbody></table>';

    $$('[data-act]', t).forEach(b => {
      b.onclick = async () => {
        const o = list.find(x => x.id === b.dataset.id);
        const act = b.dataset.act;
        if (act === 'detail') return showOrderDetail(o, 'inbound');
        if (act === 'confirm') {
          if (!(await confirmDialog('确认入库单 ' + o.no + ' 并完成上架？库存将同步增加。', { danger: false, okText: '确认入库' }))) return;
          try { await api('/inbound/' + o.id + '/confirm', { method: 'POST' }); toast('入库完成，库存已增加', 'success'); loadInbound(); }
          catch (e) { toast(e.message, 'error'); }
        } else if (act === 'cancel') {
          if (!(await confirmDialog('确定作废入库单 ' + o.no + ' 吗？'))) return;
          try { await api('/inbound/' + o.id + '/cancel', { method: 'POST' }); toast('已作废', 'success'); loadInbound(); }
          catch (e) { toast(e.message, 'error'); }
        } else if (act === 'delete') {
          if (!(await confirmDialog('确定删除入库单 ' + o.no + ' 吗？'))) return;
          try { await api('/inbound/' + o.id, { method: 'DELETE' }); toast('已删除', 'success'); loadInbound(); }
          catch (e) { toast(e.message, 'error'); }
        }
      };
    });
  }

  function inboundActions(o) {
    const btns = [];
    if (o.status === 'PENDING') {
      btns.push('<button class="btn btn-sm btn-primary" data-act="confirm" data-id="' + o.id + '">确认入库</button>');
      btns.push('<button class="btn btn-sm" data-act="cancel" data-id="' + o.id + '">作废</button>');
    }
    btns.push('<button class="btn btn-sm btn-ghost" data-act="detail" data-id="' + o.id + '">详情</button>');
    if (o.status !== 'COMPLETED') btns.push('<button class="btn btn-sm btn-danger" data-act="delete" data-id="' + o.id + '">删除</button>');
    return btns.join(' ');
  }

  async function openInboundCreate() {
    const [products, warehouses, locations] = await Promise.all([api('/products'), api('/warehouses'), api('/locations')]);
    if (!products.length) return toast('请先在「商品管理」中创建商品', 'error');
    if (!locations.length) return toast('请先在「仓库库位」中创建库位', 'error');

    let items = [{ productId: '', qty: 1, locationId: '' }];

    openModal({
      title: '新建入库单',
      wide: true,
      okText: '创建入库单',
      body:
        '<div class="form-grid">' +
          '<div class="field"><label>供应商</label><input class="input" id="ioSupplier" placeholder="如：华南日化供应链"></div>' +
          '<div class="field"><label>收货仓库 *</label><select class="select" id="ioWh">' +
            warehouses.map(w => '<option value="' + w.id + '">' + esc(w.name) + '</option>').join('') + '</select></div>' +
          '<div class="field full"><label>备注</label><input class="input" id="ioRemark" placeholder="选填"></div>' +
        '</div>' +
        '<div class="field"><label>入库明细</label><div class="items-editor" id="ioItems"></div></div>',
      onMount: ({ bodyEl }) => {
        const whSel = $('#ioWh', bodyEl);
        const itemsEl = $('#ioItems', bodyEl);

        function renderItems() {
          const wh = whSel.value;
          itemsEl.innerHTML =
            '<div class="ie-row head"><div>商品</div><div>数量</div><div>上架库位</div><div></div></div>' +
            items.map((it, idx) =>
              '<div class="ie-row" data-idx="' + idx + '">' +
                '<select class="select" data-f="productId">' + productOptions(products, it.productId) + '</select>' +
                '<input class="input" type="number" min="1" data-f="qty" value="' + it.qty + '">' +
                '<select class="select" data-f="locationId">' + locationOptions(locations, wh, it.locationId) + '</select>' +
                '<button class="ie-del" data-del="' + idx + '" type="button">' + icon('trash') + '</button>' +
              '</div>'
            ).join('') +
            '<button class="btn btn-sm ie-add" data-add type="button">' + icon('plus') + ' 添加明细</button>';
        }

        itemsEl.addEventListener('change', e => {
          const row = e.target.closest('[data-idx]'); if (!row) return;
          const idx = +row.dataset.idx; const f = e.target.dataset.f;
          if (f) { items[idx][f] = e.target.value; if (f === 'productId') items[idx][f] = e.target.value; }
        });
        itemsEl.addEventListener('input', e => {
          if (e.target.dataset.f === 'qty') { const row = e.target.closest('[data-idx]'); items[+row.dataset.idx].qty = e.target.value; }
        });
        itemsEl.addEventListener('click', e => {
          const del = e.target.closest('[data-del]');
          if (del) { items.splice(+del.dataset.del, 1); if (!items.length) items.push({ productId: '', qty: 1, locationId: '' }); renderItems(); return; }
          if (e.target.closest('[data-add]')) { items.push({ productId: '', qty: 1, locationId: '' }); renderItems(); }
        });
        whSel.addEventListener('change', () => { items.forEach(i => i.locationId = ''); renderItems(); });
        renderItems();
      },
      onOk: async ({ bodyEl }) => {
        const warehouseId = val(bodyEl, '#ioWh');
        const valid = items.filter(i => i.productId && num(i.qty) > 0);
        if (!valid.length) throw new Error('请至少填写一条有效明细');
        for (const it of valid) if (!it.locationId) throw new Error('请为每条明细选择上架库位');
        await api('/inbound', {
          method: 'POST',
          body: {
            supplier: val(bodyEl, '#ioSupplier'), warehouseId,
            remark: val(bodyEl, '#ioRemark'),
            items: valid.map(i => ({ productId: i.productId, qty: num(i.qty), locationId: i.locationId }))
          }
        });
        toast('入库单已创建，待确认入库', 'success');
        loadInbound();
      }
    });
  }

  /* -------------------------- 页面：出库 -------------------------- */
  async function pageOutbound() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>出库单</h3><div class="spacer"></div><button class="btn btn-primary btn-sm" id="addOut">' + icon('plus') + ' 新建出库单</button></div>' +
        '<div class="table-wrap" id="outTable" style="margin-top:6px"></div>' +
      '</div>';
    $('#addOut').onclick = openOutboundCreate;
    await loadOutbound();
  }

  async function loadOutbound() {
    const list = await api('/outbound');
    const t = $('#outTable');
    if (!t) return;
    if (!list.length) { t.innerHTML = emptyState('暂无出库单，点击右上角新建'); return; }
    t.innerHTML =
      '<table class="tbl"><thead><tr><th>出库单号</th><th>客户</th><th>仓库</th><th>出库数量</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>' +
      list.map(o =>
        '<tr><td class="mono">' + esc(o.no) + '</td><td>' + (esc(o.customer) || '—') + '</td><td>' + esc(o.warehouseName) + '</td><td class="num">' + o.totalQty + '</td><td>' + statusBadge(o.status) + '</td><td class="muted">' + fmt(o.createdAt) + '</td><td style="white-space:nowrap">' + outboundActions(o) + '</td></tr>'
      ).join('') + '</tbody></table>';

    $$('[data-act]', t).forEach(b => {
      b.onclick = async () => {
        const o = list.find(x => x.id === b.dataset.id);
        const act = b.dataset.act;
        if (act === 'detail') return showOrderDetail(o, 'outbound');
        if (act === 'confirm') {
          if (!(await confirmDialog('确认出库单 ' + o.no + '？系统将自动分配库位并扣减库存。', { danger: false, okText: '确认出库' }))) return;
          try { await api('/outbound/' + o.id + '/confirm', { method: 'POST' }); toast('出库完成，库存已扣减', 'success'); loadOutbound(); }
          catch (e) { toast(e.message, 'error'); }
        } else if (act === 'cancel') {
          if (!(await confirmDialog('确定作废出库单 ' + o.no + ' 吗？'))) return;
          try { await api('/outbound/' + o.id + '/cancel', { method: 'POST' }); toast('已作废', 'success'); loadOutbound(); }
          catch (e) { toast(e.message, 'error'); }
        } else if (act === 'delete') {
          if (!(await confirmDialog('确定删除出库单 ' + o.no + ' 吗？'))) return;
          try { await api('/outbound/' + o.id, { method: 'DELETE' }); toast('已删除', 'success'); loadOutbound(); }
          catch (e) { toast(e.message, 'error'); }
        }
      };
    });
  }

  function outboundActions(o) {
    const btns = [];
    if (o.status === 'PENDING') {
      btns.push('<button class="btn btn-sm btn-primary" data-act="confirm" data-id="' + o.id + '">确认出库</button>');
      btns.push('<button class="btn btn-sm" data-act="cancel" data-id="' + o.id + '">作废</button>');
    }
    btns.push('<button class="btn btn-sm btn-ghost" data-act="detail" data-id="' + o.id + '">详情</button>');
    if (o.status !== 'COMPLETED') btns.push('<button class="btn btn-sm btn-danger" data-act="delete" data-id="' + o.id + '">删除</button>');
    return btns.join(' ');
  }

  async function openOutboundCreate() {
    const [products, warehouses] = await Promise.all([api('/products'), api('/warehouses')]);
    if (!products.length) return toast('请先在「商品管理」中创建商品', 'error');

    let items = [{ productId: '', qty: 1 }];

    openModal({
      title: '新建出库单',
      wide: true,
      okText: '创建出库单',
      body:
        '<div class="form-grid">' +
          '<div class="field"><label>客户</label><input class="input" id="ouCustomer" placeholder="如：天猫旗舰店"></div>' +
          '<div class="field"><label>发货仓库 *</label><select class="select" id="ouWh">' +
            warehouses.map(w => '<option value="' + w.id + '">' + esc(w.name) + '</option>').join('') + '</select></div>' +
          '<div class="field full"><label>备注</label><input class="input" id="ouRemark" placeholder="选填"></div>' +
        '</div>' +
        '<div class="field"><label>出库明细</label><div class="items-editor" id="ouItems"></div></div>' +
        '<p class="muted" style="font-size:12.5px;margin-top:2px">提示：确认出库时系统会按库位库存自动分配拣货并扣减。</p>',
      onMount: ({ bodyEl }) => {
        const itemsEl = $('#ouItems', bodyEl);
        function renderItems() {
          itemsEl.innerHTML =
            '<div class="ie-row head" style="grid-template-columns:1.6fr .8fr 34px"><div>商品</div><div>数量</div><div></div></div>' +
            items.map((it, idx) =>
              '<div class="ie-row" data-idx="' + idx + '" style="grid-template-columns:1.6fr .8fr 34px">' +
                '<select class="select" data-f="productId">' + productOptions(products, it.productId) + '</select>' +
                '<input class="input" type="number" min="1" data-f="qty" value="' + it.qty + '">' +
                '<button class="ie-del" data-del="' + idx + '" type="button">' + icon('trash') + '</button>' +
              '</div>'
            ).join('') +
            '<button class="btn btn-sm ie-add" data-add type="button">' + icon('plus') + ' 添加明细</button>';
        }
        itemsEl.addEventListener('change', e => {
          const row = e.target.closest('[data-idx]'); if (!row) return;
          if (e.target.dataset.f) items[+row.dataset.idx][e.target.dataset.f] = e.target.value;
        });
        itemsEl.addEventListener('input', e => {
          if (e.target.dataset.f === 'qty') { const row = e.target.closest('[data-idx]'); items[+row.dataset.idx].qty = e.target.value; }
        });
        itemsEl.addEventListener('click', e => {
          const del = e.target.closest('[data-del]');
          if (del) { items.splice(+del.dataset.del, 1); if (!items.length) items.push({ productId: '', qty: 1 }); renderItems(); return; }
          if (e.target.closest('[data-add]')) { items.push({ productId: '', qty: 1 }); renderItems(); }
        });
        renderItems();
      },
      onOk: async ({ bodyEl }) => {
        const warehouseId = val(bodyEl, '#ouWh');
        const valid = items.filter(i => i.productId && num(i.qty) > 0);
        if (!valid.length) throw new Error('请至少填写一条有效明细');
        await api('/outbound', {
          method: 'POST',
          body: {
            customer: val(bodyEl, '#ouCustomer'), warehouseId,
            remark: val(bodyEl, '#ouRemark'),
            items: valid.map(i => ({ productId: i.productId, qty: num(i.qty) }))
          }
        });
        toast('出库单已创建，待确认出库', 'success');
        loadOutbound();
      }
    });
  }

  /* -------------------------- 单据详情 -------------------------- */
  function showOrderDetail(o, type) {
    const isIn = type === 'inbound';
    const rows = o.items.map(it =>
      '<tr><td><strong>' + esc(it.productName) + '</strong><div class="muted mono" style="font-size:12px">' + esc(it.productCode) + '</div></td>' +
      '<td class="num">' + it.qty + ' ' + esc(it.unit) + '</td>' +
      (isIn ? '<td class="mono">' + esc(it.locationCode) + '</td>' : '') + '</tr>'
    ).join('');
    openModal({
      title: (isIn ? '入库单详情 · ' : '出库单详情 · ') + o.no,
      wide: true,
      okText: '关闭',
      hideCancel: true,
      body:
        '<div class="detail-row"><span class="k">单号</span><span class="v mono">' + esc(o.no) + '</span></div>' +
        '<div class="detail-row"><span class="k">' + (isIn ? '供应商' : '客户') + '</span><span class="v">' + (esc(isIn ? o.supplier : o.customer) || '—') + '</span></div>' +
        '<div class="detail-row"><span class="k">仓库</span><span class="v">' + esc(o.warehouseName) + '</span></div>' +
        '<div class="detail-row"><span class="k">状态</span><span class="v">' + statusBadge(o.status) + '</span></div>' +
        '<div class="detail-row"><span class="k">创建时间</span><span class="v">' + fmt(o.createdAt) + '</span></div>' +
        (o.confirmedAt ? '<div class="detail-row"><span class="k">完成时间</span><span class="v">' + fmt(o.confirmedAt) + '</span></div>' : '') +
        (o.remark ? '<div class="detail-row"><span class="k">备注</span><span class="v">' + esc(o.remark) + '</span></div>' : '') +
        '<div style="margin-top:18px"><div style="font-weight:700;margin-bottom:8px;font-size:13.5px">商品明细</div>' +
          '<div class="table-wrap" style="border:1px solid var(--border);border-radius:10px"><table class="tbl"><thead><tr><th>商品</th><th>数量</th>' + (isIn ? '<th>上架库位</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '</div>'
    });
  }

  /* -------------------------- 页面：库存查询 -------------------------- */
  async function pageInventory() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>实时库存</h3><div class="spacer"></div><span class="muted" id="invCount" style="font-size:12.5px"></span></div>' +
        '<div class="toolbar" style="padding:16px 22px 0">' +
          '<div class="search">' + icon('search') + '<input class="input" id="invSearch" placeholder="搜索商品 / 库位"></div>' +
          '<select class="select" id="invWh"><option value="">全部仓库</option></select>' +
        '</div>' +
        '<div class="table-wrap" id="invTable" style="margin-top:14px"></div>' +
      '</div>';

    const whs = await api('/warehouses');
    const whSel = $('#invWh');
    whs.forEach(w => { const o = document.createElement('option'); o.value = w.id; o.textContent = w.name; whSel.appendChild(o); });

    async function load() {
      const kw = $('#invSearch').value.trim();
      const wh = whSel.value;
      const qs = new URLSearchParams();
      if (kw) qs.set('keyword', kw);
      if (wh) qs.set('warehouseId', wh);
      const list = await api('/inventory' + (qs.toString() ? '?' + qs.toString() : ''));
      $('#invCount').textContent = '共 ' + list.length + ' 条库存记录';
      const t = $('#invTable');
      if (!list.length) { t.innerHTML = emptyState('暂无库存记录'); return; }
      t.innerHTML =
        '<table class="tbl"><thead><tr><th>商品</th><th>商品编码</th><th>仓库</th><th>库位</th><th>批次</th><th>数量</th><th>更新时间</th></tr></thead><tbody>' +
        list.map(i =>
          '<tr><td><strong>' + esc(i.productName) + '</strong><div class="muted" style="font-size:12px">' + esc(i.spec) + '</div></td><td class="mono">' + esc(i.productCode) + '</td><td>' + esc(i.warehouseName) + '</td><td class="mono">' + esc(i.locationCode) + '</td><td class="mono muted">' + esc(i.batchNo) + '</td><td class="num">' + i.qty + ' ' + esc(i.unit) + '</td><td class="muted">' + fmt(i.updatedAt) + '</td></tr>'
        ).join('') + '</tbody></table>';
    }

    $('#invSearch').addEventListener('input', debounce(load, 300));
    whSel.addEventListener('change', load);
    await load();
  }

  /* -------------------------- 页面：库存流水 -------------------------- */
  async function pageLogs() {
    $('#content').innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>库存流水</h3><div class="spacer"></div><span class="muted" id="logCount" style="font-size:12.5px"></span></div>' +
        '<div class="toolbar" style="padding:16px 22px 0">' +
          '<div class="search">' + icon('search') + '<input class="input" id="logSearch" placeholder="搜索商品 / 单号 / 库位"></div>' +
          '<select class="select" id="logType"><option value="">全部类型</option><option value="IN">入库</option><option value="OUT">出库</option></select>' +
        '</div>' +
        '<div class="table-wrap" id="logTable" style="margin-top:14px"></div>' +
      '</div>';

    async function load() {
      const kw = $('#logSearch').value.trim();
      const type = $('#logType').value;
      const qs = new URLSearchParams();
      if (kw) qs.set('keyword', kw);
      if (type) qs.set('type', type);
      const list = await api('/logs' + (qs.toString() ? '?' + qs.toString() : ''));
      $('#logCount').textContent = '共 ' + list.length + ' 条记录';
      const t = $('#logTable');
      if (!list.length) { t.innerHTML = emptyState('暂无流水记录'); return; }
      t.innerHTML =
        '<table class="tbl"><thead><tr><th>时间</th><th>类型</th><th>商品</th><th>库位</th><th>数量</th><th>关联单号</th><th>备注</th></tr></thead><tbody>' +
        list.map(l => {
          const badge = l.type === 'IN' ? '<span class="badge green">入库</span>' : l.type === 'OUT' ? '<span class="badge orange">出库</span>' : '<span class="badge blue">调整</span>';
          const sign = l.type === 'OUT' ? '-' : '+';
          return '<tr><td class="muted">' + fmt(l.createdAt) + '</td><td>' + badge + '</td><td><strong>' + esc(l.productName) + '</strong></td><td class="mono">' + (esc(l.locationCode) || '—') + '</td><td class="num" style="color:' + (l.type === 'OUT' ? 'var(--warning)' : 'var(--success)') + '">' + sign + l.qty + ' ' + esc(l.unit) + '</td><td class="mono muted">' + esc(l.refNo || '—') + '</td><td class="muted">' + (esc(l.remark) || '—') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    $('#logSearch').addEventListener('input', debounce(load, 300));
    $('#logType').addEventListener('change', load);
    await load();
  }

  /* -------------------------- 启动 -------------------------- */
  async function init() {
    const saved = localStorage.getItem('wms_token');
    if (!saved) return showLogin();
    try {
      const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + saved } });
      if (!res.ok) throw new Error('invalid');
      const d = await res.json();
      state.token = saved;
      state.user = d.user;
      startApp();
    } catch (e) {
      localStorage.removeItem('wms_token');
      showLogin();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
