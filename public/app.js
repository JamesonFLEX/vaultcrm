/* =====================================================================
   VaultCRM :: Residential solar sales workspace
   Home (quick access + customer journey), Sales pipeline, Activities,
   Homeowners, Properties, Contacts, Installs (site survey → PTO), Calendar,
   Canvass events, Partners, Notepad, custom tables. Works in browser mode
   (GitHub Pages) and server mode (Express + Postgres) through the same API.
   ===================================================================== */
(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    arrowR: 'M5 12h14M13 6l6 6-6 6',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 12h.01',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    board: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    userPlus: 'M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6',
    door: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01M9 7h6',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0'
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
  const OLD_QUEUES = ['Downloads/Callbacks', 'DL/CB Manager', 'Tech Support', 'Billing', 'Sales'];
  const DEFAULT_QUEUES = ['Site survey', 'Design & permits', 'Install crew', 'Utility & PTO', 'Customer care'];
  const settings = Object.assign(
    { name: '', meId: '', workspace: 'Workspace', theme: '', apiKey: '', queues: DEFAULT_QUEUES, welcomed: false },
    (() => { try { return JSON.parse(localStorage.getItem('vault_settings') || '{}'); } catch (_) { return {}; } })()
  );
  if (!Array.isArray(settings.queues) || !settings.queues.length || settings.queues.join('|') === OLD_QUEUES.join('|')) settings.queues = DEFAULT_QUEUES.slice();
  function saveSettings() {
    try { localStorage.setItem('vault_settings', JSON.stringify(settings)); } catch (_) {}
  }
  function applyTheme() {
    if (settings.theme) document.documentElement.dataset.theme = settings.theme;
    else delete document.documentElement.dataset.theme;
    const dark = isDark();
    $('#themeBtn').replaceChildren(icon(dark ? 'sun' : 'moon'));
    $('#themeBtn').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#030916' : '#E3E9F2');
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
  const STATUS = 'CHOICE:Site survey|Design|Permit|Install|Inspection|PTO|Paused';
  const STAGE_LIST = ['New lead', 'Follow-up', 'Appointment set', 'Proposal sent', 'Sold', 'Lost'];
  const INSTALL_STEPS = ['Site survey', 'Design', 'Permit', 'Install', 'Inspection', 'PTO'];
  const STAGES = 'CHOICE:' + STAGE_LIST.join('|');
  const OUTCOMES = ['No answer', 'Left voicemail', 'Not home', 'Callback set', 'Appointment set', 'Proposal sent', 'Sold', 'Not interested'];
  const ACT_TYPES = ['Door knock', 'Call', 'Text', 'Email', 'Appointment', 'Follow-up visit'];
  const f = (n, t, extra) => Object.assign({ n, t }, extra);
  const full = (...parts) => parts.filter(Boolean).join(' ').trim();

  // Order here = creation order (link targets come first).
  const SPEC = [
    { key: 'users', table: 'Users', label: 'Team', single: 'team member', icon: 'users', group: 'Directory',
      fields: [f('name', 'TEXT'), f('role', 'CHOICE:Admin|Setter|Closer|Install coordinator|Support'), f('email', 'EMAIL'), f('phone', 'PHONE'), f('active', 'BOOLEAN')],
      title: (p) => p.name, columns: ['name', 'role', 'email', 'phone', 'active'] },
    { key: 'companies', table: 'Companies', label: 'Homeowners', single: 'homeowner', icon: 'home', group: 'Directory',
      fields: [f('company_name', 'TEXT', { label: 'Household' }), f('status', 'CHOICE:Lead|Customer|Past customer|Not a fit'), f('phone', 'PHONE'),
        f('utility', 'CHOICE:PG&E|SMUD|Roseville Electric|Other'), f('avg_monthly_bill', 'NUMBER', { label: 'Avg monthly bill ($)' }),
        f('roof_type', 'CHOICE:Composition shingle|Tile|Metal|Flat|Other'), f('roof_age', 'NUMBER', { label: 'Roof age (years)' }),
        f('shade', 'CHOICE:None|Some|Heavy'), f('hoa', 'BOOLEAN', { label: 'HOA' }), f('website', 'URL'), f('industry', 'TEXT'), f('notes', 'LONGTEXT')],
      hide: ['website', 'industry'],
      title: (p) => p.company_name, columns: ['company_name', 'status', 'utility', 'avg_monthly_bill', 'phone'] },
    { key: 'locations', table: 'Locations', label: 'Properties', single: 'property', icon: 'pin', group: 'Directory',
      fields: [f('location_name', 'TEXT', { label: 'Property' }), f('company', 'REF:@companies', { label: 'Homeowner' }), f('address', 'TEXT'), f('city', 'TEXT'), f('state', 'TEXT'), f('zip', 'TEXT'), f('phone', 'PHONE')],
      title: (p) => p.location_name, columns: ['location_name', 'company', 'address', 'city', 'zip'] },
    { key: 'contacts', table: 'Contacts', label: 'Contacts', single: 'contact', icon: 'contact', group: 'Directory',
      fields: [f('first_name', 'TEXT'), f('last_name', 'TEXT'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('location', 'REF:@locations', { label: 'Property' }),
        f('job_title', 'TEXT', { label: 'Role' }), f('decision_maker', 'BOOLEAN', { label: 'Decision-maker' }), f('email', 'EMAIL'), f('phone', 'PHONE')],
      title: (p) => full(p.first_name, p.last_name), columns: ['first_name', 'last_name', 'company', 'job_title', 'phone', 'email'] },
    { key: 'vendors', table: 'Vendors', label: 'Partners', single: 'partner', icon: 'truck', group: 'Directory',
      fields: [f('vendor_name', 'TEXT', { label: 'Partner' }), f('service', 'TEXT'), f('contact_name', 'TEXT'), f('email', 'EMAIL'), f('phone', 'PHONE'), f('website', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.vendor_name, columns: ['vendor_name', 'service', 'contact_name', 'email', 'phone'] },
    { key: 'deals', table: 'Deals', label: 'Sales pipeline', single: 'deal', icon: 'target', group: 'Sales', view: 'board', boardField: 'stage',
      card: { due: 'follow_up', dueWord: 'Follow up', owner: 'owner', sub: 'company', note: 'next_step', value: 'value' },
      fields: [f('deal_name', 'TEXT'), f('stage', STAGES), f('value', 'NUMBER', { label: 'Contract value ($)' }), f('system_size_kw', 'NUMBER', { label: 'System size (kW)' }),
        f('financing', 'CHOICE:PPA|Lease|Loan|Cash'), f('battery', 'BOOLEAN', { label: 'Battery' }),
        f('company', 'REF:@companies', { label: 'Homeowner' }), f('contact', 'REF:@contacts'),
        f('owner', 'REF:@users', { label: 'Rep' }), f('source', 'CHOICE:Door knock|Cold call|Referral|Website|Event|Flyer|Existing customer|Other'),
        f('follow_up', 'DATE'), f('next_step', 'TEXT'), f('close_date', 'DATE'), f('notes', 'LONGTEXT')],
      title: (p) => p.deal_name, columns: ['deal_name', 'stage', 'system_size_kw', 'financing', 'company', 'owner', 'follow_up', 'next_step'], sort: { field: 'follow_up', dir: 1 } },
    { key: 'activities', table: 'Activities', label: 'Activities', single: 'activity', icon: 'phone', group: 'Sales',
      fields: [f('subject', 'TEXT'), f('type', 'CHOICE:' + ACT_TYPES.join('|')), f('outcome', 'CHOICE:' + OUTCOMES.join('|') + '|Note'), f('deal', 'REF:@deals'),
        f('company', 'REF:@companies', { label: 'Homeowner' }), f('contact', 'REF:@contacts'), f('rep', 'REF:@users'), f('date', 'DATE'), f('notes', 'LONGTEXT')],
      title: (p) => p.subject, columns: ['subject', 'type', 'outcome', 'deal', 'rep', 'date'], sort: { field: 'date', dir: -1 } },
    { key: 'projects', table: 'Projects', label: 'Installs', single: 'install', icon: 'sun', group: 'Installs', view: 'board', boardField: 'status',
      card: { due: 'date_due', dueWord: 'Due', owner: 'assigned_to', sub: 'company', note: 'url_details', value: null, stepOffset: 5 },
      fields: [f('project_title', 'TEXT', { label: 'Install' }), f('status', STATUS, { label: 'Step' }), f('queue', 'TEXT', { ui: 'queue', label: 'Team' }), f('assigned_to', 'REF:@users'),
        f('company', 'REF:@companies', { label: 'Homeowner' }), f('project_type', 'CHOICE:Solar|Solar + battery|Battery only|Panel upgrade', { label: 'System type' }), f('date_due', 'DATE'),
        f('url', 'URL', { label: 'Design / plans link' }), f('url_details', 'TEXT', { label: 'Link notes' }), f('project_attachment', 'URL', { label: 'Permit / docs link' }), f('notes', 'LONGTEXT'),
        f('deal', 'REF:@deals', { label: 'Sold deal' })],
      title: (p) => p.project_title,
      columns: ['status', 'assigned_to', 'company', 'project_title', 'project_type', 'date_due', 'url', 'project_attachment'],
      sort: { field: 'date_due', dir: 1 } },
    { key: 'indi_projects', table: 'Indi Projects', label: 'My tasks', single: 'task', icon: 'folderUser', group: 'Installs',
      fields: [f('project_title', 'TEXT', { label: 'Task' }), f('status', STATUS, { label: 'Step' }), f('assigned_to', 'REF:@users'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('date_due', 'DATE'), f('url', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.project_title, columns: ['project_title', 'status', 'assigned_to', 'company', 'date_due'], sort: { field: 'date_due', dir: 1 } },
    { key: 'scripts_mail', table: 'Scripts Mail', label: 'Customer messages', single: 'message', icon: 'mail', group: 'Installs',
      fields: [f('subject', 'TEXT'), f('status', 'CHOICE:New|In progress|Done'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('contact', 'REF:@contacts'), f('received', 'DATE'), f('script', 'LONGTEXT', { label: 'Message' })],
      title: (p) => p.subject, columns: ['subject', 'status', 'company', 'contact', 'received'] },
    { key: 'scripts_sent', table: 'Scripts Sent Mail', label: 'Sent proposals', single: 'sent proposal', icon: 'send', group: 'Sales',
      fields: [f('subject', 'TEXT'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('sent_to', 'EMAIL'), f('date_sent', 'DATE'), f('script', 'LONGTEXT', { label: 'Notes' })],
      title: (p) => p.subject, columns: ['subject', 'company', 'sent_to', 'date_sent'] },
    { key: 'scriptbuilders', table: 'Scriptbuilders & Blasts', label: 'Pitch & flyer PDFs', single: 'PDF', icon: 'layers', group: 'Sales',
      fields: [f('title', 'TEXT'), f('kind', 'CHOICE:Pitch|Flyer|Door hanger|Training', { label: 'Type' }), f('pdf_link', 'URL', { label: 'PDF link' }), f('date', 'DATE'), f('notes', 'LONGTEXT')],
      title: (p) => p.title, columns: ['title', 'kind', 'pdf_link', 'date'] },
    { key: 'calendar', table: 'Calendar', label: 'Calendar', single: 'event', icon: 'calendar', group: 'Schedule', view: 'calendar', dateField: 'date',
      fields: [f('title', 'TEXT'), f('date', 'DATE'), f('time', 'TEXT'), f('assigned_to', 'REF:@users'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('notes', 'LONGTEXT')],
      title: (p) => p.title, columns: ['title', 'date', 'time', 'assigned_to', 'company'], sort: { field: 'date', dir: 1 } },
    { key: 'sales_events', table: 'Sales Events', label: 'Canvass events', single: 'canvass event', icon: 'trend', group: 'Schedule', view: 'calendar', dateField: 'date',
      fields: [f('event', 'TEXT'), f('date', 'DATE'), f('status', 'CHOICE:Planned|Done|Cancelled'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('value', 'NUMBER', { label: 'Doors knocked' }), f('notes', 'LONGTEXT')],
      title: (p) => p.event, columns: ['event', 'date', 'status', 'value'], sort: { field: 'date', dir: 1 } },
    { key: 'notepad', table: 'Notepad', label: 'Notepad', single: 'note', icon: 'note', group: 'Notes', view: 'notes',
      fields: [f('title', 'TEXT'), f('body', 'LONGTEXT'), f('pinned', 'BOOLEAN')],
      title: (p) => p.title, columns: ['title', 'body', 'pinned'] }
  ];
  // One-time value moves when old pick-list options are renamed (message-on-hold → solar)
  const MIGRATE = {
    users: { role: { Sales: 'Closer', Production: 'Install coordinator', Billing: 'Support' } },
    companies: { status: { Active: 'Customer', Inactive: 'Past customer' } },
    deals: { stage: { 'Demo set': 'Appointment set', Contacted: 'Follow-up', Negotiation: 'Proposal sent', Won: 'Sold' } },
    scriptbuilders: { kind: { Scriptbuilder: 'Pitch', Blast: 'Flyer' } },
    activities: { outcome: { 'Demo set': 'Appointment set', Gatekeeper: 'Not home' }, type: { Meeting: 'Appointment', Demo: 'Appointment' } },
    projects: { status: { Intake: 'Site survey', Scripting: 'Design', Production: 'Install', Review: 'Permit', Delivered: 'PTO', 'On hold': 'Paused' },
      project_type: { Implementation: null, 'Production only': null, 'Script update': null, Any: null } },
    indi_projects: { status: { Intake: 'Site survey', Scripting: 'Design', Production: 'Install', Review: 'Permit', Delivered: 'PTO', 'On hold': 'Paused' } }
  };
  const GROUPS = ['Sales', 'Directory', 'Installs', 'Schedule', 'Notes', 'Custom'];
  const BOTTOM = ['home', 'deals', 'projects', 'calendar'];

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
      const fields_schema = {};
      for (const fd of s.fields) {
        fields_schema[fd.n] = fd.t.startsWith('REF:@') ? 'REF:' + byKey[fd.t.slice(5)].reg.id : fd.t;
      }
      if (!reg) {
        const r = await api('POST', '/api/registry/create-table', { app_name: APP, table_name: s.table, fields_schema });
        reg = Object.assign(r.table, { record_count: 0 });
      } else if (Object.entries(fields_schema).some(([k, t]) => reg.fields_schema[k] !== t)) {
        // This device has an older layout of the table: add new fields / update pick lists, keep all data
        try {
          const count = reg.record_count;
          const r = await api('POST', '/api/registry/update-schema', { registry_id: reg.id, fields_schema });
          reg = Object.assign(r.table, { record_count: count });
          await migrateValues(s.key, reg);
        } catch (e) { console.warn('Schema update skipped for', s.table, e.message); }
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

  async function migrateValues(key, reg) {
    const map = MIGRATE[key];
    if (!map) return;
    const { records } = await api('POST', '/api/vault/query-records', { registry_id: reg.id, limit: 500 });
    for (const rec of records) {
      const patch = {};
      for (const [field, moves] of Object.entries(map)) {
        const v = rec.payload[field];
        if (v !== undefined && Object.prototype.hasOwnProperty.call(moves, v)) patch[field] = moves[v];
      }
      if (Object.keys(patch).length) {
        try { await api('POST', '/api/vault/update-record', { registry_id: reg.id, record_id: rec.id, payload: patch }); } catch (_) {}
      }
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
    lead: 285, new: 210, 'new lead': 220, contacted: 200, 'follow-up': 190, sold: 150, paused: 8, 'appointment set': 265, 'not home': 45, 'site survey': 220, design: 265, permit: 36, install: 200, inspection: 190, pto: 150, customer: 150, 'past customer': 0, 'not a fit': 0, 'proposal sent': 36, negotiation: 320, won: 150, lost: 0, sold: 150, 'not interested': 0, 'no answer': 30, 'left voicemail': 30, gatekeeper: 45, 'callback set': 190, planned: 210, 'on hold': 8, cancelled: 8, inactive: 0, implementation: 320, blast: 340, scriptbuilder: 190 };
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
  const DONE = new Set(['Delivered', 'PTO', 'Done', 'Cancelled', 'Won', 'Sold', 'Lost']);
  const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();

  function display(spec, field, rec) {
    const v = rec.payload[field];
    if (v === undefined || v === null || v === '') return null;
    const t = typeOf(spec, field);
    switch (t.base) {
      case 'CHOICE': return pill(v);
      case 'REF': return el('span', { class: 'cell-ref' }, refLabel(t.target, v));
      case 'DATE': {
        const overdue = /due|follow/.test(field) && v.slice(0, 10) < todayISO() && !DONE.has(rec.payload.status || rec.payload.stage);
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
      case 'NUMBER': return el('span', { class: 'cell-mono' }, /\(\$\)/.test(fieldLabel(spec, field)) ? money(v) : field === 'system_size_kw' ? `${Number(v)} kW` : Number(v).toLocaleString());
      case 'LONGTEXT': return el('span', { class: 'cell-clip' }, v);
      default: return el('span', {}, v);
    }
  }
  const searchMemo = new WeakMap();
  function searchText(spec, rec) {
    let t = searchMemo.get(rec);
    if (t === undefined) { t = buildSearchText(spec, rec); searchMemo.set(rec, t); }
    return t;
  }
  function buildSearchText(spec, rec) {
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
          icon(k === 'home' ? 'home' : s.icon), k === 'home' ? 'Home' : k === 'calendar' ? 'Calendar' : k === 'deals' ? 'Pipeline' : s.label);
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
      stagger(view);
      countUp(view);
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
    await Promise.all([loadWithRefs(projects), load(byKey.companies), load(byKey.locations), load(byKey.contacts), load(byKey.deals), load(byKey.activities), load(byKey.calendar)]);
    const all = cache.projects;
    const open = all.filter((r) => !DONE.has(r.payload.status));

    const now = new Date();
    const head = el('div', { class: 'page-head has-orb reveal' },
      el('div', { class: 'home-logo', 'aria-hidden': 'true' }, el('img', { src: 'img/vault-logo.svg', width: 112, height: 112, alt: '', decoding: 'async' }), el('span', {}, 'VAULT')),
      el('div', { style: 'position:relative;z-index:1' },
        el('div', { class: 'eyebrow' }, now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
        el('h1', { class: 'page-title' }, settings.name ? `Let's go, ${settings.name}` : 'Homepage'))
    );
    const newLead = () => openRecord(byKey.deals, null, { stage: 'New lead', owner: settings.meId || undefined, follow_up: todayISO(), source: 'Door knock' });

    // ---- Sales: today's follow-ups, pipeline numbers, leaderboard ----
    const deals = cache.deals || [];
    const acts = cache.activities || [];
    const me = settings.meId;
    const openDeals = deals.filter((r) => !DONE.has(r.payload.stage));
    const myOpen = me ? openDeals.filter((r) => r.payload.owner === me) : openDeals;
    const today = todayISO();
    const due = sortRecords(byKey.deals, myOpen.filter((r) => r.payload.follow_up && String(r.payload.follow_up).slice(0, 10) <= today), { field: 'follow_up', dir: 1 });
    const monthStart = today.slice(0, 8) + '01';
    const wonMonth = deals.filter((r) => r.payload.stage === 'Sold' && String(r.payload.close_date || '').slice(0, 10) >= monthStart);
    const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const weekActs = acts.filter((r) => String(r.payload.date || '').slice(0, 10) >= weekAgo);
    const sumVal = (list) => list.reduce((a, r) => a + (Number(r.payload.value) || 0), 0);
    const stat = (n, label, href) => el('a', { class: 'stat', href }, el('b', {}, n), el('span', {}, label));
    const usersT = typeOf(byKey.deals, 'owner').target;
    const compT = typeOf(byKey.deals, 'company').target;

    const todayCard = el('section', { class: 'card span-8 reveal sales-card' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, me && settings.name ? `${settings.name}'s day` : 'Today'),
        el('a', { class: 'btn ghost sm', href: '#/t/deals', style: 'margin-left:auto' }, 'Pipeline', icon('arrowR'))),
      el('div', { class: 'stats' },
        stat(money(sumVal(myOpen)), me ? 'My open pipeline' : 'Open pipeline', '#/t/deals'),
        stat(String(myOpen.length), 'Open deals', '#/t/deals'),
        stat(money(sumVal(wonMonth)), 'Sold this month', '#/t/deals?stage=Sold'),
        stat(String(weekActs.filter((r) => !me || r.payload.rep === me).length), me ? 'My activities · 7 days' : 'Activities · 7 days', '#/t/activities')),
      el('h3', { class: 'sub-head' }, 'Follow-ups due', el('span', {}, due.length)),
      due.length ? el('div', { class: 'due-list' }, due.slice(0, 6).map((r) => {
        const late = String(r.payload.follow_up).slice(0, 10) < today;
        return el('button', { class: 'result due', onclick: () => openRecord(byKey.deals, r) },
          el('span', { class: 'due-main' }, el('strong', {}, titleOf(byKey.deals, r)),
            el('small', {}, [r.payload.company ? refLabel(compT, r.payload.company) : null, r.payload.next_step].filter(Boolean).join(' · ') || r.payload.stage || '')),
          el('span', { class: 'kdue ' + (late ? 'late' : 'today') }, late ? fmtDate(r.payload.follow_up) : 'Today'));
      })) : el('p', { class: 'hint' }, deals.length ? 'Nothing due. Go open new doors.' : 'No deals yet. Add your first deal to start the pipeline.'),
      el('div', { class: 'actions-row', style: 'margin-top:12px' },
        el('button', { class: 'btn primary sm', onclick: () => openRecord(byKey.activities, null, { date: today, rep: me || undefined }) }, icon('phone'), 'Log activity'),
        el('button', { class: 'btn sm', onclick: newLead }, icon('userPlus'), 'New lead'),
        !deals.length && hasSample() ? el('button', { class: 'btn sm', onclick: (e) => runSalesSample(e.currentTarget) }, 'Load sample deals') : null));

    const tallyReps = {};
    weekActs.forEach((r) => { if (r.payload.rep) tallyReps[r.payload.rep] = (tallyReps[r.payload.rep] || 0) + 1; });
    const ranked = Object.entries(tallyReps).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const top = ranked.length ? ranked[0][1] : 1;
    const board = el('section', { class: 'card span-4 reveal' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Leaderboard'), el('span', { class: 'eyebrow', style: 'margin-left:auto' }, 'Activities · 7 days')),
      ranked.length ? el('ol', { class: 'leaders' }, ranked.map(([id, n], i) => el('li', { class: id === me ? 'me' : null },
        el('span', { class: 'rank' }, i === 0 ? icon('trophy') : String(i + 1)),
        el('span', { class: 'who' }, refLabel(usersT, id)),
        el('span', { class: 'bar' }, el('i', { style: `width:${Math.max(8, Math.round(n / top * 100))}%` })),
        el('b', {}, n))))
        : el('p', { class: 'hint' }, 'Log knocks, calls and appointments to get on the board.'));

    // ---- Illustrated quick access: the screens reps open most ----
    const apptsToday = (cache.calendar || []).filter((r) => String(r.payload.date || '').slice(0, 10) === today).length;
    const tile = (ic, h, label, sub, action, badge) => el(typeof action === 'string' ? 'a' : 'button',
      Object.assign({ class: 'qtile', style: `--h:${h}`, 'data-tilt': true }, typeof action === 'string' ? { href: action } : { type: 'button', onclick: action }),
      el('span', { class: 'qart' }, el('span', { class: 'qglow' }), icon(ic), badge ? el('span', { class: 'qbadge' }, badge) : null),
      el('span', { class: 'qlabel' }, label), sub ? el('span', { class: 'qsub' }, sub) : null);
    const quick = el('section', { class: 'span-12 reveal quick', 'aria-label': 'Quick access' },
      tile('userPlus', 215, 'New lead', 'Add a homeowner', newLead),
      tile('door', 28, 'Log a knock', 'One tap', () => openRecord(byKey.activities, null, { type: 'Door knock', date: today, rep: me || undefined })),
      tile('bell', 350, 'Follow-ups', due.length ? `${due.length} due now` : 'All caught up', '#/t/deals?due=1', due.length || null),
      tile('target', 255, 'Pipeline', money(sumVal(myOpen)) + ' open', '#/t/deals'),
      tile('calendar', 190, 'Calendar', apptsToday ? `${apptsToday} appt${apptsToday === 1 ? '' : 's'} today` : 'Appointments', '#/t/calendar', apptsToday || null),
      tile('home', 160, 'Homeowners', `${(cache.companies || []).length} on file`, '#/t/companies'),
      tile('sun', 42, 'Installs', `${open.length} in progress`, '#/t/projects'),
      tile('layers', 290, 'Pitch & flyers', 'PDFs', '#/t/scriptbuilders'));

    // ---- Customer journey: one path from first knock to PTO ----
    const salesSteps = STAGE_LIST.filter((x) => x !== 'Lost');
    const step = (n, label, count, sub, href, kind) => el('a', { class: 'jstep ' + kind, href, style: `--h:${hue(label)}` },
      el('span', { class: 'jnum' }, n), el('span', { class: 'jlabel' }, label), el('b', { class: 'jcount' }, count), sub ? el('span', { class: 'jsub' }, sub) : null);
    const soldMonth = wonMonth.length;
    const journey = el('section', { class: 'card span-12 reveal journey-card' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Customer journey'),
        el('span', { class: 'eyebrow', style: 'margin-left:auto' }, 'Tap a step to open it')),
      el('div', { class: 'journey' },
        el('div', { class: 'jlane sales' }, el('div', { class: 'jlane-label' }, icon('target'), 'Sales'),
          el('div', { class: 'jsteps', style: `--n:${salesSteps.length}` }, salesSteps.map((st, i) => {
            const list = deals.filter((r) => (r.payload.stage || 'New lead') === st);
            if (st === 'Sold') return step(i + 1, 'Sold', soldMonth, 'this month', '#/t/deals?stage=Sold', 'sold');
            return step(i + 1, st, list.length, list.length ? money(sumVal(list)) : null, '#/t/deals?stage=' + encodeURIComponent(st), 'sale');
          }))),
        el('div', { class: 'jhandoff', 'aria-hidden': 'true' }, el('span', { class: 'jline' }), icon('arrowR'), el('span', {}, 'Sold deals start an install automatically'), el('span', { class: 'jline' })),
        el('div', { class: 'jlane install' }, el('div', { class: 'jlane-label' }, icon('sun'), 'Install'),
          el('div', { class: 'jsteps', style: `--n:${INSTALL_STEPS.length}` }, INSTALL_STEPS.map((st, i) => {
            const n = all.filter((r) => r.payload.status === st).length;
            return step(salesSteps.length + i + 1, st, n, st === 'PTO' ? 'live systems' : null, '#/t/projects?stage=' + encodeURIComponent(st), st === 'PTO' ? 'pto' : 'inst');
          })))));

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
        setTimeout(() => stagger(results));
        results.replaceChildren(...(hits.length ? hits.map((r) => el('button', { class: 'result', onclick: () => openRecord(s, r) }, icon(s.icon), titleOf(s, r))) :
          [el('button', { class: 'result', onclick: () => openRecord(s, null, { [Object.keys(schemaOf(s))[0]]: input.value.trim() }) }, icon('plus'), `Add “${input.value.trim()}”`)]));
      });
      return el('div', {}, el('label', { class: 'field' }, el('span', {}, s.label), el('div', { class: 'search' }, icon('search'), input)), results);
    };
    const searches = el('section', { class: 'card span-8 reveal' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'Find')),
      el('div', { class: 'searches' }, searchBox('companies'), searchBox('locations'), searchBox('contacts')));

    searches.classList.replace('span-8', 'span-12');
    return el('div', { class: 'home-grid' }, el('div', { class: 'span-12' }, head), quick, journey, todayCard, board, searches);
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

  function gridTable(spec, recs, columns, onSort, sortState, animate) {
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
    return el('div', { class: 'grid-scroll' }, el('table', { class: 'grid' + (animate === false ? '' : ' anim') }, thead, tbody));
  }

  async function renderTableView(spec, params) {
    await loadWithRefs(spec);
    const st = ui[spec.key] || (ui[spec.key] = { q: '', chip: '', sort: spec.sort || null, mode: spec.view === 'calendar' ? 'calendar' : spec.view === 'board' ? 'board' : 'list', month: null });
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
        spec.view === 'board' ? el('div', { class: 'chips', role: 'group', 'aria-label': 'View' },
          el('button', { class: 'chip', 'aria-pressed': String(st.mode === 'board'), onclick: () => { st.mode = 'board'; render(); } }, 'Pipeline'),
          el('button', { class: 'chip', 'aria-pressed': String(st.mode === 'list'), onclick: () => { st.mode = 'list'; render(); } }, 'List')) : null,
        el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`)));

    if (!recs.length) {
      return el('div', {}, head, el('div', { class: 'card reveal' },
        emptyState(spec.icon, `No ${spec.label.toLowerCase()} yet`, `Add your first ${spec.single} and it shows up here.`,
          el('div', { class: 'actions-row', style: 'justify-content:center' },
            el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`),
            (spec.key === 'deals' || spec.key === 'activities') && hasSample() ? el('button', { class: 'btn', onclick: (e) => runSalesSample(e.currentTarget) }, 'Load sample deals') : null))));
    }

    if (spec.view === 'notes') return el('div', {}, head, renderNotes(spec, recs));
    if (st.mode === 'calendar' && dateField) return el('div', {}, head, renderCalendar(spec, recs, dateField, st));
    if (st.mode === 'board' && spec.boardField) return el('div', {}, head, renderBoard(spec, recs, spec.boardField, st, params));

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

    let drawn = false;
    function draw() {
      const q = st.q.trim().toLowerCase();
      let rows = base;
      if (st.chip && chipField) rows = rows.filter((r) => r.payload[chipField] === st.chip);
      if (q) rows = rows.filter((r) => searchText(spec, r).includes(q));
      rows = sortRecords(spec, rows, st.sort);
      const onSort = (c) => { st.sort = st.sort && st.sort.field === c ? { field: c, dir: -st.sort.dir } : { field: c, dir: 1 }; draw(); };
      body.replaceChildren(
        rows.length ? gridTable(spec, rows, spec.columns, onSort, st.sort || { field: '' }, !drawn)
          : emptyState('search', 'No matches', 'Try a different search or clear the filters.', el('button', { class: 'btn', onclick: () => { st.q = ''; st.chip = ''; searchInput.value = ''; draw(); syncChips(); } }, 'Clear filters')),
        el('div', { class: 'grid-foot' }, el('span', {}, `Showing ${rows.length} of ${base.length}`), recs.length >= 500 ? el('span', {}, 'First 500 records loaded') : el('span', {}, '')));
      if (!drawn) stagger(body);
      drawn = true;
    }
    searchInput.addEventListener('input', () => { st.q = searchInput.value; draw(); });
    draw();
    // Build the search index while the browser is idle so the first keystroke is instant
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(() => base.forEach((r) => searchText(spec, r)));
    return el('div', {}, head, toolbar, body);
  }

  // Pipeline board (Salesforce-style kanban). Drag cards on desktop; tap the arrow to advance on a phone.
  // Works for Deals (sales stages) and Installs (install steps).
  function renderBoard(spec, recs, field, st, params = {}) {
    const c = spec.card || {};
    const stages = typeOf(spec, field).options;
    const terminal = new Set(['Lost', 'Paused']);
    const mineOnly = st.mine && settings.meId;
    const dueOnly = params.due === '1';
    const wrap = el('div', { class: 'board reveal' });
    const word = spec.label.toLowerCase();
    const search = el('input', { class: 'input', type: 'search', placeholder: `Search ${word}`, value: st.q || '', 'aria-label': `Search ${word}` });
    search.addEventListener('input', () => { st.q = search.value; fill(); });
    const toolbar = el('div', { class: 'toolbar' },
      el('div', { class: 'search' }, icon('search'), search),
      dueOnly ? el('a', { class: 'chip', 'aria-pressed': 'true', href: '#/t/' + spec.key, title: 'Show all' }, 'Due today or overdue  ×') : null,
      settings.meId && c.owner ? el('div', { class: 'chips' },
        el('button', { class: 'chip', 'aria-pressed': String(!mineOnly), onclick: () => { st.mine = false; render(); } }, 'Everyone'),
        el('button', { class: 'chip', 'aria-pressed': String(!!mineOnly), onclick: () => { st.mine = true; render(); } }, 'Mine')) : null);

    const inStage = (r, stage) => (r.payload[field] || stages[0]) === stage;
    function visible() {
      const q = (st.q || '').trim().toLowerCase();
      let rows = recs;
      if (mineOnly && c.owner) rows = rows.filter((r) => r.payload[c.owner] === settings.meId);
      if (dueOnly && c.due) rows = rows.filter((r) => r.payload[c.due] && String(r.payload[c.due]).slice(0, 10) <= todayISO() && !DONE.has(r.payload[field]));
      if (q) rows = rows.filter((r) => searchText(spec, r).includes(q));
      return rows;
    }
    function fill() {
      const rows = visible();
      wrap.replaceChildren();
      stages.forEach((stage, idx) => {
        const items = sortRecords(spec, rows.filter((r) => inStage(r, stage)), c.due ? { field: c.due, dir: 1 } : null);
        const total = c.value ? items.reduce((a, r) => a + (Number(r.payload[c.value]) || 0), 0) : null;
        const nx = stages[idx + 1];
        const next = !DONE.has(stage) && !terminal.has(stage) && nx && !terminal.has(nx) ? nx : null;
        const list = el('div', { class: 'kcol-list' }, items.length ? items.map((r) => {
          const fu = c.due && r.payload[c.due];
          const late = fu && fu.slice(0, 10) < todayISO() && !DONE.has(stage);
          const today = fu && fu.slice(0, 10) === todayISO();
          const ownerName = c.owner && r.payload[c.owner] ? refLabel(typeOf(spec, c.owner).target, r.payload[c.owner]) : null;
          return el('article', { class: 'kcard', draggable: 'true', tabIndex: 0, 'data-tilt': true,
              ondragstart: (e) => { e.dataTransfer.setData('text/plain', r.id); e.currentTarget.classList.add('dragging'); },
              ondragend: (e) => e.currentTarget.classList.remove('dragging'),
              onclick: () => openRecord(spec, r), onkeydown: (e) => { if (e.key === 'Enter') openRecord(spec, r); } },
            el('div', { class: 'kcard-top' }, el('strong', {}, titleOf(spec, r)), c.value && r.payload[c.value] ? el('span', { class: 'kval' }, money(r.payload[c.value])) : null),
            c.sub && r.payload[c.sub] ? el('div', { class: 'kmeta' }, refLabel(typeOf(spec, c.sub).target, r.payload[c.sub])) : null,
            c.note && r.payload[c.note] ? el('div', { class: 'kstep' }, r.payload[c.note]) : null,
            el('div', { class: 'kfoot' },
              DONE.has(stage) ? el('span', { class: 'kdue done' }, stage === 'Lost' ? 'Closed' : 'Done') :
                fu ? el('span', { class: 'kdue' + (late ? ' late' : today ? ' today' : '') }, late ? 'Overdue · ' + fmtDate(fu) : today ? `${c.dueWord} today` : `${c.dueWord} ${fmtDate(fu)}`) : el('span', { class: 'kdue none' }, `No ${c.dueWord.toLowerCase()} date`),
              ownerName ? el('span', { class: 'kowner', title: ownerName }, initials(ownerName)) : null,
              next ? el('button', { class: 'knext', type: 'button', title: `Move to ${next}`, 'aria-label': `Move to ${next}`,
                onclick: (e) => { e.stopPropagation(); moveStage(spec, r, field, next); } }, icon('arrowR')) : null));
        }) : el('div', { class: 'kempty' }, `Nothing in ${stage}`));
        const col = el('section', { class: 'kcol' + (terminal.has(stage) ? ' muted' : ''), 'data-stage': stage, style: `--h:${hue(stage)}`,
            ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('over'); },
            ondragleave: (e) => e.currentTarget.classList.remove('over'),
            ondrop: (e) => {
              e.preventDefault(); e.currentTarget.classList.remove('over');
              const rec = recs.find((x) => x.id === e.dataTransfer.getData('text/plain'));
              if (rec && !inStage(rec, stage)) moveStage(spec, rec, field, stage);
            } },
          el('header', { class: 'kcol-head' },
            el('span', { class: 'kstepno' }, terminal.has(stage) ? '–' : String(idx + 1 + (c.stepOffset || 0))), el('h3', {}, stage), el('span', { class: 'kcount' }, items.length),
            total !== null ? el('span', { class: 'ktotal' }, money(total)) : null),
          list,
          idx === 0 ? el('button', { class: 'kadd', type: 'button', onclick: () => openRecord(spec, null, Object.assign({ [field]: stage }, c.owner && settings.meId ? { [c.owner]: settings.meId } : {}, c.due === 'follow_up' ? { follow_up: todayISO() } : {})) }, icon('plus'), `Add ${spec.single}`) : null);
        wrap.append(col);
      });
    }
    fill();
    const jumpTo = (stage, smooth) => {
      const col = wrap.querySelector(`.kcol[data-stage="${CSS.escape(stage)}"]`);
      if (col) wrap.scrollTo({ left: col.offsetLeft - wrap.offsetLeft - 16, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
    };
    const jump = el('div', { class: 'board-jump', role: 'group', 'aria-label': 'Jump to stage' }, stages.map((stage, i) => {
      const n = visible().filter((r) => inStage(r, stage)).length;
      return el('button', { class: 'chip', type: 'button', style: `--h:${hue(stage)}`, onclick: () => jumpTo(stage, true) },
        el('span', { class: 'kdot' }), stage, el('span', { class: 'n' }, n));
    }));
    if (params.stage) requestAnimationFrame(() => requestAnimationFrame(() => jumpTo(params.stage, false)));
    return el('div', {}, toolbar, jump, wrap);
  }
  const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

  async function moveStage(spec, rec, field, stage) {
    const patch = { [field]: stage };
    if ((stage === 'Sold' || stage === 'Lost') && 'close_date' in schemaOf(spec) && !rec.payload.close_date) patch.close_date = todayISO();
    try {
      await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: patch });
      delete cache[spec.key];
      let msg = `Moved to ${stage}`;
      if (spec.key === 'deals' && stage === 'Sold') {
        const made = await ensureInstall(Object.assign({}, rec, { payload: Object.assign({}, rec.payload, patch) }));
        msg = `Sold: ${titleOf(spec, rec)}` + (made ? ' · install started at Site survey' : '');
      }
      if (spec.key === 'projects' && stage === 'PTO') msg = `PTO: ${titleOf(spec, rec)} is live`;
      toast(msg);
      await render();
      refreshCounts();
    } catch (e) { toast(e.message, true); }
  }

  // Sold deal → install record at Site survey (once per deal)
  async function ensureInstall(deal) {
    const P = byKey.projects;
    if (!P || !('deal' in schemaOf(P))) return false;
    const installs = await load(P, true);
    if (installs.some((r) => r.payload.deal === deal.id)) return false;
    const d = deal.payload;
    const due = (() => { const x = new Date(); x.setDate(x.getDate() + 7); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; })();
    const name = String(d.deal_name || 'New customer').split(' — ')[0];
    await api('POST', '/api/vault/insert-record', { registry_id: P.reg.id, payload: Object.assign(
      { project_title: `${name} — install`, status: 'Site survey', deal: deal.id, project_type: d.battery ? 'Solar + battery' : 'Solar', date_due: due },
      settings.queues[0] ? { queue: settings.queues[0] } : {}, d.company ? { company: d.company } : {}) });
    if (d.company && byKey.companies) {
      try { await api('POST', '/api/vault/update-record', { registry_id: byKey.companies.reg.id, record_id: d.company, payload: { status: 'Customer' } }); delete cache.companies; } catch (_) {}
    }
    delete cache.projects;
    return true;
  }

  // One-tap disposition (SalesRabbit-style): logs an activity, then nudges the deal forward
  const OUTCOME_STAGE = { 'Appointment set': 'Appointment set', 'Proposal sent': 'Proposal sent', Sold: 'Sold', 'Not interested': 'Lost' };
  function quickLog(spec, rec) {
    const type = el('select', { class: 'select', 'aria-label': 'Activity type' }, ACT_TYPES.map((t) => el('option', { value: t }, t)));
    const fu = el('input', { class: 'input', type: 'date', 'aria-label': 'Next follow-up', value: rec.payload.follow_up ? String(rec.payload.follow_up).slice(0, 10) : '' });
    const note = el('input', { class: 'input', type: 'text', placeholder: 'Quick note (optional)', 'aria-label': 'Quick note' });
    const btns = el('div', { class: 'outcomes' }, OUTCOMES.map((o) => el('button', { type: 'button', class: 'outcome', style: `--h:${hue(o)}`, onclick: (e) => log(o, e.currentTarget) }, o)));
    async function log(outcome, btn) {
      $$('.outcome', btns).forEach((b) => { b.disabled = true; });
      btn.classList.add('busy');
      const p = rec.payload;
      try {
        await api('POST', '/api/vault/insert-record', { registry_id: byKey.activities.reg.id, payload: Object.assign(
          { subject: `${type.value} — ${outcome}`, type: type.value, outcome, deal: rec.id, date: todayISO() },
          p.company ? { company: p.company } : {}, p.contact ? { contact: p.contact } : {},
          settings.meId || p.owner ? { rep: settings.meId || p.owner } : {}, note.value.trim() ? { notes: note.value.trim() } : {}) });
        const cur = STAGE_LIST.indexOf(p.stage || STAGE_LIST[0]);
        let to = OUTCOME_STAGE[outcome];
        if (!to && cur === 0) to = 'Follow-up';
        if (to && to !== 'Lost' && to !== 'Sold' && STAGE_LIST.indexOf(to) <= cur) to = null;
        if (DONE.has(p.stage)) to = null;
        const patch = {};
        if (to) patch.stage = to;
        if (to === 'Sold' || to === 'Lost') patch.close_date = todayISO();
        if (fu.value && fu.value !== String(p.follow_up || '').slice(0, 10)) patch.follow_up = fu.value;
        if (Object.keys(patch).length) await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: patch });
        delete cache.activities; delete cache[spec.key];
        const made = to === 'Sold' ? await ensureInstall(Object.assign({}, rec, { payload: Object.assign({}, p, patch) })) : false;
        toast(`Logged ${outcome}` + (to ? ` · moved to ${to}` : '') + (made ? ' · install started' : ''));
        closeDrawer();
        await render();
        refreshCounts();
      } catch (e) {
        toast(e.message, true);
        $$('.outcome', btns).forEach((b) => { b.disabled = false; });
        btn.classList.remove('busy');
      }
    }
    return el('div', { class: 'quicklog wide' },
      el('h3', {}, icon('phone'), 'Log activity'),
      el('div', { class: 'quicklog-row' }, type, el('label', { class: 'ql-fu' }, el('span', {}, 'Next follow-up'), fu)),
      note, btns);
  }

  // Notepad
  function renderNotes(spec, recs) {
    const sorted = recs.slice().sort((a, b) => (b.payload.pinned ? 1 : 0) - (a.payload.pinned ? 1 : 0) || (a.date_modified < b.date_modified ? 1 : -1));
    return el('div', { class: 'notes reveal' }, sorted.map((r) => el('button', { class: 'note' + (r.payload.pinned ? ' pinned' : ''), 'data-tilt': true, onclick: () => openRecord(spec, r) },
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
    const shift = (n) => { const d = new Date(y, m - 1 + n, 1); st.month = iso(d).slice(0, 7); st.flip = n > 0 ? 'flip-next' : 'flip-prev'; render(); };
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

    const flip = st.flip || ''; st.flip = '';
    return el('div', {}, head, el('div', { class: 'cal ' + (flip || 'reveal') }, dows, cells), agenda);
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
    $$('#drawer .drawer-body > *').forEach((n, i) => n.style.setProperty('--i', Math.min(i, 16)));
    const first = $('#drawer input, #drawer select, #drawer textarea');
    (first || $('#drawer')).focus({ preventScroll: true });
    $('#drawer').scrollTop = 0;
    requestAnimationFrame(() => { $('#drawer').scrollTop = 0; });
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
    const fields = Object.keys(schemaOf(spec)).filter((k) => !(spec.hide || []).includes(k) || (rec && rec.payload[k] != null && rec.payload[k] !== ''));
    const titleField = fields.find((c) => spec.title && spec.title({ [c]: 'x' }) === 'x') || fields[0];

    const errorBox = el('div', { class: 'form-error', role: 'alert', hidden: true });
    const form = el('form', { class: 'drawer-body', novalidate: true, onsubmit: (e) => { e.preventDefault(); save(); } },
      errorBox,
      rec && spec.key === 'deals' && byKey.activities ? quickLog(spec, rec) : null,
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
    await Promise.all(specs.filter((s) => Object.keys(schemaOf(s)).some((k) => typeOf(s, k).target === spec.reg.id)).map((s) => load(s)));
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
      ['users', 'u1', { name: 'Avery Cole', role: 'Closer', email: 'avery@example.com', phone: '916-555-0101', active: true }],
      ['users', 'u2', { name: 'Morgan Reyes', role: 'Setter', email: 'morgan@example.com', phone: '916-555-0102', active: true }],
      ['users', 'u3', { name: 'Sam Patel', role: 'Install coordinator', email: 'sam@example.com', phone: '916-555-0103', active: true }],

      ['companies', 'c1', { company_name: 'Martinez Household', status: 'Lead', phone: '916-555-0140', utility: 'PG&E', avg_monthly_bill: 310, roof_type: 'Composition shingle', roof_age: 8, shade: 'None', hoa: false, notes: 'Sample homeowner. South-facing roof. Wants a lower bill with nothing out of pocket.' }],
      ['companies', 'c2', { company_name: 'Nguyen Household', status: 'Lead', phone: '916-555-0150', utility: 'PG&E', avg_monthly_bill: 420, roof_type: 'Tile', roof_age: 12, shade: 'Some', hoa: true, notes: 'Sample homeowner. Asked about a battery for outages.' }],
      ['companies', 'c3', { company_name: 'Carter Household', status: 'Lead', phone: '916-555-0160', utility: 'Roseville Electric', avg_monthly_bill: 260, roof_type: 'Composition shingle', roof_age: 4, shade: 'None', notes: 'Sample homeowner from a flyer scan.' }],
      ['companies', 'c4', { company_name: 'Lopez Household', status: 'Lead', phone: '916-555-0170', utility: 'PG&E', avg_monthly_bill: 285, roof_type: 'Composition shingle', roof_age: 15, shade: 'Some', notes: 'Sample homeowner. Roof may need a check before install.' }],
      ['companies', 'c5', { company_name: 'Patel Household', status: 'Customer', phone: '916-555-0180', utility: 'PG&E', avg_monthly_bill: 240, roof_type: 'Composition shingle', roof_age: 6, shade: 'None', notes: 'Sample customer. Signed this month.' }],
      ['companies', 'c7', { company_name: 'Okafor Household', status: 'Lead', phone: '916-555-0195', utility: 'PG&E', avg_monthly_bill: 350, roof_type: 'Tile', roof_age: 10, shade: 'Some', notes: 'Sample homeowner. Comparing lease and PPA.' }],
      ['companies', 'c6', { company_name: 'Kim Household', status: 'Customer', phone: '916-555-0190', utility: 'SMUD', avg_monthly_bill: 220, roof_type: 'Metal', roof_age: 3, shade: 'None', notes: 'Sample customer. System on and producing.' }],

      ['locations', 'l1', { location_name: 'Martinez home', company: '@c1', address: '100 Sample St', city: 'Roseville', state: 'CA', zip: '95661' }],
      ['locations', 'l2', { location_name: 'Nguyen home', company: '@c2', address: '200 Example Ave', city: 'Rocklin', state: 'CA', zip: '95677' }],
      ['locations', 'l3', { location_name: 'Carter home', company: '@c3', address: '300 Placeholder Ct', city: 'Roseville', state: 'CA', zip: '95678' }],
      ['locations', 'l4', { location_name: 'Lopez home', company: '@c4', address: '400 Demo Way', city: 'Lincoln', state: 'CA', zip: '95648' }],
      ['locations', 'l5', { location_name: 'Patel home', company: '@c5', address: '500 Test Ln', city: 'Auburn', state: 'CA', zip: '95603' }],
      ['locations', 'l6', { location_name: 'Kim home', company: '@c6', address: '600 Mock Dr', city: 'Citrus Heights', state: 'CA', zip: '95610' }],

      ['contacts', 'p1', { first_name: 'Dana', last_name: 'Martinez', company: '@c1', location: '@l1', job_title: 'Homeowner', decision_maker: true, email: 'dana@example.com', phone: '916-555-0141' }],
      ['contacts', 'p2', { first_name: 'Luis', last_name: 'Martinez', company: '@c1', location: '@l1', job_title: 'Spouse', decision_maker: true, phone: '916-555-0142' }],
      ['contacts', 'p3', { first_name: 'Chris', last_name: 'Nguyen', company: '@c2', location: '@l2', job_title: 'Homeowner', decision_maker: true, email: 'chris@example.com', phone: '916-555-0151' }],
      ['contacts', 'p4', { first_name: 'Jamie', last_name: 'Carter', company: '@c3', location: '@l3', job_title: 'Homeowner', decision_maker: true, phone: '916-555-0161' }],
      ['contacts', 'p5', { first_name: 'Rosa', last_name: 'Lopez', company: '@c4', location: '@l4', job_title: 'Homeowner', decision_maker: true, phone: '916-555-0171' }],
      ['contacts', 'p6', { first_name: 'Raj', last_name: 'Patel', company: '@c5', location: '@l5', job_title: 'Homeowner', decision_maker: true, email: 'raj@example.com', phone: '916-555-0181' }],

      ['vendors', 'v1', { vendor_name: 'Sample Install Crew LLC', service: 'Installation', contact_name: 'Jordan Lee', email: 'crew@example.com', phone: '916-555-0170' }],
      ['vendors', 'v2', { vendor_name: 'Placeholder Permit Services', service: 'Permitting', contact_name: 'Taylor Kim', email: 'permits@example.com', website: 'https://example.com/permits' }],

      ['deals', 'd1', { deal_name: 'Martinez — 7.2 kW', stage: 'Appointment set', value: 24000, system_size_kw: 7.2, financing: 'PPA', battery: false, company: '@c1', contact: '@p1', owner: '@u1', source: 'Door knock', follow_up: day(0), next_step: 'Kitchen-table appointment 6:30pm, both spouses home' }],
      ['deals', 'd2', { deal_name: 'Nguyen — 9.6 kW + battery', stage: 'Proposal sent', value: 38000, system_size_kw: 9.6, financing: 'PPA', battery: true, company: '@c2', contact: '@p3', owner: '@u1', source: 'Referral', follow_up: day(-1), next_step: 'Answer battery questions, check HOA approval' }],
      ['deals', 'd3', { deal_name: 'Carter — 6.0 kW', stage: 'New lead', value: 20000, system_size_kw: 6, financing: 'PPA', company: '@c3', contact: '@p4', owner: '@u2', source: 'Flyer', follow_up: day(1), next_step: 'First call, ask for a recent bill' }],
      ['deals', 'd4', { deal_name: 'Lopez — 6.8 kW', stage: 'Follow-up', value: 22000, system_size_kw: 6.8, financing: 'Loan', company: '@c4', contact: '@p5', owner: '@u2', source: 'Door knock', follow_up: day(-3), next_step: 'Come back after 6pm when both are home' }],
      ['deals', 'd5', { deal_name: 'Okafor — 8.4 kW', company: '@c7', stage: 'Proposal sent', value: 29000, system_size_kw: 8.4, financing: 'Lease', owner: '@u1', source: 'Website', follow_up: day(2), next_step: 'Compare lease vs PPA side by side' }],
      ['deals', 'd6', { deal_name: 'Patel — 6.4 kW', stage: 'Sold', value: 22000, system_size_kw: 6.4, financing: 'PPA', company: '@c5', contact: '@p6', owner: '@u1', source: 'Referral', close_date: day(0) }],
      ['deals', 'd8', { deal_name: 'Kim — 5.2 kW', stage: 'Sold', value: 18000, system_size_kw: 5.2, financing: 'PPA', company: '@c6', owner: '@u2', source: 'Door knock', close_date: day(-45) }],
      ['deals', 'd7', { deal_name: 'Brooks — 5.6 kW', stage: 'Lost', value: 19000, system_size_kw: 5.6, financing: 'Cash', owner: '@u2', source: 'Door knock', close_date: day(-10), notes: 'Roof too shaded.' }],

      ['activities', 'a1', { subject: 'Door knock — Appointment set', type: 'Door knock', outcome: 'Appointment set', deal: '@d1', company: '@c1', contact: '@p1', rep: '@u2', date: day(-2) }],
      ['activities', 'a2', { subject: 'Door knock — Not home', type: 'Door knock', outcome: 'Not home', deal: '@d4', company: '@c4', rep: '@u2', date: day(-1), notes: 'Left a door hanger.' }],
      ['activities', 'a3', { subject: 'Email — Proposal sent', type: 'Email', outcome: 'Proposal sent', deal: '@d2', company: '@c2', contact: '@p3', rep: '@u1', date: day(-3) }],
      ['activities', 'a4', { subject: 'Call — No answer', type: 'Call', outcome: 'No answer', deal: '@d3', company: '@c3', rep: '@u2', date: day(0) }],
      ['activities', 'a5', { subject: 'Appointment — Sold', type: 'Appointment', outcome: 'Sold', deal: '@d6', company: '@c5', contact: '@p6', rep: '@u1', date: day(0) }],
      ['activities', 'a6', { subject: 'Follow-up visit — Callback set', type: 'Follow-up visit', outcome: 'Callback set', deal: '@d5', rep: '@u1', date: day(-1) }],

      ['projects', 'j1', { project_title: 'Patel — install', status: 'Site survey', queue: Q(0), assigned_to: '@u3', company: '@c5', deal: '@d6', project_type: 'Solar', date_due: day(3), url_details: 'Survey booked Thursday 10am' }],
      ['projects', 'j2', { project_title: 'Kim — install', status: 'Inspection', queue: Q(3), assigned_to: '@u3', company: '@c6', deal: '@d8', project_type: 'Solar', date_due: day(-1), url_details: 'Waiting on city inspector' }],
      ['projects', 'j3', { project_title: 'Alvarez — install', status: 'PTO', queue: Q(3), assigned_to: '@u3', project_type: 'Solar + battery', date_due: day(-12), url_details: 'Permission to operate granted' }],
      ['projects', 'j4', { project_title: 'Brennan — install', status: 'Design', queue: Q(1), assigned_to: '@u3', project_type: 'Solar', date_due: day(5), url: 'https://example.com/designs/brennan', url_details: 'Design draft ready for review' }],
      ['projects', 'j5', { project_title: 'Whitaker — install', status: 'Permit', queue: Q(1), assigned_to: '@u3', project_type: 'Solar', date_due: day(10), url_details: 'Submitted to the city' }],
      ['projects', 'j6', { project_title: 'Castillo — install', status: 'Install', queue: Q(2), assigned_to: '@u3', project_type: 'Solar + battery', date_due: day(2), url_details: 'Crew scheduled' }],



      ['scripts_mail', 'm1', { subject: 'Utility bills — Martinez', status: 'In progress', company: '@c1', contact: '@p1', received: day(-3), script: 'Sent the last 12 months of PG&E bills for the proposal.' }],
      ['scripts_mail', 'm2', { subject: 'Battery question — Nguyen', status: 'New', company: '@c2', contact: '@p3', received: day(-1), script: 'Wants to know how a battery works during an outage.' }],

      ['scripts_sent', 's1', { subject: 'Proposal — Nguyen 9.6 kW + battery', company: '@c2', sent_to: 'chris@example.com', date_sent: day(-3) }],
      ['scripts_sent', 's2', { subject: 'Welcome + next steps — Patel', company: '@c5', sent_to: 'raj@example.com', date_sent: day(0) }],

      ['scriptbuilders', 'b1', { title: 'Residential door-knock pitch', kind: 'Pitch', pdf_link: 'https://example.com/pdfs/door-knock-pitch.pdf', date: day(-20) }],
      ['scriptbuilders', 'b2', { title: 'Neighborhood flyer', kind: 'Flyer', pdf_link: 'https://example.com/pdfs/flyer.pdf', date: day(-4) }],

      ['calendar', 'e1', { title: 'Appointment — Martinez', date: day(0), time: '6:30 PM', assigned_to: '@u1', company: '@c1' }],
      ['calendar', 'e2', { title: 'Site survey — Patel', date: day(3), time: '10:00 AM', assigned_to: '@u3', company: '@c5' }],
      ['calendar', 'e3', { title: 'Callback — Lopez', date: day(1), time: '6:15 PM', assigned_to: '@u2', company: '@c4' }],
      ['calendar', 'e4', { title: 'Team sales meeting', date: day(1), time: '8:30 AM' }],

      ['sales_events', 'x1', { event: 'Rocklin neighborhood blitz', date: day(5), status: 'Planned' }],
      ['sales_events', 'x2', { event: 'Roseville canvass — Diamond Oaks area', date: day(-6), status: 'Done', value: 120 }],

      ['notepad', 'n1', { title: 'Sample data', body: 'Everything you see right now is fictional placeholder data. Remove it in Settings → Sample data before importing real records.', pinned: true }],
      ['notepad', 'n2', { title: 'Appointment checklist', body: 'Get 12 months of utility bills\nCheck roof age and shade\nBoth decision-makers present\nWalk through the agreement terms' }],
      ['notepad', 'n3', { title: 'Ideas', body: 'Ask every new customer for two neighbor referrals.' }]
    ];
  }

  async function loadSampleData(only) {
    const ids = {};       // placeholder -> real record id
    const made = {};      // spec key -> [ids]
    const set = sampleSet();
    if (only) {
      // Link new sample records to sample customers/users already in this workspace
      for (const [key, ref, payload] of set) {
        if (only.includes(key) || !byKey[key]) continue;
        const spec = byKey[key];
        const recs = await load(spec, true);
        const want = spec.title ? spec.title(payload) : null;
        const hit = want && recs.find((r) => titleOf(spec, r) === want);
        if (hit) ids[ref] = hit.id;
      }
    }
    for (const [key, ref, payload] of set) {
      const spec = byKey[key];
      if (!spec || (only && !only.includes(key))) continue;
      const body = {};
      for (const [k, v] of Object.entries(payload)) {
        if (!(k in schemaOf(spec))) continue;
        body[k] = typeof v === 'string' && v.startsWith('@') ? ids[v.slice(1)] : v;
        if (body[k] === undefined) delete body[k];
      }
      const r = await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload: body });
      ids[ref] = r.record.id;
      (made[key] = made[key] || []).push(r.record.id);
    }
    const prev = settings.sampleIds || {};
    for (const [k, v] of Object.entries(made)) prev[k] = (prev[k] || []).concat(v);
    settings.sampleIds = prev;
    if (!only) settings.sampleVersion = SAMPLE_VERSION;
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
  const SAMPLE_VERSION = 3;

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
            : 'Fill every tab with fictional homeowners, solar deals, installs, appointments and notes to try things out.'),
          el('div', { class: 'actions-row' }, hasSample()
            ? el('button', { class: 'btn danger', type: 'button', onclick: (e) => runSample(e.currentTarget, false) }, icon('trash'), 'Remove sample data')
            : el('button', { class: 'btn', type: 'button', onclick: (e) => runSample(e.currentTarget, true) }, icon('plus'), 'Load sample data'))),
        backup),
      el('div', { class: 'drawer-foot' }, el('span', { class: 'spacer' }), el('button', { class: 'btn ghost', onclick: closeDrawer }, 'Cancel'), saveBtn));
  }
  async function runSalesSample(btn) {
    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
      await loadSampleData(['deals', 'activities']);
      toast('Sample deals loaded');
      await render();
      refreshCounts();
    } catch (e) { toast(e.message, true); btn.disabled = false; }
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
  // Motion & 3D interaction
  // ---------------------------------------------------------------------
  function stagger(root) {
    const groups = ['.reveal', '.grid tbody tr', '.note', '.result', '.tally-btn'];
    for (const sel of groups) $$(sel, root).forEach((n, i) => n.style.setProperty('--i', i));
  }
  function countUp(root) {
    $$('.tally-n[data-n]', root).forEach((n) => {
      const target = Number(n.dataset.n) || 0;
      if (!target || reduceMotion()) return;
      const t0 = performance.now(), dur = 520;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        n.textContent = String(Math.round(target * eased)).padStart(2, '0');
        if (k < 1) requestAnimationFrame(step);
      };
      n.textContent = '00';
      requestAnimationFrame(step);
    });
  }
  function wireMotion() {
    const bg = $('#bg');
    let raf = 0, lastEvt = null, tilted = null;
    const frame = () => {
      raf = 0;
      const e = lastEvt;
      if (!e) return;
      // Background drift: transform on its own layer, no style recalculation
      const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
      bg.style.transform = `translate3d(${(-px * 10).toFixed(1)}px, ${(-py * 10).toFixed(1)}px, 0)`;
      const target = e.target instanceof Element ? e.target : null;
      // Spotlight on the panel under the pointer
      const card = target && target.closest('.card');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      // 3D tilt with glare
      const t = target && target.closest('[data-tilt]');
      if (tilted && tilted !== t) { tilted.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)'; tilted.style.transform = ''; }
      tilted = t;
      if (t) {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        t.style.transition = 'transform .12s ease-out';
        t.style.transform = `perspective(700px) rotateX(${((.5 - y) * 14).toFixed(2)}deg) rotateY(${((x - .5) * 16).toFixed(2)}deg) translateZ(6px)`;
        t.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        t.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      }
    };
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || reduceMotion()) return;
      lastEvt = e;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      if (tilted) { tilted.style.transform = ''; tilted = null; }
    });

    // Ripple on buttons
    document.addEventListener('pointerdown', (e) => {
      const b = e.target.closest && e.target.closest('.btn, .chip, .tally-btn, .bottombar button');
      if (!b || reduceMotion()) return;
      const r = b.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const dot = el('span', { class: 'ripple', style: `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px` });
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.style.overflow = 'hidden';
      b.append(dot);
      setTimeout(() => dot.remove(), 750);
    });
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
    wireMotion();
    applyTheme();
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const pill = $('#modePill');
    try {
      await api('GET', '/api/health');
      pill.textContent = LOCAL ? 'Browser mode' : 'Live';
      pill.className = 'mode-pill on';
      pill.title = LOCAL ? 'Data is saved in this browser on this device' : 'Connected to the server';
      await bootstrap();
      if (hasSample() && settings.sampleVersion !== SAMPLE_VERSION) {
        // Older sample records (message-on-hold era) → current solar homeowners. Records you added stay.
        try { await removeSampleData(); await loadSampleData(); toast('Sample data updated to solar homeowners'); } catch (e) { console.warn('Sample refresh failed', e.message); }
      }
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
