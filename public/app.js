/* =====================================================================
   VaultCRM :: Workspace app
   Tabs mirror an ops workspace: Home, Users, Companies, Locations,
   Contacts, Projects, Indi projects, Scripts mail, Calendar,
   Scriptbuilders & blasts, Sales events, Vendors, Notepad,
   Scripts sent mail, New table. Works in browser mode (GitHub Pages)
   and server mode (Express + Postgres) through the same API.
   ===================================================================== */
(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'for') n.htmlFor = v;
      else if (['value', 'checked', 'disabled', 'selected', 'type', 'placeholder', 'rows', 'step', 'tabIndex'].includes(k)) n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  const ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4',
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
    contact: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M5.5 17a4 4 0 0 1 7 0M15 9h3M15 13h3',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    folderUser: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M8.8 18a3.5 3.5 0 0 1 6.4 0',
    mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    calendar: 'M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 10h18M8 3v4M16 3v4',
    layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
    trend: 'M3 17l6-6 4 4 8-8M14 7h7v7',
    truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    note: 'M5 3h10l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8 12h8M8 16h6',
    plus: 'M12 5v14M5 12h14',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-4.3-4.3',
    sliders: 'M4 6h10M18 6h2M16 4v4M4 12h4M12 12h8M10 10v4M4 18h12M18 16v4',
    x: 'M6 6l12 12M18 6 6 18',
    menu: 'M4 7h16M4 12h16M4 17h16',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    chevL: 'M15 6l-6 6 6 6',
    chevR: 'M9 6l6 6-6 6',
    list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
    upload: 'M12 15V3M7 8l5-5 5 5M4 21h16',
    arrowR: 'M5 12h14M13 6l6 6-6 6'
  };
  function icon(name, cls = 'i') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', cls);
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICONS[name] || ICONS.grid);
    if (name === 'more') s.style.strokeWidth = '3';
    s.append(p);
    return s;
  }

  const humanize = (k) => {
    const s = String(k).replace(/_/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const slug = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, '_$1').slice(0, 63);

  // ---------------------------------------------------------------------
  // Settings (per device)
  // ---------------------------------------------------------------------
  const DEFAULT_QUEUES = ['Downloads/Callbacks', 'DL/CB Manager', 'Tech Support', 'Billing', 'Sales'];
  const settings = Object.assign(
    { name: '', meId: '', workspace: 'Workspace', theme: '', apiKey: '', queues: DEFAULT_QUEUES, welcomed: false },
    (() => { try { return JSON.parse(localStorage.getItem('vault_settings') || '{}'); } catch (_) { return {}; } })()
  );
  if (!Array.isArray(settings.queues) || !settings.queues.length) settings.queues = DEFAULT_QUEUES.slice();
  function saveSettings() {
    try { localStorage.setItem('vault_settings', JSON.stringify(settings)); } catch (_) {}
  }
  function applyTheme() {
    if (settings.theme) document.documentElement.dataset.theme = settings.theme;
    else delete document.documentElement.dataset.theme;
    const dark = isDark();
    $('#themeBtn').replaceChildren(icon(dark ? 'sun' : 'moon'));
    $('#themeBtn').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#0E1117' : '#ECEEF2');
  }
  const isDark = () => settings.theme ? settings.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;

  // ---------------------------------------------------------------------
  // API (browser mode on GitHub Pages, server mode elsewhere)
  // ---------------------------------------------------------------------
  const LOCAL = /\.github\.io$/i.test(location.hostname) ||
    new URLSearchParams(location.search).has('local') || location.protocol === 'file:';

  async function api(method, url, body) {
    let status, data;
    if (LOCAL) {
      ({ status, body: data } = await VaultLocal.request(method, url, body));
    } else {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey || '' },
        body: body ? JSON.stringify(body) : undefined
      });
      status = res.status;
      data = await res.json().catch(() => ({}));
    }
    if (status >= 400) {
      const err = new Error(data.error || `Request failed (${status})`);
      err.details = data.details;
      err.status = status;
      throw err;
    }
    return data;
  }

  // ---------------------------------------------------------------------
  // Workspace definition
  // ---------------------------------------------------------------------
  const APP = 'Workspace';
  const STATUS = 'CHOICE:Intake|Scripting|Production|Review|Delivered|On hold';
  const f = (n, t, extra) => Object.assign({ n, t }, extra);
  const full = (...parts) => parts.filter(Boolean).join(' ').trim();

  // Order here = creation order (link targets come first).
  const SPEC = [
    { key: 'users', table: 'Users', label: 'Users', single: 'user', icon: 'users', group: 'Directory',
      fields: [f('name', 'TEXT'), f('role', 'CHOICE:Admin|Production|Sales|Support|Billing'), f('email', 'EMAIL'), f('phone', 'PHONE'), f('active', 'BOOLEAN')],
      title: (p) => p.name, columns: ['name', 'role', 'email', 'phone', 'active'] },
    { key: 'companies', table: 'Companies', label: 'Companies', single: 'company', icon: 'building', group: 'Directory',
      fields: [f('company_name', 'TEXT'), f('status', 'CHOICE:Lead|Active|Inactive'), f('phone', 'PHONE'), f('website', 'URL'), f('industry', 'TEXT'), f('notes', 'LONGTEXT')],
      title: (p) => p.company_name, columns: ['company_name', 'status', 'phone', 'website', 'industry'] },
    { key: 'locations', table: 'Locations', label: 'Locations', single: 'location', icon: 'pin', group: 'Directory',
      fields: [f('location_name', 'TEXT'), f('company', 'REF:@companies'), f('address', 'TEXT'), f('city', 'TEXT'), f('state', 'TEXT'), f('zip', 'TEXT'), f('phone', 'PHONE')],
      title: (p) => p.location_name, columns: ['location_name', 'company', 'city', 'state', 'phone'] },
    { key: 'contacts', table: 'Contacts', label: 'Contacts', single: 'contact', icon: 'contact', group: 'Directory',
      fields: [f('first_name', 'TEXT'), f('last_name', 'TEXT'), f('company', 'REF:@companies'), f('location', 'REF:@locations'), f('job_title', 'TEXT'), f('email', 'EMAIL'), f('phone', 'PHONE')],
      title: (p) => full(p.first_name, p.last_name), columns: ['first_name', 'last_name', 'company', 'job_title', 'email', 'phone'] },
    { key: 'vendors', table: 'Vendors', label: 'Vendors', single: 'vendor', icon: 'truck', group: 'Directory',
      fields: [f('vendor_name', 'TEXT'), f('service', 'TEXT'), f('contact_name', 'TEXT'), f('email', 'EMAIL'), f('phone', 'PHONE'), f('website', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.vendor_name, columns: ['vendor_name', 'service', 'contact_name', 'email', 'phone'] },
    { key: 'projects', table: 'Projects', label: 'Projects', single: 'project', icon: 'folder', group: 'Production',
      fields: [f('project_title', 'TEXT'), f('status', STATUS), f('queue', 'TEXT', { ui: 'queue' }), f('assigned_to', 'REF:@users'),
        f('company', 'REF:@companies'), f('project_type', 'CHOICE:Implementation|Production only|Script update|Any'), f('date_due', 'DATE'),
        f('url', 'URL'), f('url_details', 'TEXT'), f('project_attachment', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.project_title,
      columns: ['status', 'assigned_to', 'company', 'project_title', 'project_type', 'date_due', 'url', 'url_details', 'project_attachment'],
      sort: { field: 'date_due', dir: 1 } },
    { key: 'indi_projects', table: 'Indi Projects', label: 'Indi projects', single: 'indi project', icon: 'folderUser', group: 'Production',
      fields: [f('project_title', 'TEXT'), f('status', STATUS), f('assigned_to', 'REF:@users'), f('company', 'REF:@companies'), f('date_due', 'DATE'), f('url', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.project_title, columns: ['project_title', 'status', 'assigned_to', 'company', 'date_due'], sort: { field: 'date_due', dir: 1 } },
    { key: 'scripts_mail', table: 'Scripts Mail', label: 'Scripts mail', single: 'script', icon: 'mail', group: 'Production',
      fields: [f('subject', 'TEXT'), f('status', 'CHOICE:New|In progress|Done'), f('company', 'REF:@companies'), f('contact', 'REF:@contacts'), f('received', 'DATE'), f('script', 'LONGTEXT')],
      title: (p) => p.subject, columns: ['subject', 'status', 'company', 'contact', 'received'] },
    { key: 'scripts_sent', table: 'Scripts Sent Mail', label: 'Scripts sent mail', single: 'sent script', icon: 'send', group: 'Production',
      fields: [f('subject', 'TEXT'), f('company', 'REF:@companies'), f('sent_to', 'EMAIL'), f('date_sent', 'DATE'), f('script', 'LONGTEXT')],
      title: (p) => p.subject, columns: ['subject', 'company', 'sent_to', 'date_sent'] },
    { key: 'scriptbuilders', table: 'Scriptbuilders & Blasts', label: 'Scriptbuilders & blasts', single: 'PDF', icon: 'layers', group: 'Production',
      fields: [f('title', 'TEXT'), f('kind', 'CHOICE:Scriptbuilder|Blast'), f('pdf_link', 'URL', { label: 'PDF link' }), f('date', 'DATE'), f('notes', 'LONGTEXT')],
      title: (p) => p.title, columns: ['title', 'kind', 'pdf_link', 'date'] },
    { key: 'calendar', table: 'Calendar', label: 'Calendar', single: 'event', icon: 'calendar', group: 'Schedule', view: 'calendar', dateField: 'date',
      fields: [f('title', 'TEXT'), f('date', 'DATE'), f('time', 'TEXT'), f('assigned_to', 'REF:@users'), f('company', 'REF:@companies'), f('notes', 'LONGTEXT')],
      title: (p) => p.title, columns: ['title', 'date', 'time', 'assigned_to', 'company'], sort: { field: 'date', dir: 1 } },
    { key: 'sales_events', table: 'Sales Events', label: 'Sales events', single: 'sales event', icon: 'trend', group: 'Schedule', view: 'calendar', dateField: 'date',
      fields: [f('event', 'TEXT'), f('date', 'DATE'), f('status', 'CHOICE:Planned|Done|Cancelled'), f('company', 'REF:@companies'), f('value', 'NUMBER'), f('notes', 'LONGTEXT')],
      title: (p) => p.event, columns: ['event', 'date', 'status', 'company', 'value'], sort: { field: 'date', dir: 1 } },
    { key: 'notepad', table: 'Notepad', label: 'Notepad', single: 'note', icon: 'note', group: 'Notes', view: 'notes',
      fields: [f('title', 'TEXT'), f('body', 'LONGTEXT'), f('pinned', 'BOOLEAN')],
      title: (p) => p.title, columns: ['title', 'body', 'pinned'] }
  ];
  const GROUPS = ['Directory', 'Production', 'Schedule', 'Notes', 'Custom'];
  const BOTTOM = ['home', 'projects', 'contacts', 'calendar'];

  let specs = [];             // SPEC entries + custom tables, each with .reg
  const byKey = {};
  const byRegId = {};
  const cache = {};           // key -> records[]
  const ui = {};              // key -> {q, chip, sort, mode, month}

  const labelOf = (spec) => spec.key === 'calendar' ? (settings.name ? `${settings.name}'s calendar` : 'Calendar') : spec.label;
  const schemaOf = (spec) => spec.reg.fields_schema;
  const hintOf = (spec, field) => (spec.fields || []).find((x) => x.n === field) || {};
  const fieldLabel = (spec, field) => hintOf(spec, field).label || humanize(field);
  const typeOf = (spec, field) => VaultLocal.parseType(schemaOf(spec)[field]) || { base: 'TEXT' };

  async function bootstrap() {
    const { tables } = await api('GET', '/api/registry/list');
    const mine = new Map(tables.filter((t) => t.app_name === APP).map((t) => [t.table_name, t]));
    specs = [];
    for (const s of SPEC) {
      let reg = mine.get(s.table);
      if (!reg) {
        const fields_schema = {};
        for (const fd of s.fields) {
          fields_schema[fd.n] = fd.t.startsWith('REF:@') ? 'REF:' + byKey[fd.t.slice(5)].reg.id : fd.t;
        }
        const r = await api('POST', '/api/registry/create-table', { app_name: APP, table_name: s.table, fields_schema });
        reg = Object.assign(r.table, { record_count: 0 });
      }
      const spec = Object.assign({}, s, { reg });
      specs.push(spec);
      byKey[spec.key] = spec;
      byRegId[reg.id] = spec;
    }
    for (const t of tables) {
      if (byRegId[t.id]) continue;
      const spec = {
        key: 'c_' + t.id.slice(0, 8), table: t.table_name, custom: true,
        label: t.app_name === 'Custom' ? t.table_name : `${t.table_name}`, single: 'record',
        icon: 'grid', group: 'Custom', reg: t, fields: [],
        columns: Object.keys(t.fields_schema).slice(0, 7)
      };
      specs.push(spec);
      byKey[spec.key] = spec;
      byRegId[t.id] = spec;
    }
  }

  async function refreshCounts() {
    try {
      const { tables } = await api('GET', '/api/registry/list');
      tables.forEach((t) => { if (byRegId[t.id]) byRegId[t.id].reg.record_count = t.record_count; });
      renderNav();
    } catch (_) {}
  }

  // ---------------------------------------------------------------------
  // Records
  // ---------------------------------------------------------------------
  async function load(spec, force) {
    if (!force && cache[spec.key]) return cache[spec.key];
    const r = await api('POST', '/api/vault/query-records', { registry_id: spec.reg.id, limit: 500 });
    cache[spec.key] = r.records;
    spec.reg.record_count = Math.max(spec.reg.record_count || 0, r.records.length);
    return r.records;
  }
  const refTargets = (spec) => Object.keys(schemaOf(spec))
    .map((k) => typeOf(spec, k)).filter((t) => t.base === 'REF').map((t) => byRegId[t.target]).filter(Boolean);
  async function loadWithRefs(spec) {
    await Promise.all([load(spec), ...refTargets(spec).map((s) => load(s))]);
    return cache[spec.key];
  }

  function titleOf(spec, rec) {
    const p = rec.payload;
    let t = spec.title ? spec.title(p) : null;
    if (!t) {
      const k = Object.keys(schemaOf(spec)).find((x) => ['TEXT', 'EMAIL'].includes(typeOf(spec, x).base) && p[x]);
      t = k ? p[k] : null;
    }
    return t || 'Untitled';
  }
  function refLabel(targetRegId, id) {
    const s = byRegId[targetRegId];
    const rec = s && (cache[s.key] || []).find((r) => r.id === id);
    return rec ? titleOf(s, rec) : 'Linked record';
  }

  // ---------------------------------------------------------------------
  // Value display
  // ---------------------------------------------------------------------
  const HUES = { delivered: 150, done: 150, active: 150, 'in progress': 210, production: 36, scripting: 265, review: 190, intake: 220,
    lead: 285, new: 210, planned: 210, 'on hold': 8, cancelled: 8, inactive: 0, implementation: 320, blast: 340, scriptbuilder: 190 };
  function hue(s) {
    const k = String(s).toLowerCase();
    if (k in HUES) return HUES[k];
    let h = 7;
    for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }
  const pill = (v) => el('span', { class: 'pill', style: `--h:${hue(v)}` }, v);
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  function fmtDate(v) {
    const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
    if (!y) return String(v);
    const dt = new Date(y, m - 1, d);
    const opts = { month: 'short', day: 'numeric' };
    if (y !== new Date().getFullYear()) opts.year = 'numeric';
    return dt.toLocaleDateString(undefined, opts);
  }
  const DONE = new Set(['Delivered', 'Done', 'Cancelled']);

  function display(spec, field, rec) {
    const v = rec.payload[field];
    if (v === undefined || v === null || v === '') return null;
    const t = typeOf(spec, field);
    switch (t.base) {
      case 'CHOICE': return pill(v);
      case 'REF': return el('span', { class: 'cell-ref' }, refLabel(t.target, v));
      case 'DATE': {
        const overdue = /due/.test(field) && v.slice(0, 10) < todayISO() && !DONE.has(rec.payload.status);
        return el('span', { class: 'cell-mono' + (overdue ? ' overdue' : ''), title: overdue ? 'Past due' : null }, fmtDate(v));
      }
      case 'URL': {
        let short = v;
        try { const u = new URL(v); short = (u.hostname + u.pathname).replace(/\/$/, '').split('/').pop() || u.hostname; } catch (_) {}
        return el('a', { class: 'cell-link', href: v, target: '_blank', rel: 'noopener noreferrer', title: v, onclick: (e) => e.stopPropagation() }, icon('external'), short);
      }
      case 'EMAIL': return el('a', { href: 'mailto:' + v, onclick: (e) => e.stopPropagation() }, v);
      case 'PHONE': return el('a', { class: 'cell-mono', href: 'tel:' + v.replace(/[^\d+]/g, ''), onclick: (e) => e.stopPropagation() }, v);
      case 'BOOLEAN': return v ? pill('Yes') : null;
      case 'NUMBER': return el('span', { class: 'cell-mono' }, Number(v).toLocaleString());
      case 'LONGTEXT': return el('span', { class: 'cell-clip' }, v);
      default: return el('span', {}, v);
    }
  }
  function searchText(spec, rec) {
    return Object.keys(schemaOf(spec)).map((k) => {
      const v = rec.payload[k];
      if (v === undefined) return '';
      const t = typeOf(spec, k);
      return t.base === 'REF' ? refLabel(t.target, v) : String(v);
    }).join(' ').toLowerCase();
  }
  function sortValue(spec, field, rec) {
    const v = rec.payload[field];
    if (v === undefined || v === null) return null;
    const t = typeOf(spec, field);
    if (t.base === 'REF') return refLabel(t.target, v).toLowerCase();
    if (t.base === 'NUMBER') return Number(v);
    if (t.base === 'BOOLEAN') return v ? 1 : 0;
    return String(v).toLowerCase();
  }

  // ---------------------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------------------
  function toast(msg, err) {
    const t = el('div', { class: 'toast' + (err ? ' err' : '') }, msg);
    $('#toasts').append(t);
    setTimeout(() => t.remove(), err ? 5000 : 2600);
  }

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = path.split('/');
    if (parts[0] === 't' && byKey[parts[1]]) return { name: 'table', key: parts[1], params };
    if (parts[0] === 'new') return { name: 'new', params };
    return { name: 'home', params };
  }
  const go = (hash) => { location.hash = hash; };

  function navItem(key, label, ic, count, extraClass) {
    const r = route();
    const current = (key === 'home' && r.name === 'home') || (key === 'new' && r.name === 'new') || (r.name === 'table' && r.key === key);
    const href = key === 'home' ? '#/' : key === 'new' ? '#/new' : '#/t/' + key;
    return el('a', { class: 'nav-item' + (extraClass ? ' ' + extraClass : ''), href, 'aria-current': current ? 'page' : null, onclick: closeRail },
      icon(ic), el('span', {}, label), count !== undefined ? el('span', { class: 'count' }, count) : null);
  }
  function renderNav() {
    const nav = $('#nav');
    const groups = GROUPS.map((g) => {
      const items = specs.filter((s) => s.group === g);
      if (!items.length) return null;
      return el('div', { class: 'nav-group' }, el('div', { class: 'nav-label' }, g),
        items.map((s) => navItem(s.key, labelOf(s), s.icon, s.reg.record_count || 0)));
    });
    nav.replaceChildren(
      navItem('home', 'Home', 'home'),
      ...groups.filter(Boolean),
      el('div', { class: 'nav-group' }, navItem('new', 'New table', 'plus', undefined, 'add'))
    );
    $('#wsName').textContent = settings.workspace || 'Workspace';

    const r = route();
    $('#bottombar').replaceChildren(
      ...BOTTOM.map((k) => {
        const s = byKey[k];
        const cur = (k === 'home' && r.name === 'home') || (r.name === 'table' && r.key === k);
        return el('button', { 'aria-current': cur ? 'page' : null, onclick: () => go(k === 'home' ? '#/' : '#/t/' + k) },
          icon(k === 'home' ? 'home' : s.icon), k === 'home' ? 'Home' : (k === 'calendar' ? 'Calendar' : s.label));
      }),
      el('button', { onclick: openRail }, icon('more'), 'More')
    );
  }
  function openRail() { $('#rail').classList.add('open'); $('#scrim').hidden = false; }
  function closeRail() { $('#rail').classList.remove('open'); $('#scrim').hidden = true; }

  function setCrumbs(...parts) {
    $('#crumbs').replaceChildren(...parts.flatMap((p, i) => i < parts.length - 1 ? [el('span', {}, p), el('span', { 'aria-hidden': 'true' }, '/')] : [el('b', {}, p)]));
    document.title = `${parts[parts.length - 1]} · VaultCRM`;
  }

  // ---------------------------------------------------------------------
  // Render dispatcher
  // ---------------------------------------------------------------------
  let renderToken = 0;
  async function render() {
    const token = ++renderToken;
    renderNav();
    const r = route();
    const view = $('#view');
    try {
      let node;
      if (r.name === 'home') node = await renderHome();
      else if (r.name === 'new') node = renderBuilder();
      else node = await renderTableView(byKey[r.key], r.params);
      if (token !== renderToken) return;
      view.replaceChildren(node);
    } catch (e) {
      if (token !== renderToken) return;
      view.replaceChildren(emptyState('x', 'Couldn’t load this view', e.message, el('button', { class: 'btn', onclick: render }, 'Try again')));
    }
  }
  function emptyState(ic, title, text, action) {
    return el('div', { class: 'empty' }, el('div', { class: 'empty-mark' }, icon(ic)), el('h3', {}, title), el('p', {}, text), action || null);
  }

  // ---------------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------------
  async function renderHome() {
    setCrumbs(settings.workspace || 'Workspace', 'Home');
    const projects = byKey.projects;
    await Promise.all([loadWithRefs(projects), load(byKey.companies), load(byKey.locations), load(byKey.contacts)]);
    const all = cache.projects;
    const open = all.filter((r) => !DONE.has(r.payload.status));

    const now = new Date();
    const head = el('div', { class: 'page-head reveal' },
      el('div', {},
        el('div', { class: 'eyebrow' }, now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
        el('h1', { class: 'page-title' }, settings.name ? `${settings.name}'s homepage` : 'Homepage')),
      el('div', { class: 'page-actions' },
        el('button', { class: 'btn primary', onclick: () => openRecord(projects, null, { assigned_to: settings.meId || undefined }) }, icon('plus'), 'New project'))
    );

    // Tally board — queue buttons with live counts
    const tally = el('div', { class: 'tally' }, settings.queues.map((q) => {
      const n = open.filter((r) => r.payload.queue === q).length;
      return el('button', { class: 'tally-btn' + (n ? ' live' : ''), onclick: () => go('#/t/projects?queue=' + encodeURIComponent(q)), 'aria-label': `${q}: ${n} open` },
        el('span', { class: 'tally-top' }, el('span', { class: 'led' })),
        el('span', {}, el('span', { class: 'tally-n' }, String(n).padStart(2, '0')), el('div', { class: 'tally-label' }, q)));
    }));
    const queues = el('section', { class: 'card span-12 reveal' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Queues'),
        el('span', { class: 'eyebrow', style: 'margin-left:auto' }, `${open.length} open projects`)),
      tally);

    // Directory search
    const searchBox = (key) => {
      const s = byKey[key];
      const countHint = () => { const n = cache[key].length; return `${n} ${n === 1 ? s.single : s.label.toLowerCase()}`; };
      const results = el('div', { class: 'search-results' }, el('div', { class: 'hint' }, countHint()));
      const input = el('input', { class: 'input', type: 'search', placeholder: `Search ${s.label.toLowerCase()}`, 'aria-label': `Search ${s.label}` });
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (!q) { results.replaceChildren(el('div', { class: 'hint' }, countHint())); return; }
        const hits = cache[key].filter((r) => searchText(s, r).includes(q)).slice(0, 6);
        results.replaceChildren(...(hits.length ? hits.map((r) => el('button', { class: 'result', onclick: () => openRecord(s, r) }, icon(s.icon), titleOf(s, r))) :
          [el('button', { class: 'result', onclick: () => openRecord(s, null, { [Object.keys(schemaOf(s))[0]]: input.value.trim() }) }, icon('plus'), `Add “${input.value.trim()}”`)]));
      });
      return el('div', {}, el('label', { class: 'field' }, el('span', {}, s.label), el('div', { class: 'search' }, icon('search'), input)), results);
    };
    const searches = el('section', { class: 'card span-8 reveal' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Find')),
      el('div', { class: 'searches' }, searchBox('companies'), searchBox('locations'), searchBox('contacts')));

    const actions = el('section', { class: 'card span-4 reveal' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Quick actions')),
      el('div', { class: 'actions-row' },
        el('button', { class: 'btn', onclick: () => openRecord(byKey.notepad, null) }, icon('note'), 'New note'),
        el('button', { class: 'btn', onclick: () => openRecord(byKey.contacts, null) }, icon('contact'), 'New contact'),
        el('button', { class: 'btn', onclick: () => openRecord(byKey.calendar, null, { date: todayISO(), assigned_to: settings.meId || undefined }) }, icon('calendar'), 'New event'),
        el('a', { class: 'btn', href: '#/t/scriptbuilders' }, icon('layers'), 'Scriptbuilders & blasts PDFs')));

    // My projects
    const me = settings.meId;
    const mine = me ? all.filter((r) => r.payload.assigned_to === me) : open;
    const who = settings.name ? `${settings.name}'s projects` : 'Open projects';
    const projCard = el('section', { class: 'card span-12 reveal grid-card', style: 'padding:0' },
      el('div', { class: 'card-head', style: 'padding:18px 18px 4px' },
        el('h2', { class: 'card-title' }, who),
        el('span', { class: 'eyebrow' }, `${mine.length} ${mine.length === 1 ? 'record' : 'records'}`),
        el('a', { class: 'btn ghost sm', href: '#/t/projects', style: 'margin-left:auto' }, 'All projects', icon('arrowR'))),
      !me ? el('p', { class: 'hint', style: 'padding:0 18px' }, 'Showing every open project. Choose who you are in Settings to see only yours.') : null,
      mine.length ? gridTable(projects, sortRecords(projects, mine, projects.sort), projects.columns, () => render())
        : emptyState('folder', 'No projects here yet', me ? 'Projects assigned to you will show up here.' : 'Create your first project to get the board moving.',
          el('div', { class: 'actions-row', style: 'justify-content:center' },
            el('button', { class: 'btn primary', onclick: () => openRecord(projects, null, { assigned_to: me || undefined }) }, icon('plus'), 'New project'),
            !all.length && !hasSample() ? el('button', { class: 'btn', onclick: (e) => runSample(e.currentTarget, true) }, 'Load sample data') : null)));

    return el('div', { class: 'home-grid' }, el('div', { class: 'span-12' }, head), queues, searches, actions, projCard);
  }

  // ---------------------------------------------------------------------
  // Table views
  // ---------------------------------------------------------------------
  function sortRecords(spec, recs, sort) {
    if (!sort) return recs;
    return recs.slice().sort((a, b) => {
      const x = sortValue(spec, sort.field, a), y = sortValue(spec, sort.field, b);
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * sort.dir;
    });
  }

  function gridTable(spec, recs, columns, onSort, sortState) {
    const cols = (columns || Object.keys(schemaOf(spec))).filter((c) => c in schemaOf(spec));
    const titleField = cols.find((c) => spec.title && spec.title({ [c]: 'x' }) === 'x') || cols.find((c) => typeOf(spec, c).base === 'TEXT');
    const ordered = titleField ? [titleField, ...cols.filter((c) => c !== titleField)] : cols;
    const thead = el('thead', {}, el('tr', {}, ordered.map((c) => el('th', {
      scope: 'col', 'aria-sort': sortState && sortState.field === c ? (sortState.dir > 0 ? 'ascending' : 'descending') : null
    }, onSort && sortState ? el('button', { onclick: () => onSort(c) }, fieldLabel(spec, c)) : fieldLabel(spec, c)))));
    const tbody = el('tbody', {}, recs.map((rec) => {
      const tr = el('tr', { tabIndex: 0, onclick: () => openRecord(spec, rec), onkeydown: (e) => { if (e.key === 'Enter') openRecord(spec, rec); } },
        ordered.map((c) => {
          const d = display(spec, c, rec);
          if (c === titleField) return el('td', { 'data-label': fieldLabel(spec, c) }, el('span', { class: 'cell-title' }, d ? d.textContent : titleOf(spec, rec)));
          return el('td', { 'data-label': fieldLabel(spec, c), class: d ? null : 'blank' }, d);
        }));
      return tr;
    }));
    return el('div', { class: 'grid-scroll' }, el('table', { class: 'grid' }, thead, tbody));
  }

  async function renderTableView(spec, params) {
    await loadWithRefs(spec);
    const st = ui[spec.key] || (ui[spec.key] = { q: '', chip: '', sort: spec.sort || null, mode: spec.view === 'calendar' ? 'calendar' : 'list', month: null });
    const label = labelOf(spec);
    setCrumbs(settings.workspace || 'Workspace', label);
    const recs = cache[spec.key];
    const queue = params.queue;

    const chipField = Object.keys(schemaOf(spec)).find((k) => typeOf(spec, k).base === 'CHOICE');
    const dateField = spec.dateField || Object.keys(schemaOf(spec)).find((k) => typeOf(spec, k).base === 'DATE');

    const newDefaults = () => Object.assign({}, queue ? { queue } : {}, st.chip && chipField ? { [chipField]: st.chip } : {});
    const head = el('div', { class: 'page-head reveal' },
      el('div', {},
        el('div', { class: 'eyebrow' }, spec.group === 'Custom' ? 'Custom table' : spec.group),
        el('h1', { class: 'page-title' }, label),
        el('p', { class: 'page-sub' }, `${recs.length} ${recs.length === 1 ? 'record' : 'records'}`)),
      el('div', { class: 'page-actions' },
        spec.view === 'calendar' && dateField ? el('div', { class: 'chips', role: 'group', 'aria-label': 'View' },
          el('button', { class: 'chip', 'aria-pressed': String(st.mode === 'calendar'), onclick: () => { st.mode = 'calendar'; render(); } }, 'Calendar'),
          el('button', { class: 'chip', 'aria-pressed': String(st.mode === 'list'), onclick: () => { st.mode = 'list'; render(); } }, 'List')) : null,
        el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`)));

    if (!recs.length) {
      return el('div', {}, head, el('div', { class: 'card reveal' },
        emptyState(spec.icon, `No ${spec.label.toLowerCase()} yet`, `Add your first ${spec.single} and it shows up here.`,
          el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`))));
    }

    if (spec.view === 'notes') return el('div', {}, head, renderNotes(spec, recs));
    if (st.mode === 'calendar' && dateField) return el('div', {}, head, renderCalendar(spec, recs, dateField, st));

    // List view
    const body = el('div', { class: 'card grid-card reveal' });
    const searchInput = el('input', { class: 'input', type: 'search', placeholder: `Search ${label.toLowerCase()}`, value: st.q, 'aria-label': 'Search' });
    const base = queue ? recs.filter((r) => r.payload.queue === queue) : recs;
    const chips = chipField ? el('div', { class: 'chips', role: 'group', 'aria-label': fieldLabel(spec, chipField) },
      el('button', { class: 'chip', 'aria-pressed': String(!st.chip), onclick: () => { st.chip = ''; draw(); syncChips(); } }, 'All', el('span', { class: 'n' }, base.length)),
      typeOf(spec, chipField).options.map((o) => {
        const n = base.filter((r) => r.payload[chipField] === o).length;
        return n || st.chip === o ? el('button', { class: 'chip', 'data-v': o, 'aria-pressed': String(st.chip === o), onclick: () => { st.chip = o; draw(); syncChips(); } }, o, el('span', { class: 'n' }, n)) : null;
      })) : null;
    function syncChips() {
      if (!chips) return;
      [...chips.children].forEach((c) => c.setAttribute('aria-pressed', String((c.dataset.v || '') === st.chip)));
    }
    const toolbar = el('div', { class: 'toolbar reveal' },
      el('div', { class: 'search' }, icon('search'), searchInput),
      queue ? el('button', { class: 'chip', 'aria-pressed': 'true', onclick: () => go('#/t/' + spec.key), title: 'Clear queue filter' }, `Queue: ${queue}  ×`) : null,
      chips);

    function draw() {
      const q = st.q.trim().toLowerCase();
      let rows = base;
      if (st.chip && chipField) rows = rows.filter((r) => r.payload[chipField] === st.chip);
      if (q) rows = rows.filter((r) => searchText(spec, r).includes(q));
      rows = sortRecords(spec, rows, st.sort);
      const onSort = (c) => { st.sort = st.sort && st.sort.field === c ? { field: c, dir: -st.sort.dir } : { field: c, dir: 1 }; draw(); };
      body.replaceChildren(
        rows.length ? gridTable(spec, rows, spec.columns, onSort, st.sort || { field: '' })
          : emptyState('search', 'No matches', 'Try a different search or clear the filters.', el('button', { class: 'btn', onclick: () => { st.q = ''; st.chip = ''; searchInput.value = ''; draw(); syncChips(); } }, 'Clear filters')),
        el('div', { class: 'grid-foot' }, el('span', {}, `Showing ${rows.length} of ${base.length}`), recs.length >= 500 ? el('span', {}, 'First 500 records loaded') : el('span', {}, '')));
    }
    searchInput.addEventListener('input', () => { st.q = searchInput.value; draw(); });
    draw();
    return el('div', {}, head, toolbar, body);
  }

  // Notepad
  function renderNotes(spec, recs) {
    const sorted = recs.slice().sort((a, b) => (b.payload.pinned ? 1 : 0) - (a.payload.pinned ? 1 : 0) || (a.date_modified < b.date_modified ? 1 : -1));
    return el('div', { class: 'notes reveal' }, sorted.map((r) => el('button', { class: 'note' + (r.payload.pinned ? ' pinned' : ''), onclick: () => openRecord(spec, r) },
      el('h4', {}, r.payload.title || 'Untitled note'),
      r.payload.body ? el('p', {}, r.payload.body) : null,
      el('footer', {}, (r.payload.pinned ? 'Pinned · ' : '') + 'Edited ' + fmtDate(r.date_modified.slice(0, 10))))));
  }

  // Calendar
  function renderCalendar(spec, recs, dateField, st) {
    const today = todayISO();
    if (!st.month) st.month = today.slice(0, 7);
    const [y, m] = st.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const byDay = {};
    recs.forEach((r) => { const d = r.payload[dateField]; if (d) (byDay[d.slice(0, 10)] = byDay[d.slice(0, 10)] || []).push(r); });
    const shift = (n) => { const d = new Date(y, m - 1 + n, 1); st.month = iso(d).slice(0, 7); render(); };
    const chipField = Object.keys(schemaOf(spec)).find((k) => typeOf(spec, k).base === 'CHOICE');

    const head = el('div', { class: 'toolbar reveal' }, el('div', { class: 'cal-head' },
      el('button', { class: 'icon-btn', onclick: () => shift(-1), 'aria-label': 'Previous month' }, icon('chevL')),
      el('div', { class: 'cal-month', 'aria-live': 'polite' }, first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
      el('button', { class: 'icon-btn', onclick: () => shift(1), 'aria-label': 'Next month' }, icon('chevR')),
      el('button', { class: 'btn sm ghost', onclick: () => { st.month = today.slice(0, 7); render(); } }, 'Today')));

    const dows = [...Array(7)].map((_, i) => el('div', { class: 'cal-dow' }, new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'short' })));
    const cells = [...Array(42)].map((_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = iso(d);
      const evs = byDay[key] || [];
      const cell = el('div', { class: 'cal-day' + (d.getMonth() !== m - 1 ? ' other' : '') + (key === today ? ' today' : ''), role: 'button', tabIndex: 0,
        'aria-label': `${d.toDateString()}, ${evs.length} events. Add event`,
        onclick: () => openRecord(spec, null, { [dateField]: key }),
        onkeydown: (e) => { if (e.key === 'Enter' && e.target === cell) openRecord(spec, null, { [dateField]: key }); } },
        el('span', { class: 'd' }, d.getDate()),
        evs.slice(0, 3).map((r) => el('button', { class: 'cal-ev', style: `--h:${chipField && r.payload[chipField] ? hue(r.payload[chipField]) : 36}`,
          onclick: (e) => { e.stopPropagation(); openRecord(spec, r); } }, titleOf(spec, r))),
        evs.length > 3 ? el('span', { class: 'cal-more' }, `+${evs.length - 3} more`) : null);
      return cell;
    });

    // Mobile agenda: this month, upcoming first
    const monthEvents = recs.filter((r) => (r.payload[dateField] || '').slice(0, 7) === st.month)
      .sort((a, b) => (a.payload[dateField] < b.payload[dateField] ? -1 : 1));
    const agenda = el('div', { class: 'agenda' }, monthEvents.length ? monthEvents.map((r) => el('button', { class: 'result', onclick: () => openRecord(spec, r) },
      el('span', { class: 'cell-mono', style: 'min-width:56px' }, fmtDate(r.payload[dateField])), titleOf(spec, r),
      chipField && r.payload[chipField] ? pill(r.payload[chipField]) : null)) : el('p', { class: 'hint' }, 'Nothing scheduled this month.'));

    return el('div', {}, head, el('div', { class: 'cal reveal' }, dows, cells), agenda);
  }

  // ---------------------------------------------------------------------
  // Record drawer
  // ---------------------------------------------------------------------
  let lastFocus = null;
  function closeDrawer() {
    $('#drawerWrap').hidden = true;
    $('#drawer').replaceChildren();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function showDrawer(...content) {
    lastFocus = document.activeElement;
    $('#drawer').replaceChildren(...content);
    $('#drawerWrap').hidden = false;
    const first = $('#drawer input, #drawer select, #drawer textarea');
    (first || $('#drawer')).focus({ preventScroll: true });
  }

  function inputFor(spec, field, value) {
    const t = typeOf(spec, field);
    const h = hintOf(spec, field);
    const id = 'f_' + field;
    if (h.ui === 'queue') {
      const opts = settings.queues.includes(value) || !value ? settings.queues : [...settings.queues, value];
      return el('select', { class: 'select', id, name: field }, el('option', { value: '' }, 'No queue'), opts.map((o) => el('option', { value: o, selected: o === value }, o)));
    }
    switch (t.base) {
      case 'LONGTEXT': return el('textarea', { class: 'textarea', id, name: field, value: value || '', rows: 5 });
      case 'NUMBER': return el('input', { class: 'input', id, name: field, type: 'number', step: 'any', value: value ?? '' });
      case 'DATE': return el('input', { class: 'input', id, name: field, type: 'date', value: value ? String(value).slice(0, 10) : '' });
      case 'URL': return el('input', { class: 'input', id, name: field, type: 'url', placeholder: 'https://', value: value || '' });
      case 'EMAIL': return el('input', { class: 'input', id, name: field, type: 'email', value: value || '' });
      case 'PHONE': return el('input', { class: 'input', id, name: field, type: 'tel', value: value || '' });
      case 'BOOLEAN': return el('label', { class: 'toggle' }, el('input', { type: 'checkbox', id, name: field, checked: !!value }), el('i'));
      case 'CHOICE': return el('select', { class: 'select', id, name: field }, el('option', { value: '' }, '—'), t.options.map((o) => el('option', { value: o, selected: o === value }, o)));
      case 'REF': {
        const target = byRegId[t.target];
        const list = target ? (cache[target.key] || []).map((r) => [r.id, titleOf(target, r)]).sort((a, b) => a[1].localeCompare(b[1])) : [];
        return el('select', { class: 'select', id, name: field }, el('option', { value: '' }, list.length ? 'None' : `No ${target ? target.label.toLowerCase() : 'records'} yet`),
          list.map(([rid, lab]) => el('option', { value: rid, selected: rid === value }, lab)));
      }
      default: return el('input', { class: 'input', id, name: field, type: 'text', value: value || '' });
    }
  }

  async function openRecord(spec, rec, defaults) {
    await loadWithRefs(spec);
    const isNew = !rec;
    const values = Object.assign({}, rec ? rec.payload : {}, isNew ? defaults || {} : {});
    const fields = Object.keys(schemaOf(spec));
    const titleField = fields.find((c) => spec.title && spec.title({ [c]: 'x' }) === 'x') || fields[0];

    const errorBox = el('div', { class: 'form-error', role: 'alert', hidden: true });
    const form = el('form', { class: 'drawer-body', novalidate: true, onsubmit: (e) => { e.preventDefault(); save(); } },
      errorBox,
      fields.map((k) => {
        const t = typeOf(spec, k);
        const wide = k === titleField || t.base === 'LONGTEXT';
        if (t.base === 'BOOLEAN') {
          return el('div', { class: 'field set-row' + (wide ? ' wide' : '') }, el('label', { for: 'f_' + k, style: 'font-weight:500;font-size:14px' }, fieldLabel(spec, k)), inputFor(spec, k, values[k]));
        }
        return el('label', { class: 'field' + (wide ? ' wide' : ''), for: 'f_' + k },
          el('span', {}, fieldLabel(spec, k), t.base === 'REF' || t.base === 'CHOICE' || t.base === 'TEXT' || t.base === 'LONGTEXT' ? null : el('em', {}, t.base.toLowerCase())),
          inputFor(spec, k, values[k]));
      }),
      rec ? el('div', { class: 'meta-line' }, `Created ${new Date(rec.date_created).toLocaleString()} · Updated ${new Date(rec.date_modified).toLocaleString()}`) : null,
      rec ? await relatedSection(spec, rec) : null,
      el('button', { type: 'submit', hidden: true }));

    const saveBtn = el('button', { class: 'btn primary', onclick: save }, isNew ? `Create ${spec.single}` : 'Save changes');
    const foot = el('div', { class: 'drawer-foot' },
      rec ? el('button', { class: 'btn danger', onclick: remove, 'aria-label': `Delete ${spec.single}` }, icon('trash'), 'Delete') : null,
      el('span', { class: 'spacer' }),
      el('button', { class: 'btn ghost', onclick: closeDrawer }, 'Cancel'),
      saveBtn);

    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, isNew ? `New ${spec.single}` : labelOf(spec)),
          el('h2', { id: 'drawerTitle' }, isNew ? `New ${spec.single}` : titleOf(spec, rec))),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      form, foot);

    function collect() {
      const payload = {};
      for (const k of fields) {
        const inp = form.elements[k];
        const t = typeOf(spec, k);
        if (t.base === 'BOOLEAN') payload[k] = inp.checked;
        else payload[k] = inp.value.trim() === '' ? null : inp.value.trim();
      }
      if (isNew) Object.keys(payload).forEach((k) => { if (payload[k] === null) delete payload[k]; });
      return payload;
    }
    async function save() {
      saveBtn.disabled = true;
      errorBox.hidden = true;
      try {
        if (isNew) await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload: collect() });
        else await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: collect() });
        delete cache[spec.key];
        closeDrawer();
        toast(isNew ? `${humanize(spec.single)} created` : 'Changes saved');
        await render();
        refreshCounts();
      } catch (e) {
        errorBox.hidden = false;
        errorBox.replaceChildren(el('strong', {}, e.message), e.details ? el('div', {}, [].concat(e.details).map((d) => humanizeError(spec, d)).join(' · ')) : null);
        saveBtn.disabled = false;
      }
    }
    async function remove() {
      if (!confirm(`Delete this ${spec.single}? This can’t be undone.`)) return;
      try {
        await api('DELETE', `/api/vault/record/${spec.reg.id}/${rec.id}`);
        delete cache[spec.key];
        closeDrawer();
        toast(`${humanize(spec.single)} deleted`);
        await render();
        refreshCounts();
      } catch (e) { toast(e.message, true); }
    }
  }
  function humanizeError(spec, d) {
    const m = String(d).match(/^([a-zA-Z0-9_]+): (.*)$/);
    return m ? `${fieldLabel(spec, m[1])}: ${m[2]}` : d;
  }

  // Linked records: every table with a link field pointing at this table
  async function relatedSection(spec, rec) {
    const groups = [];
    for (const s of specs) {
      for (const k of Object.keys(schemaOf(s))) {
        const t = typeOf(s, k);
        if (t.base !== 'REF' || t.target !== spec.reg.id) continue;
        await load(s);
        const hits = cache[s.key].filter((r) => r.payload[k] === rec.id);
        groups.push(el('div', {},
          el('h3', {}, `${labelOf(s)}${Object.keys(schemaOf(s)).filter((x) => typeOf(s, x).target === spec.reg.id).length > 1 ? ` · ${fieldLabel(s, k)}` : ''}`, el('span', {}, hits.length)),
          hits.slice(0, 8).map((r) => el('button', { class: 'result', type: 'button', onclick: () => openRecord(s, r) }, icon(s.icon), titleOf(s, r),
            s.reg.fields_schema.status && r.payload.status ? pill(r.payload.status) : null)),
          el('button', { class: 'btn ghost sm', type: 'button', onclick: () => openRecord(s, null, { [k]: rec.id }) }, icon('plus'), `Add ${s.single}`)));
      }
    }
    return groups.length ? el('div', { class: 'related' }, groups) : null;
  }

  // ---------------------------------------------------------------------
  // Sample data (fictional placeholders for testing the interface)
  // Every inserted id is remembered so "Remove sample data" deletes only these.
  // ---------------------------------------------------------------------
  function sampleSet() {
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const q = settings.queues;
    const Q = (i) => q[i % q.length];
    return [
      ['users', 'u1', { name: 'Avery Cole', role: 'Production', email: 'avery@example.com', phone: '916-555-0101', active: true }],
      ['users', 'u2', { name: 'Morgan Reyes', role: 'Sales', email: 'morgan@example.com', phone: '916-555-0102', active: true }],
      ['users', 'u3', { name: 'Sam Patel', role: 'Support', email: 'sam@example.com', phone: '916-555-0103', active: true }],

      ['companies', 'c1', { company_name: 'Blue Harbor Dental', status: 'Active', phone: '916-555-0140', website: 'https://example.com/blue-harbor', industry: 'Dental', notes: 'Sample customer. Two offices, wants seasonal greetings rotated quarterly.' }],
      ['companies', 'c2', { company_name: 'Summit Ridge Auto Care', status: 'Active', phone: '916-555-0150', website: 'https://example.com/summit-ridge', industry: 'Auto repair', notes: 'Sample customer. Promotes tire specials and service reminders on hold.' }],
      ['companies', 'c3', { company_name: 'Oakline Pizza Co.', status: 'Lead', phone: '916-555-0160', website: 'https://example.com/oakline', industry: 'Restaurant', notes: 'Sample lead. Interested in a holiday ordering message.' }],

      ['locations', 'l1', { location_name: 'Blue Harbor — Midtown', company: '@c1', address: '100 Sample St', city: 'Sacramento', state: 'CA', zip: '95811', phone: '916-555-0141' }],
      ['locations', 'l2', { location_name: 'Blue Harbor — Folsom', company: '@c1', address: '200 Example Ave', city: 'Folsom', state: 'CA', zip: '95630', phone: '916-555-0142' }],
      ['locations', 'l3', { location_name: 'Summit Ridge — Roseville', company: '@c2', address: '300 Placeholder Blvd', city: 'Roseville', state: 'CA', zip: '95661', phone: '916-555-0151' }],
      ['locations', 'l4', { location_name: 'Oakline — Rocklin', company: '@c3', address: '400 Demo Way', city: 'Rocklin', state: 'CA', zip: '95677', phone: '916-555-0161' }],

      ['contacts', 'p1', { first_name: 'Dana', last_name: 'Brooks', company: '@c1', location: '@l1', job_title: 'Office manager', email: 'dana@example.com', phone: '916-555-0143' }],
      ['contacts', 'p2', { first_name: 'Chris', last_name: 'Nguyen', company: '@c2', location: '@l3', job_title: 'Owner', email: 'chris@example.com', phone: '916-555-0152' }],
      ['contacts', 'p3', { first_name: 'Riley', last_name: 'Shaw', company: '@c3', location: '@l4', job_title: 'General manager', email: 'riley@example.com', phone: '916-555-0162' }],

      ['vendors', 'v1', { vendor_name: 'Sample Voice Talent Co.', service: 'Voice talent', contact_name: 'Jordan Lee', email: 'voices@example.com', phone: '916-555-0170', website: 'https://example.com/voices' }],
      ['vendors', 'v2', { vendor_name: 'Placeholder Music Library', service: 'Licensed music beds', contact_name: 'Taylor Kim', email: 'music@example.com', website: 'https://example.com/music' }],

      ['projects', 'j1', { project_title: 'Winter greeting refresh', status: 'Production', queue: Q(2), assigned_to: '@u1', company: '@c1', project_type: 'Production only', date_due: day(-2), url: 'https://example.com/scripts/winter', url_details: 'Approved script', project_attachment: 'https://example.com/audio/blue-harbor-winter-v2.wav' }],
      ['projects', 'j2', { project_title: 'New hold loop — 2 locations', status: 'Scripting', queue: Q(0), assigned_to: '@u1', company: '@c1', project_type: 'Implementation', date_due: day(5) }],
      ['projects', 'j3', { project_title: 'Tire special promo', status: 'Review', queue: Q(4), assigned_to: '@u2', company: '@c2', project_type: 'Script update', date_due: day(3), url: 'https://example.com/scripts/tires' }],
      ['projects', 'j4', { project_title: 'Service reminder spots', status: 'Intake', queue: Q(1), assigned_to: '@u3', company: '@c2', project_type: 'Production only', date_due: day(10) }],
      ['projects', 'j5', { project_title: 'Holiday ordering message', status: 'Intake', queue: Q(4), assigned_to: '@u2', company: '@c3', project_type: 'Any', date_due: day(14) }],
      ['projects', 'j6', { project_title: 'Billing setup for new account', status: 'On hold', queue: Q(3), assigned_to: '@u3', company: '@c3', project_type: 'Implementation', date_due: day(7) }],
      ['projects', 'j7', { project_title: 'Fall promo audio', status: 'Delivered', queue: Q(2), assigned_to: '@u1', company: '@c2', project_type: 'Production only', date_due: day(-12), project_attachment: 'https://example.com/audio/summit-fall.wav' }],

      ['indi_projects', 'i1', { project_title: 'Rebuild music bed library index', status: 'Production', assigned_to: '@u1', date_due: day(6) }],
      ['indi_projects', 'i2', { project_title: 'Voice talent sample reel', status: 'Scripting', assigned_to: '@u2', company: '@c1', date_due: day(9) }],

      ['scripts_mail', 'm1', { subject: 'Winter script edits', status: 'In progress', company: '@c1', contact: '@p1', received: day(-3), script: 'Thank you for calling Blue Harbor Dental. Your smile is our priority — please stay on the line and the next available team member will be with you shortly.' }],
      ['scripts_mail', 'm2', { subject: 'Holiday hours copy', status: 'New', company: '@c3', contact: '@p3', received: day(-1), script: 'Thanks for calling Oakline Pizza Co. Ask about our holiday family meal deals.' }],

      ['scripts_sent', 's1', { subject: 'Tire promo script — draft 2', company: '@c2', sent_to: 'chris@example.com', date_sent: day(-2), script: 'Thanks for holding with Summit Ridge Auto Care. Ask your service advisor about this month’s tire special.' }],
      ['scripts_sent', 's2', { subject: 'Winter greeting — final', company: '@c1', sent_to: 'dana@example.com', date_sent: day(-5) }],

      ['scriptbuilders', 'b1', { title: 'Dental scriptbuilder', kind: 'Scriptbuilder', pdf_link: 'https://example.com/pdfs/dental-scriptbuilder.pdf', date: day(-20) }],
      ['scriptbuilders', 'b2', { title: 'Holiday promo blast', kind: 'Blast', pdf_link: 'https://example.com/pdfs/holiday-blast.pdf', date: day(-4) }],

      ['calendar', 'e1', { title: 'Studio session — Blue Harbor', date: day(1), time: '10:00 AM', assigned_to: '@u1', company: '@c1' }],
      ['calendar', 'e2', { title: 'Script review call', date: day(3), time: '2:30 PM', assigned_to: '@u2', company: '@c2' }],
      ['calendar', 'e3', { title: 'Install check-in', date: day(8), time: '9:00 AM', assigned_to: '@u3', company: '@c1' }],
      ['calendar', 'e4', { title: 'Team production meeting', date: day(0), time: '4:00 PM' }],

      ['sales_events', 'x1', { event: 'Oakline demo + proposal', date: day(4), status: 'Planned', company: '@c3', value: 1200 }],
      ['sales_events', 'x2', { event: 'Summit Ridge renewal', date: day(-6), status: 'Done', company: '@c2', value: 2400 }],

      ['notepad', 'n1', { title: 'Sample data', body: 'Everything you see right now is fictional placeholder data. Remove it in Settings → Sample data before importing real records.', pinned: true }],
      ['notepad', 'n2', { title: 'Hold message checklist', body: 'Confirm hours\nConfirm promo end date\nPick voice + music bed\nSend script for approval' }],
      ['notepad', 'n3', { title: 'Ideas', body: 'Seasonal greeting rotation offer for multi-location accounts.' }]
    ];
  }

  async function loadSampleData() {
    const ids = {};       // placeholder -> real record id
    const made = {};      // spec key -> [ids]
    for (const [key, ref, payload] of sampleSet()) {
      const spec = byKey[key];
      if (!spec) continue;
      const body = {};
      for (const [k, v] of Object.entries(payload)) {
        if (!(k in schemaOf(spec))) continue;
        body[k] = typeof v === 'string' && v.startsWith('@') ? ids[v.slice(1)] : v;
      }
      const r = await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload: body });
      ids[ref] = r.record.id;
      (made[key] = made[key] || []).push(r.record.id);
    }
    const prev = settings.sampleIds || {};
    for (const [k, v] of Object.entries(made)) prev[k] = (prev[k] || []).concat(v);
    settings.sampleIds = prev;
    saveSettings();
    Object.keys(cache).forEach((k) => delete cache[k]);
  }

  async function removeSampleData() {
    const all = settings.sampleIds || {};
    // Delete records that point at others first (reverse of creation order)
    const order = SPEC.map((s) => s.key).reverse();
    for (const key of order) {
      const spec = byKey[key];
      for (const id of all[key] || []) {
        try { await api('DELETE', `/api/vault/record/${spec.reg.id}/${id}`); } catch (_) { /* already gone */ }
      }
    }
    delete settings.sampleIds;
    saveSettings();
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
  const hasSample = () => Object.values(settings.sampleIds || {}).some((a) => a.length);

  // ---------------------------------------------------------------------
  // New table builder
  // ---------------------------------------------------------------------
  const TYPE_OPTIONS = [
    ['TEXT', 'Text'], ['LONGTEXT', 'Long text'], ['NUMBER', 'Number'], ['DATE', 'Date'], ['BOOLEAN', 'Yes / No'],
    ['CHOICE', 'Pick list'], ['URL', 'Web link'], ['EMAIL', 'Email'], ['PHONE', 'Phone'], ['REF', 'Link to table']
  ];
  function renderBuilder() {
    setCrumbs(settings.workspace || 'Workspace', 'New table');
    const rows = el('div');
    const err = el('div', { class: 'form-error', role: 'alert', hidden: true });
    const nameInput = el('input', { class: 'input', placeholder: 'e.g. Voice talent', 'aria-label': 'Table name' });

    function addRow(name = '', type = 'TEXT') {
      const extra = el('div', { class: 'extra' });
      const typeSel = el('select', { class: 'select', 'aria-label': 'Field type' }, TYPE_OPTIONS.map(([v, l]) => el('option', { value: v, selected: v === type }, l)));
      const nameIn = el('input', { class: 'input', value: name, placeholder: 'Field name', 'aria-label': 'Field name' });
      const syncExtra = () => {
        if (typeSel.value === 'CHOICE') extra.replaceChildren(el('input', { class: 'input', placeholder: 'Options, separated by commas', 'aria-label': 'Pick list options' }));
        else if (typeSel.value === 'REF') extra.replaceChildren(el('select', { class: 'select', 'aria-label': 'Linked table' }, specs.map((s) => el('option', { value: s.reg.id }, labelOf(s)))));
        else extra.replaceChildren();
      };
      typeSel.addEventListener('change', syncExtra);
      syncExtra();
      const row = el('div', { class: 'builder-row' }, nameIn, typeSel, extra,
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove field', onclick: () => row.remove() }, icon('x')));
      rows.append(row);
    }
    addRow('name', 'TEXT');
    addRow('', 'TEXT');

    async function create() {
      err.hidden = true;
      const fields_schema = {};
      for (const row of rows.children) {
        const [nameIn, typeSel, extra] = row.children;
        const key = slug(nameIn.value);
        if (!key) continue;
        let type = typeSel.value;
        if (type === 'CHOICE') {
          const opts = (extra.querySelector('input').value || '').split(',').map((s) => s.trim()).filter(Boolean);
          if (!opts.length) { err.hidden = false; err.textContent = `Add pick list options for “${nameIn.value}”.`; return; }
          type = 'CHOICE:' + opts.join('|');
        }
        if (type === 'REF') type = 'REF:' + extra.querySelector('select').value;
        fields_schema[key] = type;
      }
      try {
        const r = await api('POST', '/api/registry/create-table', { app_name: 'Custom', table_name: nameInput.value.trim(), fields_schema });
        await bootstrap();
        toast('Table created');
        go('#/t/' + byRegId[r.registry_id].key);
      } catch (e) {
        err.hidden = false;
        err.replaceChildren(el('strong', {}, e.message), e.details ? el('div', {}, [].concat(e.details).join(' · ')) : null);
      }
    }

    return el('div', { style: 'max-width:900px' },
      el('div', { class: 'page-head reveal' }, el('div', {}, el('div', { class: 'eyebrow' }, 'Build'), el('h1', { class: 'page-title' }, 'New table'),
        el('p', { class: 'page-sub' }, 'Name it, add fields, and it becomes its own tab.'))),
      el('section', { class: 'card reveal', style: 'display:grid;gap:16px' },
        el('label', { class: 'field' }, el('span', {}, 'Table name'), nameInput),
        el('div', {}, el('div', { class: 'eyebrow', style: 'margin-bottom:8px' }, 'Fields'), rows,
          el('button', { class: 'btn ghost sm', type: 'button', onclick: () => addRow() }, icon('plus'), 'Add field')),
        err,
        el('div', {}, el('button', { class: 'btn primary', onclick: create }, 'Create table'))),
      el('section', { class: 'card reveal', style: 'margin-top:18px' },
        el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Field types')),
        el('div', { class: 'type-legend' },
          el('div', {}, el('b', {}, 'Pick list'), ' — one option from a fixed list, shown as a colored tag'),
          el('div', {}, el('b', {}, 'Link to table'), ' — connects records, like a contact to its company'),
          el('div', {}, el('b', {}, 'Web link'), ' — must start with http:// or https://'),
          el('div', {}, el('b', {}, 'Date'), ' — adds a calendar-friendly date picker'),
          el('div', {}, el('b', {}, 'Yes / No'), ' — a switch'),
          el('div', {}, el('b', {}, 'Long text'), ' — notes, scripts, anything multi-line'))));
  }

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------
  async function openSettings(welcome) {
    await load(byKey.users);
    const users = cache.users.map((r) => [r.id, titleOf(byKey.users, r)]);
    const name = el('input', { class: 'input', id: 's_name', value: settings.name, placeholder: 'e.g. Jameson' });
    const me = el('select', { class: 'select', id: 's_me' }, el('option', { value: '' }, users.length ? 'Not set' : 'Add yourself in Users first'),
      users.map(([id, l]) => el('option', { value: id, selected: id === settings.meId }, l)));
    const ws = el('input', { class: 'input', id: 's_ws', value: settings.workspace });
    const queues = el('textarea', { class: 'textarea', id: 's_q', rows: 6, value: settings.queues.join('\n') });
    const theme = el('select', { class: 'select', id: 's_theme' },
      [['', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => el('option', { value: v, selected: v === (settings.theme || '') }, l)));
    const key = LOCAL ? null : el('input', { class: 'input', id: 's_key', type: 'password', value: settings.apiKey, autocomplete: 'off' });

    const backup = LOCAL ? el('div', { class: 'wide field' }, el('span', {}, 'Backup'),
      el('p', { class: 'hint', style: 'margin:0' }, 'Browser mode keeps data on this device only. Export a backup regularly and import it to move your data to another device.'),
      el('div', { class: 'actions-row' },
        el('button', { class: 'btn', type: 'button', onclick: exportBackup }, icon('download'), 'Export backup'),
        el('label', { class: 'btn', style: 'cursor:pointer' }, icon('upload'), 'Import backup',
          el('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importBackup })))) : null;

    const saveBtn = el('button', { class: 'btn primary', onclick: () => {
      settings.name = name.value.trim();
      settings.meId = me.value;
      settings.workspace = ws.value.trim() || 'Workspace';
      const q = queues.value.split('\n').map((s) => s.trim()).filter(Boolean);
      settings.queues = q.length ? q.slice(0, 24) : DEFAULT_QUEUES.slice();
      settings.theme = theme.value;
      if (key) settings.apiKey = key.value;
      settings.welcomed = true;
      saveSettings();
      applyTheme();
      closeDrawer();
      toast('Settings saved');
      render();
    } }, 'Save settings');

    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, welcome ? 'Welcome' : 'Settings'), el('h2', { id: 'drawerTitle' }, welcome ? 'Make it yours' : 'Settings')),
        el('button', { class: 'icon-btn', onclick: () => { settings.welcomed = true; saveSettings(); closeDrawer(); }, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' },
        el('label', { class: 'field', for: 's_name' }, el('span', {}, 'Your name'), name),
        el('label', { class: 'field', for: 's_me' }, el('span', {}, 'You are'), me),
        el('label', { class: 'field', for: 's_ws' }, el('span', {}, 'Workspace name'), ws),
        el('label', { class: 'field', for: 's_theme' }, el('span', {}, 'Theme'), theme),
        el('label', { class: 'field wide', for: 's_q' }, el('span', {}, 'Queues', el('em', {}, 'one per line')), queues),
        key ? el('label', { class: 'field wide', for: 's_key' }, el('span', {}, 'Server API key'), key) : null,
        el('div', { class: 'wide field' }, el('span', {}, 'Sample data'),
          el('p', { class: 'hint', style: 'margin:0' }, hasSample()
            ? 'Fictional placeholder records are loaded. Remove them before importing real data. Records you added yourself stay.'
            : 'Fill every tab with 3 fictional customers and their projects, contacts, events and notes to try things out.'),
          el('div', { class: 'actions-row' }, hasSample()
            ? el('button', { class: 'btn danger', type: 'button', onclick: (e) => runSample(e.currentTarget, false) }, icon('trash'), 'Remove sample data')
            : el('button', { class: 'btn', type: 'button', onclick: (e) => runSample(e.currentTarget, true) }, icon('plus'), 'Load sample data'))),
        backup),
      el('div', { class: 'drawer-foot' }, el('span', { class: 'spacer' }), el('button', { class: 'btn ghost', onclick: closeDrawer }, 'Cancel'), saveBtn));
  }
  async function runSample(btn, add) {
    if (!add && !confirm('Remove all sample records? Records you added yourself stay.')) return;
    btn.disabled = true;
    btn.lastChild.textContent = add ? 'Loading…' : 'Removing…';
    try {
      if (add) await loadSampleData(); else await removeSampleData();
      closeDrawer();
      toast(add ? 'Sample data loaded' : 'Sample data removed');
      if (add) { settings.welcomed = true; saveSettings(); }
      await render();
      refreshCounts();
    } catch (e) { toast(e.message, true); btn.disabled = false; }
  }
  async function exportBackup() {
    const blob = new Blob([await VaultLocal.exportData()], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `vaultcrm-backup-${todayISO()}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup exported');
  }
  async function importBackup(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('Importing replaces all data in this browser with the backup. Continue?')) return;
    try {
      const r = await VaultLocal.importData(await file.text());
      Object.keys(cache).forEach((k) => delete cache[k]);
      await bootstrap();
      closeDrawer();
      toast(`Imported ${r.records} records`);
      render();
    } catch (err) { toast('Import failed: ' + err.message, true); }
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  function wireChrome() {
    $('#menuBtn').append(icon('menu'));
    $('#railClose').append(icon('x'));
    $('#settingsBtn').append(icon('sliders'));
    $('#menuBtn').addEventListener('click', openRail);
    $('#railClose').addEventListener('click', closeRail);
    $('#scrim').addEventListener('click', closeRail);
    $('#settingsBtn').addEventListener('click', () => openSettings(false));
    $('#themeBtn').addEventListener('click', () => { settings.theme = isDark() ? 'light' : 'dark'; saveSettings(); applyTheme(); });
    $('#drawerWrap').addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeDrawer(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (!$('#drawerWrap').hidden) closeDrawer(); else closeRail(); }
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    window.addEventListener('hashchange', () => { closeRail(); render(); $('#view').focus({ preventScroll: true }); window.scrollTo(0, 0); });
  }

  async function boot() {
    wireChrome();
    applyTheme();
    const pill = $('#modePill');
    try {
      await api('GET', '/api/health');
      pill.textContent = LOCAL ? 'Browser mode' : 'Live';
      pill.className = 'mode-pill on';
      pill.title = LOCAL ? 'Data is saved in this browser on this device' : 'Connected to the server';
      await bootstrap();
      await render();
      if (!settings.welcomed) openSettings(true);
    } catch (e) {
      pill.textContent = 'Offline';
      pill.className = 'mode-pill off';
      $('#view').replaceChildren(emptyState('x', 'Can’t reach the database', e.status === 401 ? 'The server needs an API key. Add it in Settings.' : e.message,
        el('button', { class: 'btn', onclick: () => location.reload() }, 'Try again')));
      if (e.status === 401) openSettingsMinimal();
    }
  }
  function openSettingsMinimal() {
    const key = el('input', { class: 'input', id: 's_key', type: 'password', value: settings.apiKey, autocomplete: 'off' });
    showDrawer(
      el('div', { class: 'drawer-head' }, el('div', {}, el('div', { class: 'eyebrow' }, 'Server'), el('h2', { id: 'drawerTitle' }, 'Enter API key')),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' }, el('label', { class: 'field wide', for: 's_key' }, el('span', {}, 'API key'), key)),
      el('div', { class: 'drawer-foot' }, el('span', { class: 'spacer' }),
        el('button', { class: 'btn primary', onclick: () => { settings.apiKey = key.value; saveSettings(); location.reload(); } }, 'Connect')));
  }

  boot();
})();
