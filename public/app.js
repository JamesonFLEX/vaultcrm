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
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12zM8 10h8M8 14h5',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    panel: 'M3 7h18l-2 10H5zM9 7l-1 10M15 7l1 10M4 12h16',
    wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01',
    pulse: 'M3 12h4l3-8 4 16 3-8h4',
    pin: 'M12 17v5M9 3h6l-1 6 4 4H6l4-4z',
    back: 'M15 6l-6 6 6 6',
    mail2: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6'
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
  const STAGE_LIST = ['New lead', 'Follow-up', 'Appointment set', 'Proposal sent', 'Sold', 'Lost'];
  const PROJECT_PHASES = [
    ['Contract & design', ['Contract', 'Pre-install', 'Design', 'Revisions & NTP / M1', 'PIR']],
    ['Pre-construction', ['MPU planning', 'Utility pre-check', 'Permit submitted', 'Permit approved', 'MPU']],
    ['Install', ['Install scheduled', 'Install verification & post-install design', 'Post-install permitting', 'System activation & inspection']],
    ['Close-out & service', ['PTO', 'M3', 'Closed', 'Service & monitoring']]
  ];
  const INSTALL_STEPS = PROJECT_PHASES.flatMap(([, steps]) => steps);
  // Moving a project into these steps stamps the matching milestone date (if empty)
  const STEP_DATE = { Contract: 'contract_date', 'Revisions & NTP / M1': 'ntp_m1_date', 'Permit approved': 'permit_approved_date',
    'Install verification & post-install design': 'install_date', PTO: 'pto_date', M3: 'm3_date', Closed: 'closed_date' };
  const STATUS = 'CHOICE:' + INSTALL_STEPS.concat('Paused').join('|');
  // Customer-facing milestones: only these send the homeowner an update (internal steps stay quiet)
  const MAIN_DEFAULT = ['Contract', 'Pre-install', 'Design', 'Permit approved', 'Install scheduled', 'Install verification & post-install design', 'System activation & inspection', 'PTO'];
  const MS_TPL = {
    Contract: { label: 'Welcome', sms: 'Hi {first_name}, welcome to {company}! Your solar project is officially underway. I’ll text you at each big step. Reply STOP to opt out.', subject: 'Welcome! Your solar project is underway', email: 'Hi {first_name},\n\nWelcome aboard. Your solar project is officially underway, and we’ll keep you posted at each major step.\n\n{rep_name}\n{company}\n{rep_phone}' },
    'Pre-install': { label: 'Site survey', sms: 'Hi {first_name}, next up for your solar project is the site survey. We’ll confirm a day and time with you shortly. Reply STOP to opt out.', subject: 'Next step: your site survey', email: 'Hi {first_name},\n\nThe next step is a site survey of your home. We’ll reach out to confirm a day and time that works for you.\n\n{rep_name}\n{company}\n{rep_phone}' },
    Design: { label: 'Design ready', sms: 'Hi {first_name}, your solar system design is in progress. We’ll walk you through it before anything is final. Reply STOP to opt out.', subject: 'Your solar design', email: 'Hi {first_name},\n\nYour system design is in progress. We’ll review it with you before anything is finalized.\n\n{rep_name}\n{company}\n{rep_phone}' },
    'Permit approved': { label: 'Permit approved', sms: 'Good news {first_name}: your solar permit is approved! Next we’ll get your install on the calendar. Reply STOP to opt out.', subject: 'Your permit is approved', email: 'Hi {first_name},\n\nGood news: your permit is approved. Next we’ll schedule your installation.\n\n{rep_name}\n{company}\n{rep_phone}' },
    'Install scheduled': { label: 'Install scheduled', sms: 'Hi {first_name}, your solar install is on the calendar. We’ll confirm the date and what to expect. Reply STOP to opt out.', subject: 'Your install is scheduled', email: 'Hi {first_name},\n\nYour installation is on the calendar. We’ll confirm the date and walk you through what to expect on install day.\n\n{rep_name}\n{company}\n{rep_phone}' },
    'Install verification & post-install design': { label: 'Install complete', sms: 'Hi {first_name}, your panels are installed! Next up is the final inspection. Reply STOP to opt out.', subject: 'Your panels are installed', email: 'Hi {first_name},\n\nYour panels are installed. Next comes the final inspection and activation.\n\n{rep_name}\n{company}\n{rep_phone}' },
    'System activation & inspection': { label: 'Inspection & activation', sms: 'Hi {first_name}, we’re scheduling your system’s final inspection and activation. Almost there! Reply STOP to opt out.', subject: 'Final inspection and activation', email: 'Hi {first_name},\n\nWe’re scheduling your final inspection and system activation. You’re almost there.\n\n{rep_name}\n{company}\n{rep_phone}' },
    PTO: { label: 'System is live', sms: 'Hi {first_name}, your solar system has permission to operate and is officially on! Reply STOP to opt out.', subject: 'Your solar system is on!', email: 'Hi {first_name},\n\nYour system has permission to operate and is officially on. Thanks for going solar with {company}.\n\n{rep_name}\n{company}\n{rep_phone}' }
  };
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
        f('job_title', 'TEXT', { label: 'Role' }), f('decision_maker', 'BOOLEAN', { label: 'Decision-maker' }), f('email', 'EMAIL'), f('phone', 'PHONE'),
        f('text_consent', 'BOOLEAN', { label: 'OK to text (consent on file)' }), f('opted_out', 'BOOLEAN', { label: 'Opted out of follow-ups' })],
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
        f('follow_up', 'DATE'), f('next_step', 'TEXT'), f('close_date', 'DATE'), f('notes', 'LONGTEXT'),
        f('seq_status', 'CHOICE:Active|Paused|Done|Opted out', { label: 'Auto follow-up' }), f('seq_start', 'DATE', { label: 'Auto follow-up started' }), f('seq_step', 'NUMBER', { label: 'Auto follow-ups sent' }),
        f('stage_since', 'DATE', { label: 'In current stage since' })],
      hide: ['seq_step', 'stage_since'],
      title: (p) => p.deal_name, columns: ['deal_name', 'stage', 'system_size_kw', 'financing', 'company', 'owner', 'follow_up', 'next_step'], sort: { field: 'follow_up', dir: 1 } },
    { key: 'activities', table: 'Activities', label: 'Activities', single: 'activity', icon: 'phone', group: 'Sales',
      fields: [f('subject', 'TEXT'), f('type', 'CHOICE:' + ACT_TYPES.join('|')), f('outcome', 'CHOICE:' + OUTCOMES.join('|') + '|Note'), f('deal', 'REF:@deals'),
        f('company', 'REF:@companies', { label: 'Homeowner' }), f('contact', 'REF:@contacts'), f('rep', 'REF:@users'), f('date', 'DATE'), f('notes', 'LONGTEXT')],
      title: (p) => p.subject, columns: ['subject', 'type', 'outcome', 'deal', 'rep', 'date'], sort: { field: 'date', dir: -1 } },
    { key: 'projects', table: 'Projects', label: 'Projects', single: 'project', icon: 'sun', group: 'Projects', view: 'board', boardField: 'status',
      card: { due: 'date_due', dueWord: 'Due', owner: 'assigned_to', sub: 'company', note: 'url_details', value: null, stepOffset: 5 },
      fields: [f('project_title', 'TEXT', { label: 'Project' }), f('status', STATUS, { label: 'Step' }), f('queue', 'TEXT', { ui: 'queue', label: 'Team' }), f('assigned_to', 'REF:@users', { label: 'Responsible' }),
        f('company', 'REF:@companies', { label: 'Homeowner' }), f('project_type', 'CHOICE:Solar|Solar + battery|Battery only|Panel upgrade', { label: 'System type' }), f('date_due', 'DATE', { label: 'Next action due' }),
        f('url', 'URL', { label: 'Design / plans link' }), f('url_details', 'TEXT', { label: 'Current status note' }), f('project_attachment', 'URL', { label: 'Permit / docs link' }), f('notes', 'LONGTEXT'),
        f('deal', 'REF:@deals', { label: 'Sold deal' }),
        // Milestones
        f('contract_date', 'DATE', { label: 'Contract signed' }), f('ntp_m1_date', 'DATE', { label: 'NTP / M1' }), f('permit_approved_date', 'DATE', { label: 'Permit approved' }),
        f('install_date', 'DATE', { label: 'Install complete' }), f('pto_date', 'DATE', { label: 'PTO' }), f('m3_date', 'DATE', { label: 'M3' }), f('closed_date', 'DATE', { label: 'Closed' }),
        // Equipment
        f('system_size_kw', 'NUMBER', { label: 'System size (kW)' }), f('panel_model', 'TEXT', { label: 'Panel model' }), f('panel_count', 'NUMBER', { label: 'Panel count' }),
        f('inverter', 'TEXT', { label: 'Inverter / optimizers' }), f('battery_model', 'TEXT', { label: 'Battery' }), f('racking', 'TEXT', { label: 'Racking' }),
        // Funding
        f('funding_source', 'CHOICE:PPA|Lease|Loan|Cash', { label: 'Funding source' }), f('funding_partner', 'TEXT', { label: 'Funding partner' }),
        f('contract_value', 'NUMBER', { label: 'Contract value ($)' }), f('funding_notes', 'LONGTEXT', { label: 'Funding info' }),
        // Adders
        f('mpu_required', 'BOOLEAN', { label: 'MPU required' }), f('adders', 'LONGTEXT', { label: 'Adders (one per line)' }), f('adders_total', 'NUMBER', { label: 'Adders total ($)' }),
        // Monitoring
        f('monitoring_platform', 'TEXT', { label: 'Monitoring platform' }), f('monitoring_site_id', 'TEXT', { label: 'Site ID' }), f('monitoring_url', 'URL', { label: 'Monitoring link' }),
        f('monitoring_status', 'CHOICE:Not set up|Online|Offline|Service needed', { label: 'Monitoring status' }),
        f('cust_pending', 'TEXT', { label: 'Customer update waiting' }), f('cust_notified', 'TEXT', { label: 'Customer updates sent' }),
        f('stage_since', 'DATE', { label: 'In current step since' })],
      hide: ['cust_pending', 'cust_notified', 'stage_since'],
      sections: [
        { title: 'Project', icon: 'sun', open: true, fields: ['project_title', 'status', 'assigned_to', 'queue', 'company', 'deal', 'project_type', 'date_due', 'url_details', 'notes'] },
        { title: 'Project milestones', icon: 'flag', fields: ['contract_date', 'ntp_m1_date', 'permit_approved_date', 'install_date', 'pto_date', 'm3_date', 'closed_date'],
          summary: (p) => { const done = ['contract_date', 'ntp_m1_date', 'permit_approved_date', 'install_date', 'pto_date', 'm3_date', 'closed_date'].filter((k) => p[k]).length; return `${done} of 7 done`; } },
        { title: 'Equipment used', icon: 'panel', fields: ['system_size_kw', 'panel_count', 'panel_model', 'inverter', 'battery_model', 'racking'],
          summary: (p) => [p.system_size_kw ? `${p.system_size_kw} kW` : '', p.panel_count ? `${p.panel_count} panels` : '', p.battery_model ? 'battery' : ''].filter(Boolean).join(' · ') },
        { title: 'Funding source & info', icon: 'wallet', fields: ['funding_source', 'funding_partner', 'contract_value', 'funding_notes'],
          summary: (p) => [p.funding_source, p.funding_partner, p.contract_value ? money(p.contract_value) : ''].filter(Boolean).join(' · ') },
        { title: 'Adders', icon: 'plus', fields: ['mpu_required', 'adders', 'adders_total'],
          summary: (p) => [p.mpu_required ? 'MPU' : '', p.adders ? `${String(p.adders).split('\n').filter(Boolean).length} adder(s)` : '', p.adders_total ? money(p.adders_total) : ''].filter(Boolean).join(' · ') },
        { title: 'Monitoring', icon: 'pulse', fields: ['monitoring_status', 'monitoring_platform', 'monitoring_site_id', 'monitoring_url'],
          summary: (p) => [p.monitoring_status, p.monitoring_platform].filter(Boolean).join(' · ') },
        { title: 'Documents', icon: 'external', fields: ['url', 'project_attachment'] }
      ],
      title: (p) => p.project_title,
      columns: ['status', 'assigned_to', 'company', 'project_title', 'project_type', 'date_due', 'funding_source', 'monitoring_status'],
      sort: { field: 'date_due', dir: 1 } },
    { key: 'indi_projects', table: 'Indi Projects', label: 'My tasks', single: 'task', icon: 'folderUser', group: 'Notes',
      fields: [f('project_title', 'TEXT', { label: 'Task' }), f('status', 'CHOICE:To do|In progress|Done'), f('assigned_to', 'REF:@users'), f('company', 'REF:@companies', { label: 'Homeowner' }), f('date_due', 'DATE'), f('url', 'URL'), f('notes', 'LONGTEXT')],
      title: (p) => p.project_title, columns: ['project_title', 'status', 'assigned_to', 'company', 'date_due'], sort: { field: 'date_due', dir: 1 } },
    { key: 'scripts_mail', table: 'Scripts Mail', label: 'Customer messages', single: 'message', icon: 'mail', group: 'Projects',
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
    { key: 'feed', table: 'Chatter', label: 'Chatter', single: 'post', icon: 'chat', group: 'Notes', view: 'feed',
      fields: [f('body', 'LONGTEXT', { label: 'Message' }), f('about', 'TEXT'), f('about_key', 'TEXT'), f('about_id', 'TEXT'),
        f('author', 'REF:@users', { label: 'From' }), f('notify', 'REF:@users', { label: 'For' }), f('seen', 'BOOLEAN'),
        f('pinned', 'BOOLEAN', { label: 'Pinned' }), f('pinned_by', 'REF:@users', { label: 'Pinned by' }), f('pin_audience', 'TEXT', { label: 'Pinned for' })],
      hide: ['about_key', 'about_id', 'pin_audience'],
      title: (p) => p.about || 'Post', columns: ['about', 'body', 'author', 'notify', 'seen'] },
    { key: 'messages', table: 'Messages', label: 'Messages', single: 'message', icon: 'chat', group: 'Notes', view: 'chat',
      fields: [f('body', 'LONGTEXT', { label: 'Message' }), f('from_user', 'REF:@users', { label: 'From' }), f('to_user', 'REF:@users', { label: 'To' }),
        f('pin_key', 'TEXT'), f('pin_id', 'TEXT'), f('pin_label', 'TEXT', { label: 'Pinned' }), f('seen', 'BOOLEAN')],
      hide: ['pin_key', 'pin_id'],
      title: (p) => p.body ? String(p.body).slice(0, 60) : 'Message', columns: ['body', 'from_user', 'to_user', 'pin_label', 'seen'] },
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
    projects: { status: { Intake: 'Pre-install', Scripting: 'Design', Production: 'Install scheduled', Review: 'Permit submitted', Delivered: 'PTO', 'On hold': 'Paused',
        'Site survey': 'Pre-install', Permit: 'Permit submitted', Install: 'Install scheduled', Inspection: 'System activation & inspection' },
      project_type: { Implementation: null, 'Production only': null, 'Script update': null, Any: null } },
    indi_projects: { status: { Intake: 'To do', Scripting: 'In progress', Production: 'In progress', Review: 'In progress', Delivered: 'Done', 'On hold': 'To do',
      'Site survey': 'To do', Design: 'In progress', Permit: 'In progress', Install: 'In progress', Inspection: 'In progress', PTO: 'Done', Paused: 'To do' } }
  };
  const GROUPS = ['Sales', 'Projects', 'Directory', 'Schedule', 'Notes', 'Custom'];
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
    const all = [];
    for (let offset = 0; offset < 50000; offset += 500) {
      const r = await api('POST', '/api/vault/query-records', { registry_id: spec.reg.id, limit: 500, offset });
      all.push(...r.records);
      if (r.records.length < 500) break;
    }
    cache[spec.key] = all;
    spec.reg.record_count = Math.max(spec.reg.record_count || 0, all.length);
    return all;
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
  const DONE = new Set(['Delivered', 'Done', 'Cancelled', 'Won', 'Sold', 'Lost', 'Closed', 'Service & monitoring']);
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
      if (r.name !== 'new') node.append(pageFoot(r));
      view.replaceChildren(node);
      updateBell();
      updateApBadge();
      updateChatBadge();
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
    await Promise.all([loadWithRefs(projects), load(byKey.companies), load(byKey.locations), load(byKey.contacts), load(byKey.deals), load(byKey.activities), load(byKey.calendar), load(byKey.feed), load(byKey.users)]);
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
      tile('userPlus', 215, 'Add lead', 'New homeowner', newLead),
      tile('door', 28, 'Log a knock', 'One tap', () => openRecord(byKey.activities, null, { type: 'Door knock', date: today, rep: me || undefined })),
      tile('bell', 350, 'Follow-ups', due.length ? `${due.length} due now` : 'All caught up', '#/t/deals?due=1', due.length || null),
      tile('target', 255, 'Pipeline', money(sumVal(myOpen)) + ' open', '#/t/deals'),
      tile('calendar', 190, 'Calendar', apptsToday ? `${apptsToday} appt${apptsToday === 1 ? '' : 's'} today` : 'Appointments', '#/t/calendar', apptsToday || null),
      tile('home', 160, 'Homeowners', `${(cache.companies || []).length} on file`, '#/t/companies'),
      tile('sun', 42, 'Projects', `${open.filter((r) => r.payload.status !== 'Paused').length} active`, '#/t/projects'),
      Object.assign(tile('send', 320, 'Autopilot', 'Follow-ups & updates', openAutopilot), { id: 'apTile' }));

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
            if (st === 'Sold') return step(i + 1, 'Sold', list.length, `${soldMonth} this month`, '#/t/deals?stage=Sold', 'sold');
            return step(i + 1, st, list.length, list.length ? money(sumVal(list)) : null, '#/t/deals?stage=' + encodeURIComponent(st), 'sale');
          }))),
        el('div', { class: 'jhandoff', 'aria-hidden': 'true' }, el('span', { class: 'jline' }), icon('arrowR'), el('span', {}, 'Sold deals start a project automatically'), el('span', { class: 'jline' })),
        el('div', { class: 'jlane install' }, el('div', { class: 'jlane-label' }, icon('sun'), 'Project'),
          PROJECT_PHASES.map(([phase, steps]) => el('div', { class: 'jphase' },
            el('div', { class: 'jphase-label' }, phase),
            el('div', { class: 'jsteps', style: '--n:5' }, steps.map((st) => {
              const n = all.filter((r) => r.payload.status === st).length;
              const num = salesSteps.length + INSTALL_STEPS.indexOf(st) + 1;
              const kind = st === 'PTO' ? 'pto' : st === 'Service & monitoring' ? 'svc' : 'inst';
              return step(num, st, n, st === 'Service & monitoring' ? 'ongoing' : null, '#/t/projects?stage=' + encodeURIComponent(st), kind);
            })))))));

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
    // ---- Pinned for the team: every note anyone pinned ----
    const pinnedPosts = (cache.feed || []).filter(canSeePin).sort(byPinned);
    const pinsCard = pinnedPosts.length ? el('section', { class: 'card span-12 reveal pinned-card' },
      el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, icon('pin'), 'Pinned for you'), el('span', { class: 'kcount' }, pinnedPosts.length),
        el('a', { class: 'btn ghost sm', href: '#/t/feed', style: 'margin-left:auto' }, 'All Chatter', icon('arrowR'))),
      el('div', { class: 'posts pins-grid' }, pinnedPosts.slice(0, 6).map((x) => postView(x, true, () => render())))) : null;
    return el('div', { class: 'home-grid' }, el('div', { class: 'span-12' }, head), pinsCard, quick, journey, todayCard, board, searches);
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
    await Promise.all([loadWithRefs(spec), byKey.locations ? load(byKey.locations) : null]);
    const st = ui[spec.key] || (ui[spec.key] = { q: '', chip: '', sort: null, sortBy: spec.sort ? 'date' : 'newest', mode: spec.view === 'calendar' ? 'calendar' : spec.view === 'board' ? 'board' : 'list', month: null });
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
        ['feed', 'chat'].includes(spec.view) ? null : el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`)));

    if (!recs.length && spec.view !== 'feed') {
      return el('div', {}, head, el('div', { class: 'card reveal' },
        emptyState(spec.icon, `No ${spec.label.toLowerCase()} yet`, `Add your first ${spec.single} and it shows up here.`,
          el('div', { class: 'actions-row', style: 'justify-content:center' },
            el('button', { class: 'btn primary', onclick: () => openRecord(spec, null, newDefaults()) }, icon('plus'), `New ${spec.single}`),
            (spec.key === 'deals' || spec.key === 'activities') && hasSample() ? el('button', { class: 'btn', onclick: (e) => runSalesSample(e.currentTarget) }, 'Load sample deals') : null))));
    }

    if (params.open) { const hit = recs.find((r) => r.id === params.open); if (hit) setTimeout(() => openRecord(spec, hit)); }
    if (spec.view === 'notes') return el('div', {}, head, renderNotes(spec, recs));
    if (spec.view === 'feed') { await load(byKey.users); return el('div', {}, head, renderFeed(spec, recs)); }
    if (spec.view === 'chat') { setTimeout(() => openChat(null)); }
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
      sortSelect(spec, st, 'newest', () => { st.sort = null; draw(); }),
      queue ? el('button', { class: 'chip', 'aria-pressed': 'true', onclick: () => go('#/t/' + spec.key), title: 'Clear queue filter' }, `Queue: ${queue}  ×`) : null,
      chips);

    let drawn = false;
    function draw() {
      const q = st.q.trim().toLowerCase();
      let rows = base;
      if (st.chip && chipField) rows = rows.filter((r) => r.payload[chipField] === st.chip);
      if (q) rows = rows.filter((r) => searchText(spec, r).includes(q));
      rows = st.sort ? sortRecords(spec, rows, st.sort) : applySort(spec, rows, st.sortBy || 'newest');
      const onSort = (c) => { st.sort = st.sort && st.sort.field === c ? { field: c, dir: -st.sort.dir } : { field: c, dir: 1 }; draw(); };
      body.replaceChildren(
        rows.length ? gridTable(spec, rows, spec.columns, onSort, st.sort || { field: '' }, !drawn)
          : emptyState('search', 'No matches', 'Try a different search or clear the filters.', el('button', { class: 'btn', onclick: () => { st.q = ''; st.chip = ''; searchInput.value = ''; draw(); syncChips(); } }, 'Clear filters')),
        el('div', { class: 'grid-foot' }, el('span', {}, `Showing ${rows.length} of ${base.length}`), el('span', {}, '')));
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

  // ---------------------------------------------------------------------
  // Sort by: date, address, system size, team member, value, name, newest/oldest
  // ---------------------------------------------------------------------
  let addrIndex = null;
  function addressIndex() {
    if (addrIndex && addrIndex.n === (cache.locations || []).length) return addrIndex.map;
    const map = new Map();
    (cache.locations || []).forEach((l) => { const c = l.payload.company; if (c && !map.has(c)) map.set(c, [l.payload.address, l.payload.city].filter(Boolean).join(', ')); });
    addrIndex = { n: (cache.locations || []).length, map };
    return map;
  }
  function addressOf(spec, r) {
    const p = r.payload;
    if (p.address) return [p.address, p.city].filter(Boolean).join(', ');
    if (spec.key === 'companies') return addressIndex().get(r.id) || '';
    if (p.location) { const l = (cache.locations || []).find((x) => x.id === p.location); if (l) return [l.payload.address, l.payload.city].filter(Boolean).join(', '); }
    return p.company ? addressIndex().get(p.company) || '' : '';
  }
  // Whole days a deal / project has sat in its current stage
  const localDay = (iso) => { const d = new Date(iso); return isNaN(d) ? todayISO() : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daysInStage = (r) => Math.max(0, daysBetween(r.payload.stage_since ? String(r.payload.stage_since).slice(0, 10) : localDay(r.date_created), todayISO()));
  function sortChoices(spec) {
    const sch = schemaOf(spec);
    const out = [{ id: 'newest', label: 'Newest first', v: (r) => r.date_created, dir: -1 }, { id: 'oldest', label: 'Oldest first', v: (r) => r.date_created, dir: 1 }];
    const dateField = (spec.card && spec.card.due) || ['follow_up', 'date_due', 'date', 'close_date', 'received', 'date_sent'].find((k) => k in sch);
    if (dateField) {
      // Logs (activities) read newest first; upcoming dates (follow-ups, due dates) read soonest first
      const latest = spec.sort && spec.sort.field === dateField && spec.sort.dir < 0;
      out.push({ id: 'date', label: `${fieldLabel(spec, dateField).replace(/\s*\(.*\)/, '')} (${latest ? 'latest first' : 'soonest first'})`, v: (r) => r.payload[dateField] || null, dir: latest ? -1 : 1 });
      out.push({ id: 'date_rev', label: `${fieldLabel(spec, dateField).replace(/\s*\(.*\)/, '')} (${latest ? 'oldest first' : 'latest first'})`, v: (r) => r.payload[dateField] || null, dir: latest ? 1 : -1 });
    }
    if (['address', 'company', 'location'].some((k) => k in sch) || spec.key === 'companies') out.push({ id: 'address', label: 'Address', v: (r) => addressOf(spec, r).replace(/^\d+\s+/, '').toLowerCase() || null, dir: 1 });
    if (spec.boardField) out.push({ id: 'days', label: 'Days in current stage (longest)', v: daysInStage, dir: -1 });
    if ('system_size_kw' in sch) out.push({ id: 'size', label: 'System size (largest)', v: (r) => (r.payload.system_size_kw == null ? null : Number(r.payload.system_size_kw)), dir: -1 });
    const member = ['owner', 'assigned_to', 'rep', 'author', 'from_user'].find((k) => k in sch);
    if (member) out.push({ id: 'member', label: 'Team member', v: (r) => (r.payload[member] ? refLabel(typeOf(spec, member).target, r.payload[member]).toLowerCase() : null), dir: 1 });
    const money = ['value', 'contract_value', 'avg_monthly_bill'].find((k) => k in sch);
    if (money) out.push({ id: 'value', label: `${fieldLabel(spec, money).replace(/\s*\(.*\)/, '')} (highest)`, v: (r) => (r.payload[money] == null ? null : Number(r.payload[money])), dir: -1 });
    out.push({ id: 'name', label: 'Name A–Z', v: (r) => titleOf(spec, r).toLowerCase(), dir: 1 });
    return out;
  }
  function applySort(spec, recs, id) {
    const c = sortChoices(spec).find((x) => x.id === id);
    if (!c) return recs;
    return recs.slice().sort((a, b) => {
      const x = c.v(a), y = c.v(b);
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      return (x < y ? -1 : 1) * c.dir;
    });
  }
  function sortSelect(spec, st, def, onChange) {
    const sel = el('select', { class: 'select sort-sel', 'aria-label': 'Sort by' },
      sortChoices(spec).map((c) => el('option', { value: c.id, selected: (st.sortBy || def) === c.id }, c.label)));
    sel.addEventListener('change', () => { st.sortBy = sel.value; onChange(); });
    return el('label', { class: 'sort-wrap' }, icon('sliders'), el('span', {}, 'Sort'), sel);
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
    const focus = params.stage && stages.includes(params.stage) ? params.stage : null;
    const defSort = c.due ? 'date' : 'newest';
    const toolbar = el('div', { class: 'toolbar' },
      el('div', { class: 'search' }, icon('search'), search),
      sortSelect(spec, st, defSort, () => fill()),
      focus ? el('a', { class: 'chip', 'aria-pressed': 'true', href: '#/t/' + spec.key, title: 'Show every stage' }, `Showing: ${focus}  ×`) : null,
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
      wrap.classList.toggle('focus', !!focus);
      stages.forEach((stage, idx) => {
        if (focus && stage !== focus) return;
        const items = applySort(spec, rows.filter((r) => inStage(r, stage)), st.sortBy || defSort);
        const total = c.value ? items.reduce((a, r) => a + (Number(r.payload[c.value]) || 0), 0) : null;
        const nx = stages[idx + 1];
        const next = !DONE.has(stage) && !terminal.has(stage) && nx && !terminal.has(nx) ? nx : null;
        // One stage back: Lost reopens to Follow-up; Paused has no fixed previous step
        const prev = stage === 'Lost' ? (stages.includes('Follow-up') ? 'Follow-up' : stages[0]) : stage === 'Paused' ? null : idx > 0 ? stages[idx - 1] : null;
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
            el('div', { class: 'kmeta' }, c.sub && r.payload[c.sub] ? refLabel(typeOf(spec, c.sub).target, r.payload[c.sub]) : null,
              !DONE.has(stage) ? (() => { const d = daysInStage(r); return el('span', { class: 'kdays' + (d >= 14 ? ' stuck' : ''), title: `In ${stage} for ${d} day${d === 1 ? '' : 's'}` }, `${d}d in stage`); })() : null),
            c.note && r.payload[c.note] ? el('div', { class: 'kstep' }, r.payload[c.note]) : null,
            el('div', { class: 'kfoot' },
              DONE.has(stage) ? el('span', { class: 'kdue done' }, stage === 'Lost' ? 'Closed' : 'Done') :
                fu ? el('span', { class: 'kdue' + (late ? ' late' : today ? ' today' : '') }, late ? 'Overdue · ' + fmtDate(fu) : today ? `${c.dueWord} today` : `${c.dueWord} ${fmtDate(fu)}`) : el('span', { class: 'kdue none' }, `No ${c.dueWord.toLowerCase()} date`),
              ownerName ? el('span', { class: 'kowner', title: ownerName }, initials(ownerName)) : null,
              prev ? el('button', { class: 'knext kback', type: 'button', title: `Back to ${prev}`, 'aria-label': `Back to ${prev}`,
                onclick: (e) => { e.stopPropagation(); moveStage(spec, r, field, prev, { back: true }); } }, icon('back')) : null,
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
    // Stage chips: open just that stage (tap again / ×  to see every stage)
    const jump = el('div', { class: 'board-jump', role: 'group', 'aria-label': 'Show one stage' },
      el('a', { class: 'chip', href: '#/t/' + spec.key, 'aria-pressed': String(!focus) }, 'All stages'),
      stages.map((stage) => {
        const n = visible().filter((r) => inStage(r, stage)).length;
        return el('a', { class: 'chip', href: focus === stage ? '#/t/' + spec.key : `#/t/${spec.key}?stage=${encodeURIComponent(stage)}`, 'aria-pressed': String(focus === stage), style: `--h:${hue(stage)}` },
          el('span', { class: 'kdot' }), stage, el('span', { class: 'n' }, n));
      }));
    void jumpTo;
    return el('div', {}, toolbar, jump, wrap);
  }
  const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

  async function moveStage(spec, rec, field, stage, opts = {}) {
    const patch = { [field]: stage };
    if ('stage_since' in schemaOf(spec)) patch.stage_since = todayISO();
    if (opts.back) {
      // Going back: no customer messages, no milestone stamps, no new project; reopen a closed deal's follow-ups
      if (spec.key === 'deals' && DONE.has(rec.payload.stage) && !DONE.has(stage)) { patch.close_date = null; if (rec.payload.seq_status === 'Done') patch.seq_status = 'Active'; }
      if (spec.key === 'projects' && rec.payload.cust_pending) patch.cust_pending = null;
      try {
        await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: patch });
        delete cache[spec.key];
        await postChatter(spec, rec, `Moved back to ${stage}.`, respOf(rec.payload), true);
        toast(`Moved back to ${stage}`);
        await render();
        refreshCounts();
      } catch (e) { toast(e.message, true); }
      return;
    }
    if ((stage === 'Sold' || stage === 'Lost') && 'close_date' in schemaOf(spec) && !rec.payload.close_date) patch.close_date = todayISO();
    if (spec.key === 'deals') {
      const cfg = apCfg();
      if (DONE.has(stage)) patch.seq_status = 'Done';
      else if (cfg.stages.includes(stage) && !rec.payload.seq_start) Object.assign(patch, { seq_start: todayISO(), seq_status: 'Active', seq_step: 0 });
    }
    if (spec.key === 'projects' && msCfg().on && msCfg().steps.includes(stage) && !String(rec.payload.cust_notified || '').split('|').includes(stage)) patch.cust_pending = stage;
    const stamp = spec.key === 'projects' && STEP_DATE[stage];
    if (stamp && stamp in schemaOf(spec) && !rec.payload[stamp]) patch[stamp] = todayISO();
    try {
      await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: patch });
      delete cache[spec.key];
      let msg = `Moved to ${stage}`;
      if (spec.key === 'deals' && stage === 'Sold') {
        const made = await ensureInstall(Object.assign({}, rec, { payload: Object.assign({}, rec.payload, patch) }));
        msg = `Sold: ${titleOf(spec, rec)}` + (made ? ' · project started at Contract' : '');
      }
      if (spec.key === 'projects' && stage === 'PTO') msg = `PTO: ${titleOf(spec, rec)} is live`;
      await postChatter(spec, rec, `Moved to ${stage}.`, respOf(Object.assign({}, rec.payload, patch)), true);
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
    const sch = schemaOf(P);
    const extra = { contract_date: todayISO(), system_size_kw: d.system_size_kw, funding_source: d.financing, contract_value: d.value };
    Object.keys(extra).forEach((k) => { if (!(k in sch) || extra[k] === undefined || extra[k] === null || extra[k] === '') delete extra[k]; });
    const r = await api('POST', '/api/vault/insert-record', { registry_id: P.reg.id, payload: Object.assign(
      { project_title: `${name} — project`, status: 'Contract', stage_since: todayISO(), deal: deal.id, project_type: d.battery ? 'Solar + battery' : 'Solar', date_due: due },
      extra, settings.queues[0] ? { queue: settings.queues[0] } : {}, d.company ? { company: d.company } : {}) });
    if (msCfg().on && msCfg().steps.includes('Contract')) { try { await api('POST', '/api/vault/update-record', { registry_id: P.reg.id, record_id: r.record.id, payload: { cust_pending: 'Contract' } }); } catch (_) {} }
    await postChatter(P, r.record, `New project from sold deal ${d.deal_name || ''}. Starting at Contract.`.replace(/\s+\./, '.'), null, true);
    if (d.company && byKey.companies) {
      try { await api('POST', '/api/vault/update-record', { registry_id: byKey.companies.reg.id, record_id: d.company, payload: { status: 'Customer' } }); delete cache.companies; } catch (_) {}
    }
    delete cache.projects;
    return true;
  }

  // ---------------------------------------------------------------------
  // Chatter: notes on any record that notify the responsible teammate
  // ---------------------------------------------------------------------
  const respOf = (p) => (p && (p.assigned_to || p.owner || p.rep)) || null;
  const userRec = (id) => (cache.users || []).find((u) => u.id === id);
  const userName = (id) => { const u = userRec(id); return u ? u.payload.name || 'Teammate' : null; };
  const appLink = (key, id) => `${location.origin}${location.pathname}#/t/${key}?open=${id}`;
  async function postChatter(spec, rec, body, notify, auto, extra) {
    const F = byKey.feed;
    if (!F || !rec || spec.key === 'feed' || !String(body || '').trim()) return null;
    const payload = { body: String(body).trim().slice(0, 9000), about: titleOf(spec, rec), about_key: spec.key, about_id: rec.id, seen: false };
    await load(byKey.users);
    if (settings.meId && !userRec(settings.meId)) await ensureMe();
    if (settings.meId && userRec(settings.meId)) payload.author = settings.meId;
    if (notify && !userRec(notify)) notify = null;
    if (notify && notify !== settings.meId) payload.notify = notify;
    if (auto && !payload.notify) return null; // automatic posts only when someone needs to act
    if (extra && extra.pinned) { payload.pinned = true; payload.pin_audience = extra.pinned === true ? 'all' : extra.pinned; if (payload.author) payload.pinned_by = payload.author; }
    try { const r = await api('POST', '/api/vault/insert-record', { registry_id: F.reg.id, payload }); delete cache.feed; return r.record; }
    catch (e) { if (!auto) toast('Couldn’t post that note: ' + (e.details ? [].concat(e.details).join('; ') : e.message), true); return null; }
  }
  function shareLinks(post) {
    const u = userRec(post.payload.notify);
    if (!u) return null;
    const msg = `${post.payload.about}: ${post.payload.body}\n${appLink(post.payload.about_key, post.payload.about_id)}`;
    const phone = String(u.payload.phone || '').replace(/[^\d+]/g, '');
    return el('span', { class: 'post-send' },
      phone ? el('a', { class: 'chip sm', href: `sms:${phone}?&body=${encodeURIComponent(msg)}`, onclick: (e) => e.stopPropagation() }, icon('chat'), 'Text ' + (u.payload.name || '').split(' ')[0]) : null,
      u.payload.email ? el('a', { class: 'chip sm', href: `mailto:${u.payload.email}?subject=${encodeURIComponent('VaultCRM: ' + post.payload.about)}&body=${encodeURIComponent(msg)}`, onclick: (e) => e.stopPropagation() }, icon('mail2'), 'Email') : null);
  }
  function postView(post, showAbout, onChange) {
    const p = post.payload;
    const from = userName(p.author) || 'Someone';
    const when = new Date(post.date_created);
    const pinBtn = el('button', { class: 'post-pin' + (p.pinned ? ' on' : ''), type: 'button', 'aria-pressed': String(!!p.pinned),
      'aria-label': p.pinned ? 'Unpin' : 'Pin this note', title: p.pinned ? 'Unpin' : 'Pin this note',
      onclick: async (e) => {
        e.stopPropagation();
        const refresh = () => { if (onChange) onChange(); else { const v = postView(post, showAbout, onChange); node.replaceWith(v); } };
        if (p.pinned) { await togglePin(post, null); refresh(); return; }
        const open = node.querySelector('.post-pinpick');
        if (open) { open.remove(); return; }
        const pick = pinSwitch('pp_' + post.id, true);
        const box = el('div', { class: 'post-pinpick', onclick: (ev) => ev.stopPropagation() }, pick.row,
          el('div', { class: 'actions-row' }, el('button', { class: 'btn ghost sm', type: 'button', onclick: () => box.remove() }, 'Cancel'),
            el('button', { class: 'btn primary sm', type: 'button', onclick: async () => { const a = pick.value(); if (!a) { toast('Pick at least one person', true); return; } await togglePin(post, a); refresh(); } }, icon('pin'), 'Pin')));
        node.querySelector('.post-main').append(box);
      } }, icon('pin'));
    const node = el('article', { class: 'post' + (p.notify === settings.meId && !p.seen ? ' unread' : '') + (p.pinned ? ' pinned' : '') },
      pinBtn,
      el('span', { class: 'post-av' }, initials(from)),
      el('div', { class: 'post-main' },
        p.pinned ? el('div', { class: 'post-pinned' }, icon('pin'), `Pinned for ${audienceLabel(p.pin_audience)}` + (p.pinned_by && userName(p.pinned_by) ? ` by ${userName(p.pinned_by)}` : '')) : null,
        el('div', { class: 'post-meta' }, el('b', {}, from),
          p.notify ? el('span', { class: 'post-for' }, icon('arrowR'), userName(p.notify) || 'Teammate') : null,
          el('time', { datetime: post.date_created, title: when.toLocaleString() }, fmtWhen(when))),
        showAbout ? (p.about_key ? el('a', { class: 'post-about', href: `#/t/${p.about_key}?open=${p.about_id}`, onclick: () => markSeen(post) }, p.about) : el('span', { class: 'post-about team' }, icon('users'), p.about || 'Team')) : null,
        el('p', { class: 'post-body' }, p.body),
        p.notify && p.notify !== settings.meId ? shareLinks(post) : null));
    return node;
  }
  async function togglePin(post, audience) {
    const on = !!audience;
    const patch = { pinned: on, pinned_by: on && settings.meId ? settings.meId : null, pin_audience: on ? audience : null };
    try {
      await api('POST', '/api/vault/update-record', { registry_id: byKey.feed.reg.id, record_id: post.id, payload: patch });
      post.payload.pinned = on;
      if (on) post.payload.pin_audience = audience; else delete post.payload.pin_audience;
      if (on && settings.meId) post.payload.pinned_by = settings.meId; else delete post.payload.pinned_by;
      toast(on ? `Pinned for ${audienceLabel(audience)}` : 'Unpinned');
    } catch (e) { toast(e.message, true); }
  }
  const byPinned = (a, b) => (canSeePin(b) - canSeePin(a)) || (a.date_created < b.date_created ? 1 : -1);
  // Pin audience: 'all' | 'team:<role>' | 'users:<id>,<id>'
  const TEAM_NAMES = { Admin: 'Admins', Setter: 'Setters', Closer: 'Closers', 'Install coordinator': 'Install coordinators', Support: 'Support' };
  const teamLabel = (r) => TEAM_NAMES[r] || `${r}s`;
  function audienceLabel(a) {
    if (!a || a === 'all') return 'everyone';
    if (a.startsWith('team:')) return teamLabel(a.slice(5));
    const names = a.slice(6).split(',').map((id) => (userName(id) || 'Teammate').split(' ')[0]);
    return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ');
  }
  function canSeePin(post) {
    const p = post.payload;
    if (!p.pinned) return false;
    const a = p.pin_audience || 'all';
    if (a === 'all') return true;
    const me = settings.meId;
    if (!me) return false;
    if (p.author === me || p.pinned_by === me) return true;
    const u = userRec(me);
    if (u && u.payload.role === 'Admin') return true;
    if (a.startsWith('team:')) return !!u && u.payload.role === a.slice(5);
    return a.slice(6).split(',').includes(me);
  }
  // Pin picker: Don't pin / Everyone / a team / specific people
  function pinSwitch(id, startOn) {
    const users = (cache.users || []).filter((u) => u.payload.active !== false);
    const roles = [...new Set(users.map((u) => u.payload.role).filter(Boolean))];
    const sel = el('select', { class: 'select', id, 'aria-label': 'Pin for' },
      startOn ? null : el('option', { value: '' }, 'Don’t pin'),
      el('option', { value: 'all' }, 'Everyone'),
      roles.length ? el('optgroup', { label: 'A team' }, roles.map((r) => el('option', { value: 'team:' + r }, teamLabel(r)))) : null,
      el('option', { value: 'users' }, 'Specific people…'));
    const people = el('div', { class: 'pin-people', hidden: true }, users.map((u) => el('label', {}, el('input', { type: 'checkbox', value: u.id }), u.payload.name || 'Teammate')));
    sel.addEventListener('change', () => { people.hidden = sel.value !== 'users'; });
    const value = () => {
      if (sel.value !== 'users') return sel.value || null;
      const ids = [...people.querySelectorAll('input:checked')].map((x) => x.value);
      return ids.length ? 'users:' + ids.join(',') : null;
    };
    const reset = () => { sel.value = startOn ? 'all' : ''; people.hidden = true; people.querySelectorAll('input').forEach((x) => { x.checked = false; }); };
    return { value, reset, row: el('div', { class: 'pin-for' }, icon('pin'), el('span', {}, 'Pin for'), sel, people) };
  }
  function fmtWhen(d) {
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  async function markSeen(post) {
    if (!post || post.payload.seen || post.payload.notify !== settings.meId) return;
    try { await api('POST', '/api/vault/update-record', { registry_id: byKey.feed.reg.id, record_id: post.id, payload: { seen: true } }); post.payload.seen = true; updateBell(); } catch (_) {}
  }
  async function chatterSection(spec, rec) {
    if (!byKey.feed) return null;
    await Promise.all([load(byKey.feed), load(byKey.users)]);
    const posts = (cache.feed || []).filter((r) => r.payload.about_key === spec.key && r.payload.about_id === rec.id).sort(byPinned);
    posts.forEach(markSeen);
    const pinner = pinSwitch('chatter_pin');
    const text = el('textarea', { class: 'textarea', rows: 2, placeholder: 'Write a note… the person below gets notified', 'aria-label': 'Chatter note' });
    const users = (cache.users || []).filter((u) => u.payload.active !== false);
    const who = el('select', { class: 'select', 'aria-label': 'Notify' }, el('option', { value: '' }, 'No one'),
      users.map((u) => el('option', { value: u.id, selected: u.id === respOf(rec.payload) }, u.payload.name || 'Teammate')));
    const list = el('div', { class: 'posts' });
    const countEl = el('span', {}, posts.length);
    const redraw = () => { countEl.textContent = posts.length; posts.sort(byPinned); list.replaceChildren(...(posts.length ? posts.slice(0, 30).map((x) => postView(x, false, redraw)) : [el('p', { class: 'hint', style: 'margin:0' }, 'No notes yet. Post one to loop in the team.')])); };
    redraw();
    const btn = el('button', { class: 'btn primary sm', type: 'button', onclick: async () => {
      if (!text.value.trim()) { text.focus(); return; }
      btn.disabled = true;
      const made = await postChatter(spec, rec, text.value, who.value || null, false, { pinned: pinner.value() });
      btn.disabled = false;
      if (!made) return;
      text.value = ''; pinner.reset();
      posts.push(made); redraw();
      toast((made.payload.pinned ? `Pinned for ${audienceLabel(made.payload.pin_audience)}` : 'Posted') + (made.payload.notify ? ` · ${userName(made.payload.notify)} notified` : ''));
      updateBell();
    } }, icon('send'), 'Post');
    return el('div', { class: 'chatter wide' },
      el('h3', {}, icon('chat'), 'Chatter', countEl),
      text,
      el('div', { class: 'chatter-row' }, el('label', { class: 'ql-fu' }, el('span', {}, 'Notify'), who), btn),
      pinner.row,
      list);
  }
  async function updateBell() {
    const b = $('#bellBtn');
    if (!b || !byKey.feed) return;
    try { await load(byKey.feed); } catch (_) { return; }
    const n = settings.meId ? (cache.feed || []).filter((r) => r.payload.notify === settings.meId && !r.payload.seen).length : 0;
    const badge = b.querySelector('.bell-n');
    if (badge) badge.remove();
    if (n) b.append(el('span', { class: 'bell-n' }, n > 99 ? '99+' : n));
    b.setAttribute('aria-label', n ? `Notifications, ${n} unread` : 'Notifications');
  }
  async function openInbox() {
    await Promise.all([load(byKey.feed, true), load(byKey.users)]);
    const mine = settings.meId ? (cache.feed || []).filter((r) => r.payload.notify === settings.meId) : [];
    mine.sort((a, b) => (a.payload.seen === b.payload.seen ? (a.date_created < b.date_created ? 1 : -1) : a.payload.seen ? 1 : -1));
    const unread = mine.filter((r) => !r.payload.seen);
    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, 'Chatter'), el('h2', { id: 'drawerTitle' }, 'Notifications')),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' },
        !settings.meId ? el('p', { class: 'hint wide' }, 'Choose who you are in Settings to get notifications.') : null,
        settings.meId && !mine.length ? el('p', { class: 'hint wide' }, 'Nothing for you yet. Notes your team posts for you show up here.') : null,
        el('div', { class: 'posts wide inbox' }, mine.slice(0, 50).map((x) => {
          const v = postView(x, true);
          v.addEventListener('click', (e) => { if (e.target.closest('a')) return; markSeen(x); closeDrawer(); go(`#/t/${x.payload.about_key}?open=${x.payload.about_id}`); });
          return v;
        }))),
      el('div', { class: 'drawer-foot' }, el('a', { class: 'btn ghost', href: '#/t/feed', onclick: closeDrawer }, 'All Chatter'), el('span', { class: 'spacer' }),
        unread.length ? el('button', { class: 'btn', onclick: async () => { for (const x of unread) await markSeen(x); closeDrawer(); toast('All caught up'); } }, icon('check'), 'Mark all read') : null));
  }
  function renderFeed(spec, recs) {
    const all = recs.slice();
    const pinnedBox = el('div', { class: 'posts' });
    const restBox = el('div', { class: 'posts' });
    const pinnedCard = el('section', { class: 'card reveal pinned-card' }, el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, icon('pin'), 'Pinned for you')), pinnedBox);
    const draw = () => {
      const pins = all.filter(canSeePin).sort(byPinned);
      const rest = all.filter((x) => !canSeePin(x)).sort(byPinned);
      pinnedCard.hidden = !pins.length;
      pinnedBox.replaceChildren(...pins.map((x) => postView(x, true, draw)));
      restBox.replaceChildren(...(rest.length ? rest.slice(0, 200).map((x) => postView(x, true, draw)) : [el('p', { class: 'hint' }, 'No notes yet.')]));
    };
    draw();
    const text = el('textarea', { class: 'textarea', rows: 2, placeholder: 'Post an update for the whole team…', 'aria-label': 'Team update' });
    const pinner = pinSwitch('feed_pin');
    const btn = el('button', { class: 'btn primary sm', type: 'button', onclick: async () => {
      const body = text.value.trim();
      if (!body) { text.focus(); return; }
      btn.disabled = true;
      const payload = { body: body.slice(0, 9000), about: 'Team update', seen: true };
      await ensureMe();
      if (settings.meId) payload.author = settings.meId;
      const aud = pinner.value();
      if (aud) { payload.pinned = true; payload.pin_audience = aud; if (settings.meId) payload.pinned_by = settings.meId; }
      try {
        const r = await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload });
        all.push(r.record); delete cache.feed;
        text.value = ''; pinner.reset(); draw();
        toast(payload.pinned ? `Pinned for ${audienceLabel(payload.pin_audience)}` : 'Posted');
      } catch (e) { toast(e.message, true); }
      btn.disabled = false;
    } }, icon('send'), 'Post');
    const composer = el('section', { class: 'card reveal chatter' },
      el('h3', {}, icon('users'), 'Post to the whole team'), text,
      el('div', { class: 'chatter-row' }, pinner.row, el('span', { class: 'spacer', style: 'flex:1' }), btn));
    return el('div', { class: 'feed-page' }, composer, pinnedCard, el('section', { class: 'card reveal' }, el('div', { class: 'card-head' }, el('h2', { class: 'card-title' }, 'All notes')), restBox));
  }

  // ---------------------------------------------------------------------
  // Team chat: 1:1 conversations, each message can pin a job / deal / homeowner / task
  // ---------------------------------------------------------------------
  const PIN_KEYS = ['projects', 'deals', 'companies', 'indi_projects'];
  const chatState = { with: null, pin: null };
  const threadOf = (m, me) => (m.payload.from_user === me ? m.payload.to_user : m.payload.from_user);
  async function loadChat() { await Promise.all([load(byKey.messages), load(byKey.users)]); return cache.messages || []; }
  function unreadChat() {
    const me = settings.meId;
    return me ? (cache.messages || []).filter((m) => m.payload.to_user === me && !m.payload.seen).length : 0;
  }
  async function updateChatBadge() {
    const b = $('#chatFab');
    if (!b || !byKey.messages) return;
    try { await load(byKey.messages); } catch (_) { return; }
    const n = unreadChat();
    const old = b.querySelector('.bell-n'); if (old) old.remove();
    if (n) b.append(el('span', { class: 'bell-n' }, n > 99 ? '99+' : n));
    b.setAttribute('aria-label', n ? `Team chat, ${n} unread` : 'Team chat');
  }
  function pinCard(pin, onRemove) {
    if (!pin || !pin.key) return null;
    const spec = byKey[pin.key];
    return el('div', { class: 'pin-card' },
      el('a', { href: `#/t/${pin.key}?open=${pin.id}`, onclick: () => closeDrawer() },
        el('span', { class: 'pin-ic' }, icon(spec ? spec.icon : 'pin')),
        el('span', { class: 'pin-txt' }, el('small', {}, spec ? humanize(spec.single) : 'Record'), el('b', {}, pin.label))),
      onRemove ? el('button', { class: 'icon-btn sm', type: 'button', 'aria-label': 'Remove pin', onclick: onRemove }, icon('x')) : null);
  }

  async function openChat(withId, pin) {
    if (!byKey.messages) return;
    await loadChat();
    if (withId !== undefined) chatState.with = withId;
    if (pin !== undefined) chatState.pin = pin;
    await ensureMe();
    if (!settings.meId) return chatWhoAmI();
    return chatState.with ? chatThread() : chatList();
  }
  function chatHead(title, eyebrow, backFn, extra) {
    return el('div', { class: 'drawer-head chat-head' },
      backFn ? el('button', { class: 'icon-btn', onclick: backFn, 'aria-label': 'Back to conversations' }, icon('back')) : null,
      el('div', { style: 'min-width:0' }, el('div', { class: 'eyebrow' }, eyebrow), el('h2', { id: 'drawerTitle' }, title)),
      extra || null,
      el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x')));
  }
  function chatWhoAmI() {
    const users = (cache.users || []).filter((u) => u.payload.active !== false);
    showDrawer(chatHead('Team chat', 'Messages'),
      el('div', { class: 'drawer-body' },
        el('p', { class: 'hint wide', style: 'margin:0' }, 'Who are you? Chat needs to know who’s sending.'),
        el('div', { class: 'people wide' }, users.map((u) => el('button', { class: 'person', type: 'button', onclick: () => { settings.meId = u.id; settings.meName = u.payload.name || ''; settings.name = (u.payload.name || '').split(' ')[0]; saveSettings(); openChat(); render(); } },
          el('span', { class: 'post-av' }, initials(u.payload.name || '?')), el('span', {}, el('b', {}, u.payload.name || 'Teammate'), el('small', {}, u.payload.role || '')))))));
  }
  function chatList() {
    const me = settings.meId;
    const msgs = (cache.messages || []).filter((m) => m.payload.from_user === me || m.payload.to_user === me);
    const threads = new Map();
    msgs.forEach((m) => { const k = threadOf(m, me); const t = threads.get(k); if (!t || t.date_created < m.date_created) threads.set(k, m); });
    const convo = [...threads.entries()].sort((a, b) => (a[1].date_created < b[1].date_created ? 1 : -1));
    const users = (cache.users || []).filter((u) => u.id !== me && u.payload.active !== false);
    const search = el('input', { class: 'input', type: 'search', placeholder: 'Find a teammate', 'aria-label': 'Find a teammate' });
    const picker = el('div', { class: 'people wide' });
    const drawPeople = () => {
      const q = search.value.trim().toLowerCase();
      picker.replaceChildren(...users.filter((u) => !q || (u.payload.name || '').toLowerCase().includes(q) || (u.payload.role || '').toLowerCase().includes(q))
        .map((u) => el('button', { class: 'person', type: 'button', onclick: () => openChat(u.id) },
          el('span', { class: 'post-av' }, initials(u.payload.name || '?')), el('span', {}, el('b', {}, u.payload.name || 'Teammate'), el('small', {}, u.payload.role || '')))));
    };
    search.addEventListener('input', drawPeople);
    drawPeople();
    showDrawer(chatHead('Team chat', settings.name ? `Signed in as ${settings.name}` : 'Messages'),
      el('div', { class: 'drawer-body' },
        chatState.pin ? el('div', { class: 'wide' }, el('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, 'Will be pinned to your next message'), pinCard(chatState.pin, () => { chatState.pin = null; chatList(); })) : null,
        convo.length ? el('div', { class: 'wide' }, el('div', { class: 'eyebrow', style: 'margin-bottom:8px' }, 'Conversations'),
          el('div', { class: 'convos' }, convo.map(([uid, last]) => {
            const unread = msgs.filter((m) => m.payload.from_user === uid && m.payload.to_user === me && !m.payload.seen).length;
            return el('button', { class: 'convo' + (unread ? ' unread' : ''), type: 'button', onclick: () => openChat(uid) },
              el('span', { class: 'post-av' }, initials(userName(uid) || '?')),
              el('span', { class: 'convo-main' }, el('b', {}, userName(uid) || 'Teammate'),
                el('small', {}, (last.payload.from_user === me ? 'You: ' : '') + (last.payload.pin_label && !last.payload.body ? '📌 ' + last.payload.pin_label : last.payload.body || ''))),
              el('span', { class: 'convo-side' }, el('time', {}, fmtWhen(new Date(last.date_created))), unread ? el('span', { class: 'convo-n' }, unread) : null));
          }))) : null,
        el('div', { class: 'wide' }, el('div', { class: 'eyebrow', style: 'margin-bottom:8px' }, 'Start a conversation'), el('div', { class: 'search', style: 'margin-bottom:8px' }, icon('search'), search)),
        picker));
  }
  async function chatThread() {
    const me = settings.meId, them = chatState.with;
    const u = userRec(them);
    const msgs = (cache.messages || []).filter((m) => (m.payload.from_user === me && m.payload.to_user === them) || (m.payload.from_user === them && m.payload.to_user === me))
      .sort((a, b) => (a.date_created < b.date_created ? -1 : 1));
    // mark theirs as read
    for (const m of msgs) if (m.payload.to_user === me && !m.payload.seen) {
      m.payload.seen = true;
      api('POST', '/api/vault/update-record', { registry_id: byKey.messages.reg.id, record_id: m.id, payload: { seen: true } }).catch(() => {});
    }
    updateChatBadge();
    const pins = [];
    msgs.forEach((m) => { if (m.payload.pin_id && !pins.some((x) => x.id === m.payload.pin_id)) pins.unshift({ key: m.payload.pin_key, id: m.payload.pin_id, label: m.payload.pin_label }); });
    const bubble = (m) => el('div', { class: 'bubble ' + (m.payload.from_user === me ? 'mine' : 'theirs') },
      m.payload.pin_id ? pinCard({ key: m.payload.pin_key, id: m.payload.pin_id, label: m.payload.pin_label }) : null,
      m.payload.body ? el('p', {}, m.payload.body) : null,
      el('time', { title: new Date(m.date_created).toLocaleString() }, fmtWhen(new Date(m.date_created))));
    const log = el('div', { class: 'chat-log' }, msgs.length ? msgs.map(bubble) : el('p', { class: 'hint', style: 'text-align:center' }, `Say hi to ${(u && u.payload.name || 'your teammate').split(' ')[0]}. Pin a job so you’re both looking at the same thing.`));
    const pinSlot = el('div', { class: 'pin-slot' });
    const drawPin = () => pinSlot.replaceChildren(...(chatState.pin ? [pinCard(chatState.pin, () => { chatState.pin = null; drawPin(); })] : []));
    drawPin();
    const text = el('textarea', { class: 'textarea chat-input', rows: 1, placeholder: 'Message…', 'aria-label': 'Message' });
    text.addEventListener('input', () => { text.style.height = 'auto'; text.style.height = Math.min(text.scrollHeight, 140) + 'px'; });
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); } });
    const sendBtn = el('button', { class: 'btn primary chat-send', type: 'button', 'aria-label': 'Send', onclick: send }, icon('send'));
    const pinBtn = el('button', { class: 'btn chat-pin', type: 'button', 'aria-label': 'Pin a job or task', title: 'Pin a job or task', onclick: () => pinPicker((pin) => { chatState.pin = pin; drawPin(); text.focus(); }) }, icon('pin'));
    async function send() {
      const body = text.value.trim();
      if (!body && !chatState.pin) { text.focus(); return; }
      sendBtn.disabled = true;
      const payload = { from_user: me, to_user: them, seen: false };
      if (body) payload.body = body;
      if (chatState.pin) Object.assign(payload, { pin_key: chatState.pin.key, pin_id: chatState.pin.id, pin_label: chatState.pin.label });
      try {
        const r = await api('POST', '/api/vault/insert-record', { registry_id: byKey.messages.reg.id, payload });
        (cache.messages = cache.messages || []).unshift(r.record);
        const hint = log.querySelector('.hint'); if (hint) hint.remove();
        log.append(bubble(r.record));
        log.scrollTop = log.scrollHeight;
        text.value = ''; text.style.height = 'auto';
        chatState.pin = null; drawPin();
      } catch (e) { toast(e.message, true); }
      sendBtn.disabled = false;
      text.focus();
    }
    const phone = u && String(u.payload.phone || '').replace(/[^\d+]/g, '');
    showDrawer(
      chatHead(u ? u.payload.name || 'Teammate' : 'Teammate', u && u.payload.role ? u.payload.role : 'Conversation', () => { chatState.with = null; chatList(); },
        phone ? el('a', { class: 'icon-btn', href: `tel:${phone}`, 'aria-label': `Call ${u.payload.name}` }, icon('phone')) : null),
      el('div', { class: 'drawer-body chat-body' },
        pins.length ? el('div', { class: 'wide pinned-bar' }, el('span', { class: 'eyebrow' }, icon('pin'), 'Pinned in this chat'), el('div', { class: 'pins-row' }, pins.slice(0, 6).map((x) => pinCard(x)))) : null,
        el('div', { class: 'wide' }, log)),
      el('div', { class: 'drawer-foot chat-foot' }, pinSlot, el('div', { class: 'chat-compose' }, pinBtn, text, sendBtn)));
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; const d = $('#drawer'); d.scrollTop = d.scrollHeight; text.focus({ preventScroll: true }); });
  }
  async function pinPicker(onPick) {
    const keys = PIN_KEYS.filter((k) => byKey[k]);
    await Promise.all(keys.map((k) => load(byKey[k])));
    const search = el('input', { class: 'input', type: 'search', placeholder: 'Search jobs, deals, homeowners, tasks', 'aria-label': 'Search to pin' });
    const results = el('div', { class: 'pin-results' });
    let tab = 'all';
    const tabs = el('div', { class: 'chips', role: 'group' }, ['all', ...keys].map((k) => el('button', { class: 'chip', type: 'button', 'data-k': k, 'aria-pressed': String(k === tab),
      onclick: () => { tab = k; [...tabs.children].forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.k === k))); draw(); } }, k === 'all' ? 'All' : labelOf(byKey[k]))));
    function draw() {
      const q = search.value.trim().toLowerCase();
      let rows = [];
      for (const k of tab === 'all' ? keys : [tab]) {
        const spec = byKey[k];
        let recs = cache[k] || [];
        if (q) recs = recs.filter((r) => searchText(spec, r).includes(q));
        rows.push(...recs.map((r) => ({ k, spec, r })));
      }
      rows.sort((a, b) => (a.r.date_modified < b.r.date_modified ? 1 : -1));
      results.replaceChildren(...(rows.length ? rows.slice(0, 40).map(({ k, spec, r }) => {
        const st = r.payload.status || r.payload.stage;
        return el('button', { class: 'result', type: 'button', onclick: () => { pop.remove(); onPick({ key: k, id: r.id, label: titleOf(spec, r) }); } },
          icon(spec.icon), el('span', { class: 'pin-r-t' }, titleOf(spec, r), tab === 'all' ? el('small', {}, humanize(spec.single)) : null), st ? pill(st) : null);
      }) : [el('p', { class: 'hint' }, 'Nothing matches.')]));
    }
    search.addEventListener('input', draw);
    draw();
    const pop = el('div', { class: 'pin-pop', role: 'dialog', 'aria-label': 'Pin a record' },
      el('div', { class: 'pin-pop-head' }, el('b', {}, icon('pin'), 'Pin to message'), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: () => pop.remove() }, icon('x'))),
      el('div', { class: 'search' }, icon('search'), search), tabs, results);
    $('#drawer').append(pop);
    search.focus();
  }

  // One-tap disposition (SalesRabbit-style): logs an activity, then nudges the deal forward
  // ---------------------------------------------------------------------
  // Follow-up autopilot: day 7 / 15 / 30 text + email sequence per open deal
  // The schedule, contact lookup and messages are automatic. Sending happens from the
  // rep's phone (one tap) until a server + texting/email accounts are connected.
  // ---------------------------------------------------------------------
  const AP_DEFAULT = {
    on: true, days: [7, 15, 30], stages: ['Follow-up', 'Appointment set', 'Proposal sent'],
    steps: [
      { sms: 'Hi {first_name}, it’s {rep_first} with {company}. Just checking in on your solar proposal. Any questions I can answer? Reply STOP to opt out.',
        subject: 'Checking in on your solar proposal', email: 'Hi {first_name},\n\nJust checking in on the solar proposal for your home. Happy to answer any questions or walk through the numbers again.\n\n{rep_name}\n{company}\n{rep_phone}\n\nIf you’d rather not hear from us, just reply and let me know.' },
      { sms: 'Hi {first_name}, {rep_first} here from {company}. Want me to walk through your numbers again? Reply here or call me anytime. Reply STOP to opt out.',
        subject: 'Your solar numbers', email: 'Hi {first_name},\n\nI’d be glad to go over your proposal again, answer questions, or adjust anything that doesn’t fit. What day works for a quick call?\n\n{rep_name}\n{company}\n{rep_phone}\n\nIf you’d rather not hear from us, just reply and let me know.' },
      { sms: 'Hi {first_name}, it’s {rep_first} with {company}. Wanted to make sure you have everything you need about going solar. Still interested? Reply STOP to opt out.',
        subject: 'Still thinking about solar?', email: 'Hi {first_name},\n\nI don’t want to keep filling your inbox, so this is my last check-in for now. If going solar is still on your mind, reply and I’ll pick it right back up.\n\n{rep_name}\n{company}\n{rep_phone}' }
    ]
  };
  const apCfg = () => {
    const c = Object.assign({}, AP_DEFAULT, settings.autopilot || {});
    c.days = (Array.isArray(c.days) && c.days.length === 3 ? c.days : AP_DEFAULT.days).map((d, i) => Math.max(1, Number(d) || AP_DEFAULT.days[i]));
    c.steps = AP_DEFAULT.steps.map((d, i) => Object.assign({}, d, (c.steps || [])[i] || {}));
    return c;
  };
  const addDays = (iso, n) => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); const x = new Date(y, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);
  function apContact(deal) {
    const p = deal.payload;
    const c = p.contact && (cache.contacts || []).find((r) => r.id === p.contact);
    const h = p.company && (cache.companies || []).find((r) => r.id === p.company);
    const household = h ? String(h.payload.company_name || '').replace(/\s+Household$/i, '') : '';
    const first = (c && c.payload.first_name) || household.split(' ')[0] || 'there';
    return {
      first, last: (c && c.payload.last_name) || household.split(' ').slice(1).join(' '),
      phone: (c && c.payload.phone) || (h && h.payload.phone) || '',
      email: (c && c.payload.email) || '',
      consent: !!(c && c.payload.text_consent), optedOut: !!(c && c.payload.opted_out)
    };
  }
  function apPlan(deal, cfg = apCfg()) {
    const p = deal.payload;
    const start = String(p.seq_start || deal.date_created || todayISO()).slice(0, 10);
    const sent = Math.max(0, Math.min(3, Number(p.seq_step) || 0));
    const dates = cfg.days.map((d) => addDays(start, d));
    const eligible = cfg.on && !DONE.has(p.stage) && cfg.stages.includes(p.stage) && !['Paused', 'Done', 'Opted out'].includes(p.seq_status);
    return { start, sent, dates, eligible, next: sent < 3 ? sent : -1, dueOn: sent < 3 ? dates[sent] : null };
  }
  function apFill(tpl, deal, who) {
    const p = deal.payload;
    const rep = userRec(p.owner) || userRec(settings.meId);
    const repName = rep ? rep.payload.name || '' : (settings.name || '');
    const company = settings.workspace && !/^(test )?workspace$/i.test(settings.workspace) ? settings.workspace : 'our team';
    const map = { first_name: who.first, last_name: who.last, rep_name: repName, rep_first: repName.split(' ')[0] || 'your rep', rep_phone: rep ? rep.payload.phone || '' : '', company, kw: p.system_size_kw ? `${p.system_size_kw} kW` : '' };
    return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m)).replace(/\n{3,}/g, '\n\n').trim();
  }
  function apDue() {
    const cfg = apCfg();
    const today = todayISO();
    return (cache.deals || []).map((d) => ({ d, plan: apPlan(d, cfg) }))
      .filter(({ d, plan }) => plan.eligible && plan.next >= 0 && plan.dueOn <= today && !apContact(d).optedOut)
      .sort((a, b) => (a.plan.dueOn < b.plan.dueOn ? -1 : 1));
  }
  async function apLoad() { await Promise.all([load(byKey.deals), load(byKey.contacts), load(byKey.companies), load(byKey.users), load(byKey.projects)]); }
  async function apAdvance(deal, channel, step) {
    const cfg = apCfg();
    const p = deal.payload;
    const patch = {};
    if ((Number(p.seq_step) || 0) <= step) { patch.seq_step = step + 1; if (step + 1 >= 3) patch.seq_status = 'Done'; }
    if (!p.seq_start) patch.seq_start = apPlan(deal, cfg).start;
    if (!p.seq_status && !patch.seq_status) patch.seq_status = 'Active';
    if (Object.keys(patch).length) {
      await api('POST', '/api/vault/update-record', { registry_id: byKey.deals.reg.id, record_id: deal.id, payload: patch });
      Object.assign(p, patch);
    }
    try {
      await api('POST', '/api/vault/insert-record', { registry_id: byKey.activities.reg.id, payload: Object.assign(
        { subject: `Day ${cfg.days[step]} auto follow-up — ${channel}`, type: channel, outcome: 'Note', deal: deal.id, date: todayISO() },
        p.company ? { company: p.company } : {}, p.contact ? { contact: p.contact } : {}, settings.meId || p.owner ? { rep: settings.meId || p.owner } : {}) });
      delete cache.activities;
    } catch (_) {}
  }
  function apCard(deal, plan, onDone) {
    const cfg = apCfg();
    const who = apContact(deal);
    const step = plan.next;
    const tpl = cfg.steps[step];
    const sms = apFill(tpl.sms, deal, who), subject = apFill(tpl.subject, deal, who), body = apFill(tpl.email, deal, who);
    const late = daysBetween(plan.dueOn, todayISO());
    const phone = String(who.phone).replace(/[^\d+]/g, '');
    const used = new Set();
    const mark = async (ch, btn) => {
      used.add(ch); btn.classList.add('done'); btn.querySelector('span').textContent = ch === 'Text' ? 'Text opened' : 'Email opened';
      await apAdvance(deal, ch, step);
      if (onDone) onDone(deal);
    };
    const textBtn = phone && who.consent
      ? el('a', { class: 'btn primary sm', href: `sms:${phone}?&body=${encodeURIComponent(sms)}`, onclick: (e) => mark('Text', e.currentTarget) }, icon('chat'), el('span', {}, 'Send text'))
      : el('span', { class: 'ap-off', title: phone ? 'Mark “OK to text” on the contact once you have consent' : 'No phone on file' }, icon('chat'), phone ? 'No text consent' : 'No phone');
    const emailBtn = who.email
      ? el('a', { class: 'btn sm', href: `mailto:${who.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, onclick: (e) => mark('Email', e.currentTarget) }, icon('mail2'), el('span', {}, 'Send email'))
      : el('span', { class: 'ap-off' }, icon('mail2'), 'No email');
    return el('article', { class: 'ap-card' },
      el('div', { class: 'ap-top' },
        el('span', { class: 'ap-day' }, `Day ${cfg.days[step]}`),
        el('div', { class: 'ap-who' }, el('b', {}, titleOf(byKey.deals, deal)), el('small', {}, [who.first + (who.last ? ' ' + who.last : ''), deal.payload.stage].filter(Boolean).join(' · '))),
        el('span', { class: 'kdue ' + (late > 0 ? 'late' : 'today') }, late > 0 ? `${late}d late` : 'Due today')),
      el('details', { class: 'ap-preview' }, el('summary', {}, 'Preview message'), el('p', {}, sms), el('p', { class: 'ap-email' }, el('b', {}, subject), el('br'), body)),
      el('div', { class: 'ap-actions' }, textBtn, emailBtn,
        el('button', { class: 'btn ghost sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; await apAdvance(deal, 'Note', step); if (onDone) onDone(deal); toast('Skipped this follow-up'); } }, 'Skip'),
        el('a', { class: 'btn ghost sm', href: `#/t/deals?open=${deal.id}`, onclick: closeDrawer }, 'Open deal')));
  }
  async function openAutopilot() {
    await apLoad();
    const cfg = apCfg();
    const due = apDue();
    const list = el('div', { class: 'ap-list wide' });
    const msList = el('div', { class: 'ap-list wide' });
    const draw = () => {
      const again = () => setTimeout(() => { draw(); updateApBadge(); }, 400);
      const ups = msDue();
      msList.replaceChildren(...(ups.length ? ups.slice(0, 60).map((pr) => msCard(pr, again)) : [el('p', { class: 'hint', style: 'margin:0' }, 'No project updates waiting.')]));
      const now = apDue();
      list.replaceChildren(...(now.length ? now.slice(0, 60).map(({ d, plan }) => apCard(d, plan, again))
        : [el('p', { class: 'hint', style: 'margin:0' }, 'No sales follow-ups due right now.')]));
    };
    draw();
    const active = (cache.deals || []).filter((d) => apPlan(d, cfg).eligible && apPlan(d, cfg).next >= 0).length;
    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, cfg.on ? `Autopilot on · ${active} deals in sequence` : 'Autopilot off'), el('h2', { id: 'drawerTitle' }, 'Autopilot')),
        el('button', { class: 'btn sm', type: 'button', onclick: openApSettings }, icon('sliders'), 'Set up'),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' },
        el('h3', { class: 'ap-sec wide' }, icon('sun'), 'Project updates', el('small', {}, 'Main steps after Sold')), msList,
        el('h3', { class: 'ap-sec wide' }, icon('target'), 'Sales follow-ups', el('small', {}, `Day ${cfg.days.join(' / ')}`)),
        el('p', { class: 'hint wide', style: 'margin:0' }, `Open deals in ${cfg.stages.join(', ')} get a text and email on day ${cfg.days.join(', ')}. It stops when the deal is sold or lost, or the customer opts out. Every card has the customer’s number, email and message filled in.`),
        list));
    void due;
  }
  function openApSettings() {
    const cfg = apCfg();
    const on = el('input', { type: 'checkbox', id: 'ap_on', checked: cfg.on });
    const dayIn = cfg.days.map((d, i) => el('input', { class: 'input', type: 'number', min: 1, max: 365, value: d, 'aria-label': `Follow-up ${i + 1} day` }));
    const stageBoxes = STAGE_LIST.filter((x) => !['Sold', 'Lost'].includes(x)).map((st) => {
      const b = el('input', { type: 'checkbox', value: st, checked: cfg.stages.includes(st) });
      return { b, row: el('label', { class: 'ap-stage' }, b, st) };
    });
    const tplIn = cfg.steps.map((t) => ({
      sms: el('textarea', { class: 'textarea', rows: 3, value: t.sms }),
      subject: el('input', { class: 'input', value: t.subject }),
      email: el('textarea', { class: 'textarea', rows: 6, value: t.email })
    }));
    const ms = msCfg();
    const msOn = el('input', { type: 'checkbox', id: 'ms_on', checked: ms.on });
    const msBoxes = INSTALL_STEPS.filter((st) => MS_TPL[st]).map((st) => { const b = el('input', { type: 'checkbox', value: st, checked: ms.steps.includes(st) }); return { b, row: el('label', { class: 'ap-stage' }, b, MS_TPL[st].label) }; });
    const msIn = Object.fromEntries(Object.keys(MS_TPL).map((k) => [k, { sms: el('textarea', { class: 'textarea', rows: 3, value: ms.tpl[k].sms }), subject: el('input', { class: 'input', value: ms.tpl[k].subject }), email: el('textarea', { class: 'textarea', rows: 5, value: ms.tpl[k].email }) }]));
    const save = () => {
      settings.milestones = { on: msOn.checked, steps: msBoxes.filter((x) => x.b.checked).map((x) => x.b.value),
        tpl: Object.fromEntries(Object.entries(msIn).map(([k, t]) => [k, { sms: t.sms.value, subject: t.subject.value, email: t.email.value }])) };
      settings.autopilot = {
        on: on.checked, days: dayIn.map((x) => Number(x.value) || 7),
        stages: stageBoxes.filter((x) => x.b.checked).map((x) => x.b.value),
        steps: tplIn.map((t) => ({ sms: t.sms.value, subject: t.subject.value, email: t.email.value }))
      };
      saveSettings();
      toast('Autopilot saved');
      openAutopilot();
      updateApBadge();
    };
    showDrawer(
      el('div', { class: 'drawer-head' }, el('div', {}, el('div', { class: 'eyebrow' }, 'Autopilot'), el('h2', { id: 'drawerTitle' }, 'Set up autopilot')),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' },
        el('h3', { class: 'ap-sec wide' }, icon('target'), 'Sales follow-ups'),
        el('div', { class: 'field set-row wide' }, el('label', { for: 'ap_on', style: 'font-weight:600' }, 'Day 7 / 15 / 30 follow-ups on'), el('label', { class: 'toggle' }, on, el('i'))),
        el('div', { class: 'field wide' }, el('span', {}, 'Send follow-ups on these days after the sequence starts'), el('div', { class: 'ap-days' }, dayIn.map((x, i) => el('label', {}, el('small', {}, `Follow-up ${i + 1}`), x)))),
        el('div', { class: 'field wide' }, el('span', {}, 'Run for deals in these stages'), el('div', { class: 'ap-stages' }, stageBoxes.map((x) => x.row))),
        el('p', { class: 'hint wide', style: 'margin:0' }, 'Fill-ins: {first_name} {last_name} {rep_name} {rep_first} {rep_phone} {company} {kw}'),
        tplIn.map((t, i) => el('details', { class: 'fsec wide', open: i === 0 ? true : null },
          el('summary', {}, el('span', { class: 'fsec-ic' }, el('b', { style: 'font-size:12px' }, String(i + 1))), el('b', {}, `Follow-up ${i + 1} messages`)),
          el('div', { class: 'fsec-body' },
            el('label', { class: 'field wide' }, el('span', {}, 'Text message'), t.sms),
            el('label', { class: 'field wide' }, el('span', {}, 'Email subject'), t.subject),
            el('label', { class: 'field wide' }, el('span', {}, 'Email'), t.email)))),
        el('h3', { class: 'ap-sec wide' }, icon('sun'), 'Project updates to the customer'),
        el('div', { class: 'field set-row wide' }, el('label', { for: 'ms_on', style: 'font-weight:600' }, 'Send updates at main project steps'), el('label', { class: 'toggle' }, msOn, el('i'))),
        el('div', { class: 'field wide' }, el('span', {}, 'Main steps (internal steps like PIR, MPU planning, utility pre-check and M3 never message the customer)'), el('div', { class: 'ap-stages' }, msBoxes.map((x) => x.row))),
        Object.entries(msIn).map(([k, t]) => el('details', { class: 'fsec wide' },
          el('summary', {}, el('span', { class: 'fsec-ic' }, icon('send')), el('b', {}, MS_TPL[k].label)),
          el('div', { class: 'fsec-body' }, el('label', { class: 'field wide' }, el('span', {}, 'Text message'), t.sms),
            el('label', { class: 'field wide' }, el('span', {}, 'Email subject'), t.subject), el('label', { class: 'field wide' }, el('span', {}, 'Email'), t.email)))),
        el('div', { class: 'ap-legal wide' }, icon('flag'), el('div', {},
          el('b', {}, 'Texting rules'), el('p', {}, 'Only text customers who agreed to receive texts (turn on “OK to text” on their contact). Honor any opt-out right away: replies like STOP, QUIT, END, CANCEL or UNSUBSCRIBE, or “Opted out” on the contact, stop the sequence. Rules vary by state; check with your attorney before sending marketing texts.')))),
      el('div', { class: 'drawer-foot' }, el('button', { class: 'btn ghost', onclick: () => { settings.autopilot = undefined; settings.milestones = undefined; saveSettings(); openApSettings(); } }, 'Reset messages'), el('span', { class: 'spacer' }),
        el('button', { class: 'btn ghost', onclick: openAutopilot }, 'Cancel'), el('button', { class: 'btn primary', onclick: save }, 'Save')));
  }
  function apTimeline(deal) {
    const cfg = apCfg();
    const plan = apPlan(deal, cfg);
    const who = apContact(deal);
    const today = todayISO();
    const status = !cfg.on ? 'Autopilot is off' : DONE.has(deal.payload.stage) ? 'Stopped — deal closed' : who.optedOut || deal.payload.seq_status === 'Opted out' ? 'Stopped — customer opted out'
      : deal.payload.seq_status === 'Paused' ? 'Paused' : !cfg.stages.includes(deal.payload.stage) ? `Starts when the deal reaches ${cfg.stages[0]}` : plan.next < 0 ? 'All 3 follow-ups sent' : 'Running';
    const btn = (label, patch) => el('button', { class: 'btn ghost sm', type: 'button', onclick: async (e) => {
      e.currentTarget.disabled = true;
      await api('POST', '/api/vault/update-record', { registry_id: byKey.deals.reg.id, record_id: deal.id, payload: patch });
      Object.assign(deal.payload, patch); delete cache.deals; toast('Updated'); closeDrawer(); render(); updateApBadge();
    } }, label);
    return el('div', { class: 'ap-timeline wide' },
      el('h3', {}, icon('send'), 'Auto follow-up', el('small', {}, status)),
      el('ol', {}, cfg.days.map((d, i) => {
        const date = plan.dates[i];
        const st = i < plan.sent ? 'sent' : plan.eligible && date <= today && i === plan.next ? 'due' : 'upcoming';
        return el('li', { class: st }, el('span', { class: 'ap-dot' }, st === 'sent' ? icon('check') : String(i + 1)),
          el('b', {}, `Day ${d}`), el('small', {}, `${st === 'sent' ? 'Sent' : st === 'due' ? 'Due' : 'Scheduled'} · ${fmtDate(date)}`));
      })),
      el('div', { class: 'ap-row' },
        el('span', { class: 'hint', style: 'padding:0' }, [who.phone ? `📱 ${who.phone}${who.consent ? '' : ' (no text consent)'}` : 'No phone', who.email ? `✉️ ${who.email}` : 'No email'].join('  ·  ')),
        deal.payload.seq_status === 'Paused' ? btn('Resume', { seq_status: 'Active' }) : plan.next >= 0 && plan.eligible ? btn('Pause', { seq_status: 'Paused' }) : null,
        btn('Restart', { seq_status: 'Active', seq_step: 0, seq_start: today })));
  }
  // ---------- Customer milestone updates (projects) ----------
  const msCfg = () => {
    const c = settings.milestones || {};
    const steps = Array.isArray(c.steps) ? c.steps.filter((x) => MS_TPL[x]) : MAIN_DEFAULT.slice();
    const tpl = {};
    Object.keys(MS_TPL).forEach((k) => { tpl[k] = Object.assign({}, MS_TPL[k], (c.tpl || {})[k] || {}); });
    return { on: c.on !== false, steps, tpl };
  };
  function projectContact(proj) {
    const p = proj.payload;
    const deal = p.deal && (cache.deals || []).find((d) => d.id === p.deal);
    if (deal) return { who: apContact(deal), deal };
    const c = (cache.contacts || []).find((x) => p.company && x.payload.company === p.company);
    const h = p.company && (cache.companies || []).find((x) => x.id === p.company);
    const household = h ? String(h.payload.company_name || '').replace(/\s+Household$/i, '') : String(p.project_title || '').split(' — ')[0];
    return { who: { first: (c && c.payload.first_name) || household.split(' ')[0] || 'there', last: (c && c.payload.last_name) || '',
      phone: (c && c.payload.phone) || (h && h.payload.phone) || '', email: (c && c.payload.email) || '', consent: !!(c && c.payload.text_consent), optedOut: !!(c && c.payload.opted_out) }, deal: null };
  }
  function msDue() {
    const cfg = msCfg();
    if (!cfg.on) return [];
    return (cache.projects || []).filter((r) => r.payload.cust_pending && cfg.steps.includes(r.payload.cust_pending) && !projectContact(r).who.optedOut)
      .sort((a, b) => (a.date_modified < b.date_modified ? 1 : -1));
  }
  async function msDone(proj, channel) {
    const p = proj.payload;
    const step = p.cust_pending;
    const sent = String(p.cust_notified || '').split('|').filter(Boolean);
    if (!sent.includes(step)) sent.push(step);
    const patch = { cust_pending: null, cust_notified: sent.join('|') };
    await api('POST', '/api/vault/update-record', { registry_id: byKey.projects.reg.id, record_id: proj.id, payload: patch });
    delete p.cust_pending; p.cust_notified = patch.cust_notified;
    if (channel !== 'Skip') {
      try {
        await api('POST', '/api/vault/insert-record', { registry_id: byKey.activities.reg.id, payload: Object.assign(
          { subject: `Customer update: ${MS_TPL[step] ? MS_TPL[step].label : step} — ${channel}`, type: channel, outcome: 'Note', date: todayISO() },
          p.deal ? { deal: p.deal } : {}, p.company ? { company: p.company } : {}, settings.meId ? { rep: settings.meId } : {}) });
        delete cache.activities;
      } catch (_) {}
    }
  }
  function msCard(proj, onDone) {
    const cfg = msCfg();
    const step = proj.payload.cust_pending;
    const t = cfg.tpl[step];
    const { who, deal } = projectContact(proj);
    const fake = deal || { payload: { owner: proj.payload.assigned_to } };
    const sms = apFill(t.sms, fake, who), subject = apFill(t.subject, fake, who), body = apFill(t.email, fake, who);
    const phone = String(who.phone).replace(/[^\d+]/g, '');
    let done = false;
    const mark = async (ch, btn) => { btn.classList.add('done'); btn.querySelector('span').textContent = ch === 'Text' ? 'Text opened' : 'Email opened'; if (!done) { done = true; await msDone(proj, ch); if (onDone) onDone(); } };
    return el('article', { class: 'ap-card' },
      el('div', { class: 'ap-top' },
        el('span', { class: 'ap-day ms' }, t.label),
        el('div', { class: 'ap-who' }, el('b', {}, titleOf(byKey.projects, proj)), el('small', {}, [who.first + (who.last ? ' ' + who.last : ''), step].join(' · '))),
        el('span', { class: 'kdue today' }, 'Ready')),
      el('details', { class: 'ap-preview' }, el('summary', {}, 'Preview message'), el('p', {}, sms), el('p', { class: 'ap-email' }, el('b', {}, subject), el('br'), body)),
      el('div', { class: 'ap-actions' },
        phone && who.consent ? el('a', { class: 'btn primary sm', href: `sms:${phone}?&body=${encodeURIComponent(sms)}`, onclick: (e) => mark('Text', e.currentTarget) }, icon('chat'), el('span', {}, 'Send text'))
          : el('span', { class: 'ap-off' }, icon('chat'), phone ? 'No text consent' : 'No phone'),
        who.email ? el('a', { class: 'btn sm', href: `mailto:${who.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, onclick: (e) => mark('Email', e.currentTarget) }, icon('mail2'), el('span', {}, 'Send email'))
          : el('span', { class: 'ap-off' }, icon('mail2'), 'No email'),
        el('button', { class: 'btn ghost sm', type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; await msDone(proj, 'Skip'); if (onDone) onDone(); toast('Skipped this update'); } }, 'Skip'),
        el('a', { class: 'btn ghost sm', href: `#/t/projects?open=${proj.id}`, onclick: closeDrawer }, 'Open project')));
  }
  function msTimeline(proj) {
    const cfg = msCfg();
    const sent = String(proj.payload.cust_notified || '').split('|');
    const at = INSTALL_STEPS.indexOf(proj.payload.status);
    return el('div', { class: 'ap-timeline wide ms-timeline' },
      el('h3', {}, icon('send'), 'Customer updates', el('small', {}, cfg.on ? 'Main steps only' : 'Off')),
      el('div', { class: 'ms-steps' }, cfg.steps.map((st) => {
        const state = proj.payload.cust_pending === st ? 'due' : sent.includes(st) ? 'sent' : INSTALL_STEPS.indexOf(st) < at ? 'missed' : 'upcoming';
        return el('span', { class: 'ms-step ' + state, title: state === 'sent' ? 'Sent' : state === 'due' ? 'Ready to send' : state === 'missed' ? 'Passed without an update' : 'Upcoming' },
          state === 'sent' ? icon('check') : null, cfg.tpl[st].label);
      })));
  }

  async function updateApBadge() {
    const t = $('#apTile');
    if (!t) return;
    try { await apLoad(); } catch (_) { return; }
    const n = apDue().length + msDue().length;
    const art = t.querySelector('.qart');
    const old = art.querySelector('.qbadge'); if (old) old.remove();
    if (n) art.append(el('span', { class: 'qbadge' }, n > 99 ? '99+' : n));
    const sub = t.querySelector('.qsub'); if (sub) sub.textContent = n ? `${n} ready to send` : 'All caught up';
  }

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
        if (to) { patch.stage = to; patch.stage_since = todayISO(); }
        if (to === 'Sold' || to === 'Lost') { patch.close_date = todayISO(); patch.seq_status = 'Done'; }
        else if (to && apCfg().stages.includes(to) && !p.seq_start) Object.assign(patch, { seq_start: todayISO(), seq_status: 'Active', seq_step: 0 });
        if (outcome === 'Not interested') patch.seq_status = 'Done';
        if (fu.value && fu.value !== String(p.follow_up || '').slice(0, 10)) patch.follow_up = fu.value;
        if (Object.keys(patch).length) await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload: patch });
        delete cache.activities; delete cache[spec.key];
        const made = to === 'Sold' ? await ensureInstall(Object.assign({}, rec, { payload: Object.assign({}, p, patch) })) : false;
        toast(`Logged ${outcome}` + (to ? ` · moved to ${to}` : '') + (made ? ' · project started' : ''));
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
      rec && spec.key === 'deals' ? (await apLoad(), apTimeline(rec)) : null,
      rec && spec.key === 'projects' ? (await apLoad(), msTimeline(rec)) : null,
      rec && !['feed', 'notepad'].includes(spec.key) ? await chatterSection(spec, rec) : null,
      layoutFields(fields.map((k) => {
        const t = typeOf(spec, k);
        const wide = k === titleField || t.base === 'LONGTEXT';
        if (t.base === 'BOOLEAN') {
          return el('div', { class: 'field set-row' + (wide ? ' wide' : '') }, el('label', { for: 'f_' + k, style: 'font-weight:500;font-size:14px' }, fieldLabel(spec, k)), inputFor(spec, k, values[k]));
        }
        return el('label', { class: 'field' + (wide ? ' wide' : ''), for: 'f_' + k },
          el('span', {}, fieldLabel(spec, k), t.base === 'REF' || t.base === 'CHOICE' || t.base === 'TEXT' || t.base === 'LONGTEXT' ? null : el('em', {}, t.base.toLowerCase())),
          inputFor(spec, k, values[k]));
      }), fields),
      rec ? el('div', { class: 'meta-line' }, `Created ${new Date(rec.date_created).toLocaleString()} · Updated ${new Date(rec.date_modified).toLocaleString()}`) : null,
      rec ? await relatedSection(spec, rec) : null,
      el('button', { type: 'submit', hidden: true }));

    // Group fields into collapsible sections when the table defines them (e.g. Projects)
    function layoutFields(nodes, keys) {
      if (!spec.sections) return nodes;
      const byField = Object.fromEntries(keys.map((k, i) => [k, nodes[i]]));
      const used = new Set();
      const groups = spec.sections.map((sec) => {
        const items = sec.fields.filter((k) => byField[k]).map((k) => { used.add(k); return byField[k]; });
        if (!items.length) return null;
        const sum = sec.summary ? sec.summary(values) : '';
        return el('details', { class: 'fsec wide', open: sec.open || isNew ? true : null },
          el('summary', {}, el('span', { class: 'fsec-ic' }, icon(sec.icon || 'grid')), el('b', {}, sec.title), sum ? el('small', {}, sum) : null),
          el('div', { class: 'fsec-body' }, items));
      });
      const rest = keys.filter((k) => !used.has(k)).map((k) => byField[k]);
      return [groups, rest.length ? el('details', { class: 'fsec wide' }, el('summary', {}, el('span', { class: 'fsec-ic' }, icon('grid')), el('b', {}, 'More')), el('div', { class: 'fsec-body' }, rest)) : null];
    }

    const saveBtn = el('button', { class: 'btn primary', onclick: save }, isNew ? `Create ${spec.single}` : 'Save changes');
    const foot = el('div', { class: 'drawer-foot' },
      rec ? el('button', { class: 'btn danger', onclick: remove, 'aria-label': `Delete ${spec.single}` }, icon('trash'), 'Delete') : null,
      el('span', { class: 'spacer' }),
      el('button', { class: 'btn ghost', onclick: closeDrawer }, 'Cancel'),
      saveBtn);

    const canMsg = rec && byKey.messages && !['messages', 'feed', 'notepad', 'users'].includes(spec.key);
    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, isNew ? `New ${spec.single}` : labelOf(spec)),
          el('h2', { id: 'drawerTitle' }, isNew ? `New ${spec.single}` : titleOf(spec, rec))),
        canMsg ? el('button', { class: 'btn sm msg-btn', type: 'button', title: 'Message a teammate about this', onclick: () => {
          const resp = respOf(rec.payload);
          openChat(resp && resp !== settings.meId ? resp : null, { key: spec.key, id: rec.id, label: titleOf(spec, rec) });
        } }, icon('chat'), 'Message') : null,
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
        const payload = collect();
        if (spec.boardField && 'stage_since' in schemaOf(spec) && payload[spec.boardField] && payload[spec.boardField] !== (rec ? rec.payload[spec.boardField] : undefined)) payload.stage_since = todayISO();
        else if (rec && rec.payload.stage_since) payload.stage_since = rec.payload.stage_since;
        if (spec.key === 'projects' && payload.status && payload.status !== (rec ? rec.payload.status : undefined) && msCfg().on && msCfg().steps.includes(payload.status)
          && !String(rec ? rec.payload.cust_notified || '' : '').split('|').includes(payload.status)) payload.cust_pending = payload.status;
        let saved;
        if (isNew) saved = (await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload })).record;
        else saved = (await api('POST', '/api/vault/update-record', { registry_id: spec.reg.id, record_id: rec.id, payload })).record;
        delete cache[spec.key];
        // New or changed notes become a Chatter post for whoever owns the next action
        let pinged = null;
        if (saved && 'notes' in schemaOf(spec) && payload.notes && payload.notes !== (rec ? rec.payload.notes : undefined)) {
          const post = await postChatter(spec, saved, payload.notes, respOf(saved.payload), true);
          if (post && post.payload.notify) pinged = userName(post.payload.notify);
        }
        closeDrawer();
        toast((isNew ? `${humanize(spec.single)} created` : 'Changes saved') + (pinged ? ` · ${pinged} notified` : ''));
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

      ['projects', 'j1', { project_title: 'Patel — project', status: 'Pre-install', queue: Q(0), assigned_to: '@u3', company: '@c5', deal: '@d6', project_type: 'Solar', date_due: day(3), url_details: 'Site survey booked Thursday 10am',
        contract_date: day(0), system_size_kw: 6.4, panel_count: 16, panel_model: 'Sample 400W mono panel', inverter: 'Sample microinverters', racking: 'Sample rail kit',
        funding_source: 'PPA', funding_partner: 'Sample PPA Partner', contract_value: 22000, funding_notes: 'Sample terms only.\nCredit approved; docs signed.',
        mpu_required: false, adders: 'Critter guard\nTrenching (sample)', adders_total: 900, monitoring_status: 'Not set up', monitoring_platform: 'Sample monitoring app' }],
      ['projects', 'j2', { project_title: 'Kim — project', status: 'System activation & inspection', queue: Q(3), assigned_to: '@u3', company: '@c6', deal: '@d8', project_type: 'Solar', date_due: day(-1), url_details: 'Waiting on city inspector',
        contract_date: day(-45), ntp_m1_date: day(-38), permit_approved_date: day(-20), install_date: day(-6), system_size_kw: 5.2, panel_count: 13, funding_source: 'PPA', monitoring_status: 'Offline' }],
      ['projects', 'j3', { project_title: 'Alvarez — project', status: 'Service & monitoring', queue: Q(4), assigned_to: '@u1', project_type: 'Solar + battery', date_due: day(30), url_details: 'Annual check-in',
        contract_date: day(-140), ntp_m1_date: day(-130), permit_approved_date: day(-100), install_date: day(-80), pto_date: day(-60), m3_date: day(-50), closed_date: day(-45), monitoring_status: 'Online', monitoring_platform: 'Sample monitoring app', monitoring_site_id: 'SAMPLE-0042' }],
      ['projects', 'j4', { project_title: 'Brennan — project', status: 'Revisions & NTP / M1', queue: Q(1), assigned_to: '@u3', project_type: 'Solar', date_due: day(2), url: 'https://example.com/designs/brennan', url_details: 'Homeowner asked to move two panels', contract_date: day(-12) }],
      ['projects', 'j5', { project_title: 'Whitaker — project', status: 'Permit submitted', queue: Q(1), assigned_to: '@u3', project_type: 'Solar', date_due: day(10), url_details: 'Submitted to the city', contract_date: day(-30), ntp_m1_date: day(-22), mpu_required: true }],
      ['projects', 'j6', { project_title: 'Castillo — project', status: 'Install scheduled', queue: Q(2), assigned_to: '@u3', project_type: 'Solar + battery', date_due: day(2), url_details: 'Crew booked', contract_date: day(-50), ntp_m1_date: day(-44), permit_approved_date: day(-8) }],
      ['projects', 'j7', { project_title: 'Ortiz — project', status: 'MPU planning', queue: Q(1), assigned_to: '@u3', project_type: 'Solar', date_due: day(4), url_details: 'Panel is 100A, needs upgrade', contract_date: day(-20), ntp_m1_date: day(-15), mpu_required: true }],
      ['projects', 'j8', { project_title: 'Hughes — project', status: 'PTO', queue: Q(3), assigned_to: '@u3', project_type: 'Solar', date_due: day(-3), contract_date: day(-90), ntp_m1_date: day(-80), permit_approved_date: day(-60), install_date: day(-30), pto_date: day(-3) }],

      ['messages', 'g1', { body: 'Can you confirm the crew for Patel on Thursday?', from_user: '@u1', to_user: '@u3', pin_key: 'projects', pin_id: '@j1', pin_label: 'Patel — project', seen: false }],
      ['messages', 'g2', { body: 'On it. Crew is tentatively booked for 10am.', from_user: '@u3', to_user: '@u1', seen: true }],
      ['messages', 'g3', { body: 'Nguyen asked about the battery again. Can you join the call tomorrow?', from_user: '@u2', to_user: '@u1', pin_key: 'deals', pin_id: '@d2', pin_label: 'Nguyen — 9.6 kW + battery', seen: false }],
      ['messages', 'g4', { body: 'Kim’s monitoring is offline. Heading there after lunch.', from_user: '@u3', to_user: '@u2', pin_key: 'projects', pin_id: '@j2', pin_label: 'Kim — project', seen: false }],
      ['feed', 'f1', { body: 'Site survey is booked for Thursday 10am. Please confirm the crew.', about: 'Patel — project', about_key: 'projects', about_id: '@j1', author: '@u1', notify: '@u3', seen: false }],
      ['feed', 'f2', { body: 'Homeowner wants to move two panels off the front roof. New design needed before NTP.', about: 'Brennan — project', about_key: 'projects', about_id: '@j4', author: '@u1', notify: '@u3', seen: false, pinned: true, pinned_by: '@u1', pin_audience: 'all' }],
      ['feed', 'f4', { body: 'Reminder: every permit packet needs roof photos and the main panel label before it goes to the city. No exceptions.', about: 'Team update', author: '@u1', seen: true, pinned: true, pinned_by: '@u1', pin_audience: 'all' }],
      ['feed', 'f5', { body: 'Saturday canvass in Rocklin starts 10am at the usual spot. Bring door hangers.', about: 'Team update', author: '@u2', seen: true, pinned: true, pinned_by: '@u2', pin_audience: 'team:Setter' }],
      ['feed', 'f6', { body: 'Avery, Sam: the city wants the stamped plans re-uploaded for Whitaker before Friday.', about: 'Whitaker — project', about_key: 'projects', about_id: '@j5', author: '@u3', seen: true, pinned: true, pinned_by: '@u3', pin_audience: 'users:@u1,@u3' }],
      ['feed', 'f3', { body: 'Monitoring shows offline since yesterday. Can you check the gateway on your visit?', about: 'Kim — project', about_key: 'projects', about_id: '@j2', author: '@u3', notify: '@u1', seen: false }],

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
        body[k] = typeof v === 'string' && v.startsWith('@') ? ids[v.slice(1)]
          : typeof v === 'string' && v.startsWith('users:') ? 'users:' + v.slice(6).split(',').map((x) => (x.startsWith('@') ? ids[x.slice(1)] : x)).filter(Boolean).join(',') : v;
        if (body[k] === undefined) delete body[k];
      }
      const r = await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload: body });
      ids[ref] = r.record.id;
      (made[key] = made[key] || []).push(r.record.id);
    }
    let failure = null;
    if (!only) { try { await loadVolumeSample(ids, made); } catch (e) { failure = e; } }
    const prev = settings.sampleIds || {};
    for (const [k, v] of Object.entries(made)) prev[k] = (prev[k] || []).concat(v);
    settings.sampleIds = prev;
    if (!only && !failure) settings.sampleVersion = SAMPLE_VERSION;
    saveSettings();
    if (failure) { Object.keys(cache).forEach((k) => delete cache[k]); throw failure; }
    Object.keys(cache).forEach((k) => delete cache[k]);
  }

  // A realistic book of business: about 30 jobs (varied) in every sales stage and project step.
  // Fictional homeowners only. Inserted in bulk so it loads fast on a phone.
  async function loadVolumeSample(ids, made) {
    let seed = 20261101;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const FIRST = ['Ava', 'Ben', 'Carla', 'Diego', 'Elena', 'Frank', 'Grace', 'Hector', 'Iris', 'Jamal', 'Kara', 'Leo', 'Maya', 'Noah', 'Olivia', 'Pedro', 'Quinn', 'Rosa', 'Sean', 'Tara',
      'Uma', 'Victor', 'Wendy', 'Xavier', 'Yvonne', 'Zack', 'Aaron', 'Bianca', 'Caleb', 'Dana', 'Eli', 'Fiona', 'Gabe', 'Hana', 'Ivan', 'Jade', 'Kevin', 'Lena', 'Marco', 'Nina'];
    const LAST = ['Abbott', 'Bauer', 'Castro', 'Dalton', 'Ellis', 'Fischer', 'Garza', 'Holt', 'Ibarra', 'Jensen', 'Keller', 'Lam', 'Moreno', 'Nash', 'Oakley', 'Pruitt', 'Quintana', 'Rhodes',
      'Santos', 'Tran', 'Underwood', 'Vance', 'Wolfe', 'Yates', 'Zamora', 'Avila', 'Brooks', 'Chen', 'Duarte', 'Espinoza', 'Foster', 'Gill', 'Haddad', 'Iverson', 'Juarez', 'Kaur',
      'Lowe', 'Mendez', 'Novak', 'Ortega', 'Park', 'Reid', 'Sandoval', 'Tanaka', 'Valdez', 'Webb', 'Young', 'Zhou'];
    const CITIES = [['Roseville', '95661'], ['Roseville', '95678'], ['Rocklin', '95677'], ['Lincoln', '95648'], ['Auburn', '95603'], ['Loomis', '95650'], ['Granite Bay', '95746'], ['Citrus Heights', '95610']];
    const STREETS = ['Sample St', 'Example Ave', 'Placeholder Ct', 'Demo Way', 'Test Ln', 'Mock Dr', 'Model Pl', 'Trial Rd'];
    const usedNames = new Set();
    const person = () => { let n; do { n = `${pick(FIRST)} ${pick(LAST)}`; } while (usedNames.has(n)); usedNames.add(n); return n; };
    const bulk = async (key, rows) => {
      const spec = byKey[key];
      const out = [];
      for (let i = 0; i < rows.length; i += 1000) {
        const r = await api('POST', '/api/vault/bulk-insert', { registry_id: spec.reg.id, rows: rows.slice(i, i + 1000) });
        out.push(...r.ids);
      }
      (made[key] = made[key] || []).push(...out);
      return out;
    };

    // Bigger team so the leaderboard means something
    const team = [['Jordan Blake', 'Setter'], ['Riley Chen', 'Setter'], ['Casey Monroe', 'Closer'], ['Taylor Brooks', 'Closer'], ['Devon Ruiz', 'Install coordinator'], ['Morgan Lee', 'Install coordinator']];
    const tIds = await bulk('users', team.map(([name, role], i) => ({ name, role, email: `${name.split(' ')[0].toLowerCase()}@example.com`, phone: `916-555-02${String(10 + i).padStart(2, '0')}`, active: true })));
    const reps = [ids.u1, ids.u2, ...tIds.slice(0, 4)].filter(Boolean);
    const coords = [ids.u3, tIds[4], tIds[5]].filter(Boolean);

    // 30 customers in all: the 7 hand-written ones above + 23 here, so every stage has an example
    const salesStages = ['New lead', 'Follow-up', 'Appointment set', 'Proposal sent', 'Sold', 'Lost'];
    const PLAN = [['New lead', 2], ['Follow-up', 2], ['Appointment set', 2], ['Proposal sent', 1], ['Lost', 1],
      ['Contract', 2], ['Design', 2], ['PIR', 1], ['Utility pre-check', 1], ['Permit approved', 1], ['MPU', 1], ['Install scheduled', 1],
      ['Install verification & post-install design', 1], ['Post-install permitting', 1], ['PTO', 1], ['M3', 1], ['Closed', 1], ['Service & monitoring', 1]];
    const jobs = [];
    PLAN.forEach(([stage, n]) => { for (let i = 0; i < n; i++) jobs.push(salesStages.includes(stage) ? { kind: 'deal', stage } : { kind: 'project', step: stage }); });
    jobs.forEach((j) => {
      j.name = person();
      j.kw = Math.round((4 + rnd() * 8) * 10) / 10;
      j.value = Math.round(j.kw * between(2900, 3600) / 100) * 100;
      j.fin = rnd() < 0.7 ? 'PPA' : pick(['Lease', 'Loan', 'Cash']);
      j.battery = rnd() < 0.25;
      j.city = pick(CITIES);
    });
    const util = (c) => c[0] === 'Roseville' ? (rnd() < 0.7 ? 'Roseville Electric' : 'PG&E') : 'PG&E';
    const homeIds = await bulk('companies', jobs.map((j) => ({
      company_name: `${j.name} Household`, status: j.kind === 'project' || j.stage === 'Sold' ? 'Customer' : j.stage === 'Lost' ? 'Not a fit' : 'Lead',
      phone: `916-555-${String(between(1000, 9999))}`, utility: util(j.city), avg_monthly_bill: between(140, 520),
      roof_type: pick(['Composition shingle', 'Composition shingle', 'Tile', 'Metal']), roof_age: between(1, 22), shade: pick(['None', 'None', 'Some', 'Heavy']), hoa: rnd() < 0.2 })));
    jobs.forEach((j, i) => { j.home = homeIds[i]; });
    const propIds = await bulk('locations', jobs.map((j) => ({ location_name: `${j.name.split(' ')[1]} home`, company: j.home, address: `${between(100, 9900)} ${pick(STREETS)}`, city: j.city[0], state: 'CA', zip: j.city[1] })));
    const contactIds = await bulk('contacts', jobs.map((j, i) => {
      const [first, last] = j.name.split(' ');
      return { first_name: first, last_name: last, company: j.home, location: propIds[i], job_title: 'Homeowner', decision_maker: true,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`, phone: `916-555-${String(between(1000, 9999))}`, text_consent: rnd() < 0.85, opted_out: rnd() < 0.03 };
    }));
    jobs.forEach((j, i) => { j.contact = contactIds[i]; });

    const NEXT = { 'New lead': ['First call', 'Knock again this weekend', 'Text intro + ask for a bill'], 'Follow-up': ['Call back after 6pm', 'Get both decision-makers home', 'Waiting on utility bill'],
      'Appointment set': ['Kitchen-table appointment', 'Bring 12 months of bills', 'Review roof + shade'], 'Proposal sent': ['Walk through proposal', 'Answer battery questions', 'Compare PPA vs lease'],
      Sold: ['Hand off to project team'], Lost: ['Revisit in 6 months'] };
    const dealJobs = jobs.filter((j) => j.kind === 'deal');
    const dealIds = await bulk('deals', dealJobs.map((j) => {
      const closed = j.stage === 'Sold' || j.stage === 'Lost';
      return Object.assign({ deal_name: `${j.name.split(' ')[1]} — ${j.kw} kW`, stage: j.stage, value: j.value, system_size_kw: j.kw, financing: j.fin, battery: j.battery,
        stage_since: day(-between(0, 24)), company: j.home, contact: j.contact, owner: pick(reps), source: pick(['Door knock', 'Door knock', 'Door knock', 'Referral', 'Flyer', 'Website', 'Cold call', 'Event']), next_step: pick(NEXT[j.stage]) },
        closed ? { close_date: day(-between(0, 25)), seq_status: 'Done' } : { follow_up: day(between(-6, 12)) },
        ['Follow-up', 'Appointment set', 'Proposal sent'].includes(j.stage) ? (() => {
          const age = between(0, 40); const passed = [7, 15, 30].filter((d) => d <= age).length;
          const sent = Math.max(0, passed - (rnd() < 0.45 ? 1 : 0));
          return { seq_start: day(-age), seq_step: sent, seq_status: sent >= 3 ? 'Done' : rnd() < 0.05 ? 'Paused' : 'Active' };
        })() : {});
    }));
    dealJobs.forEach((j, i) => { j.id = dealIds[i]; });

    // Each project step: milestone dates filled up to that step, monitoring once live
    const projJobs = jobs.filter((j) => j.kind === 'project');
    const order = INSTALL_STEPS;
    const reached = (j, s) => j.step !== 'Paused' && order.indexOf(j.step) >= order.indexOf(s);
    const STATUS_NOTE = { Contract: 'Docs signed, welcome call next', 'Pre-install': 'Site survey booked', Design: 'Design in progress', 'Revisions & NTP / M1': 'Waiting on homeowner sign-off',
      PIR: 'Pre-install review', 'MPU planning': 'Panel upgrade needed', 'Utility pre-check': 'Submitted to utility', 'Permit submitted': 'With the city', 'Permit approved': 'Ready to schedule',
      MPU: 'Electrician booked', 'Install scheduled': 'Crew booked', 'Install verification & post-install design': 'Photos under review', 'Post-install permitting': 'As-builts submitted',
      'System activation & inspection': 'Waiting on inspector', PTO: 'Permission to operate granted', M3: 'Final funding pending', Closed: 'Complete', 'Service & monitoring': 'Annual check-in', Paused: 'Homeowner asked to pause' };
    await bulk('projects', projJobs.map((j) => {
      const age = order.indexOf(j.step) < 0 ? between(10, 60) : order.indexOf(j.step) * 6 + between(2, 10);
      const live = reached(j, 'PTO');
      const p = { project_title: `${j.name.split(' ')[1]} — project`, status: j.step, stage_since: day(-between(0, 21)), queue: settings.queues[Math.min(4, Math.floor(Math.max(0, order.indexOf(j.step)) / 4))] || undefined,
        assigned_to: pick(coords), company: j.home, project_type: j.battery ? 'Solar + battery' : 'Solar', date_due: day(between(-5, 14)), url_details: STATUS_NOTE[j.step],
        contract_date: day(-age), system_size_kw: j.kw, panel_count: Math.round(j.kw * 1000 / 400), panel_model: 'Sample 400W mono panel', inverter: pick(['Sample microinverters', 'Sample string inverter']),
        funding_source: j.fin, contract_value: j.value, mpu_required: reached(j, 'MPU planning') ? rnd() < 0.3 : rnd() < 0.15 };
      if (j.battery) p.battery_model = 'Sample 13.5 kWh battery';
      if (reached(j, 'Revisions & NTP / M1')) p.ntp_m1_date = day(-age + 7);
      if (reached(j, 'Permit approved')) p.permit_approved_date = day(-age + 20);
      if (reached(j, 'Install verification & post-install design')) p.install_date = day(-age + 32);
      if (live) { p.pto_date = day(-age + 45); p.monitoring_status = rnd() < 0.85 ? 'Online' : pick(['Offline', 'Service needed']); p.monitoring_platform = 'Sample monitoring app'; p.monitoring_site_id = 'SAMPLE-' + between(1000, 9999); }
      if (reached(j, 'M3')) p.m3_date = day(-age + 52);
      if (reached(j, 'Closed')) p.closed_date = day(-age + 56);
      { const main = MAIN_DEFAULT.filter((m) => order.indexOf(m) <= order.indexOf(j.step) && order.indexOf(j.step) >= 0);
        const pend = MAIN_DEFAULT.includes(j.step) && rnd() < 0.6 ? j.step : null;
        const sentList = main.filter((m) => m !== pend);
        if (sentList.length) p.cust_notified = sentList.join('|');
        if (pend) p.cust_pending = pend; }
      if (rnd() < 0.2) { p.adders = pick(['Critter guard', 'Trenching', 'Roof reinforcement', 'Critter guard\nEV-ready circuit']); p.adders_total = between(4, 30) * 100; }
      Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
      return p;
    }));

    // A week of activity across the team for the leaderboard
    const recent = dealJobs.filter((j) => j.stage !== 'Lost');
    const OUT = [['Door knock', 'Not home'], ['Door knock', 'Appointment set'], ['Door knock', 'Not interested'], ['Call', 'No answer'], ['Call', 'Left voicemail'],
      ['Call', 'Callback set'], ['Appointment', 'Proposal sent'], ['Appointment', 'Sold'], ['Text', 'Callback set']];
    await bulk('activities', Array.from({ length: between(30, 40) }, () => {
      const j = pick(recent); const [type, outcome] = pick(OUT);
      return { subject: `${type} — ${outcome}`, type, outcome, deal: j.id, company: j.home, rep: pick(reps), date: day(-between(0, 6)) };
    }));
    await bulk('calendar', Array.from({ length: between(4, 6) }, () => {
      const j = pick(dealJobs.filter((x) => x.stage === 'Appointment set'));
      return { title: `Appointment — ${j.name.split(' ')[1]}`, date: day(between(0, 6)), time: pick(['10:00 AM', '1:30 PM', '4:00 PM', '6:00 PM', '6:30 PM', '7:00 PM']), assigned_to: pick(reps), company: j.home };
    }));
  }

  // Sample records left behind by an interrupted load: the pinned "Sample data" note is the tell-tale
  async function strayedSample() {
    try {
      const notes = await load(byKey.notepad, true);
      return notes.some((r) => r.payload.title === 'Sample data' && /fictional placeholder/i.test(r.payload.body || ''));
    } catch (_) { return false; }
  }
  async function removeStraySample() {
    const set = sampleSet();
    // Only tables whose sample titles are distinctive; notes, chats and auto-named activities could match real ones
    const SKIP = new Set(['activities', 'feed', 'messages', 'indi_projects', 'scripts_mail', 'scripts_sent']);
    for (const key of SPEC.map((x) => x.key).reverse()) {
      const spec = byKey[key];
      if (!spec || SKIP.has(key)) continue;
      const titles = new Set(set.filter(([k]) => k === key).map(([, , p]) => (spec.title ? spec.title(p) : '') || '').filter(Boolean));
      if (!titles.size) continue;
      const recs = await load(spec, true);
      const ids = recs.filter((r) => titles.has(titleOf(spec, r))).map((r) => r.id);
      for (let i = 0; i < ids.length; i += 2000) await api('POST', '/api/vault/bulk-delete', { registry_id: spec.reg.id, ids: ids.slice(i, i + 2000) });
    }
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
  async function resetSample() {
    const meName = settings.meName || (userRec(settings.meId) || { payload: {} }).payload.name || null;
    await removeSampleData();
    await removeStraySample();
    await loadSampleData();
    if (meName) settings.meName = meName;
    await ensureMe();
  }
  // Keep "who I am" pointing at a real team member: re-link by name after sample data is rebuilt,
  // otherwise clear it so nothing gets saved against a deleted person.
  async function ensureMe() {
    if (!byKey.users) return;
    const users = await load(byKey.users, true);
    const cur = settings.meId && users.find((u) => u.id === settings.meId);
    if (cur) { if (settings.meName !== cur.payload.name) { settings.meName = cur.payload.name; saveSettings(); } return; }
    if (!settings.meId) return;
    const want = (settings.meName || '').toLowerCase();
    const first = (settings.name || '').toLowerCase();
    const hit = (want && users.find((u) => (u.payload.name || '').toLowerCase() === want))
      || (first && users.filter((u) => (u.payload.name || '').toLowerCase().split(' ')[0] === first).length === 1 && users.find((u) => (u.payload.name || '').toLowerCase().split(' ')[0] === first));
    if (hit) { settings.meId = hit.id; settings.meName = hit.payload.name; }
    else { settings.meId = ''; }
    saveSettings();
  }

  async function removeSampleData() {
    const all = settings.sampleIds || {};
    // Delete records that point at others first (reverse of creation order)
    const order = SPEC.map((s) => s.key).reverse();
    for (const key of order) {
      const spec = byKey[key];
      const ids = all[key] || [];
      for (let i = 0; i < ids.length; i += 2000) {
        try { await api('POST', '/api/vault/bulk-delete', { registry_id: spec.reg.id, ids: ids.slice(i, i + 2000) }); }
        catch (_) { for (const id of ids.slice(i, i + 2000)) { try { await api('DELETE', `/api/vault/record/${spec.reg.id}/${id}`); } catch (__) { /* already gone */ } } }
      }
    }
    delete settings.sampleIds;
    saveSettings();
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
  const hasSample = () => Object.values(settings.sampleIds || {}).some((a) => a.length);
  const SAMPLE_VERSION = 13;

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
      settings.meName = me.value ? ((userRec(me.value) || { payload: {} }).payload.name || '') : '';
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
            : 'Fill every tab with 30 fictional homeowners spread across every sales stage and project step, plus a 9-person team, appointments and chats.'),
          el('div', { class: 'actions-row' }, hasSample()
            ? [el('button', { class: 'btn', type: 'button', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.lastChild.textContent = 'Reloading…'; try { await resetSample(); closeDrawer(); toast('Sample data reloaded'); await render(); refreshCounts(); } catch (er) { toast(er.message, true); b.disabled = false; } } }, icon('upload'), 'Reload full sample'),
               el('button', { class: 'btn danger', type: 'button', onclick: (e) => runSample(e.currentTarget, false) }, icon('trash'), 'Remove sample data')]
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
  // CSV import / export (Salesforce, SalesRabbit, spreadsheets…)
  // Everything happens in this browser; the file is never uploaded anywhere.
  // ---------------------------------------------------------------------
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const first = text.slice(0, text.indexOf('\n') > -1 ? text.indexOf('\n') : text.length);
    const count = (ch) => first.split(ch).length - 1;
    const delim = [',', ';', '\t'].sort((a, b) => count(b) - count(a))[0];
    const rows = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some((v) => v.trim() !== '')) rows.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some((v) => v.trim() !== '')) rows.push(row);
    const headers = (rows.shift() || []).map((h, i) => h.trim() || `Column ${i + 1}`);
    return { headers, rows: rows.map((r) => headers.map((_, i) => (r[i] ?? '').trim())) };
  }
  const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, '');
  // Common column names from Salesforce, SalesRabbit and spreadsheets → our fields
  const SYN = {
    deal_name: ['opportunity name', 'opportunity', 'deal name', 'deal', 'lead name'],
    value: ['amount', 'contract value', 'contract amount', 'price', 'total', 'deal value'],
    stage: ['stage', 'opportunity stage', 'lead status', 'status'],
    close_date: ['close date', 'closed date', 'date closed', 'sold date'],
    follow_up: ['follow up', 'follow up date', 'next follow up', 'next activity date', 'callback date'],
    next_step: ['next step', 'next steps'],
    company: ['account name', 'account', 'homeowner', 'household', 'customer', 'customer name'],
    contact: ['contact name', 'primary contact', 'contact'],
    owner: ['opportunity owner', 'lead owner', 'account owner', 'owner', 'owner name', 'rep', 'sales rep', 'setter', 'closer'],
    rep: ['rep', 'sales rep', 'user', 'assigned to', 'owner'],
    assigned_to: ['assigned to', 'project manager', 'owner', 'responsible'],
    source: ['lead source', 'source'],
    company_name: ['account name', 'household', 'homeowner', 'customer name', 'name', 'full name'],
    location_name: ['property', 'property name', 'site name', 'location'],
    first_name: ['first name', 'firstname', 'first'],
    last_name: ['last name', 'lastname', 'last', 'surname'],
    email: ['email', 'email address', 'e mail'],
    phone: ['phone', 'phone number', 'mobile', 'mobile phone', 'cell', 'cell phone', 'home phone'],
    address: ['street', 'address', 'street address', 'mailing street', 'billing street', 'address line 1'],
    city: ['city', 'mailing city', 'billing city'],
    state: ['state', 'state province', 'mailing state', 'billing state', 'mailing state province', 'billing state province'],
    zip: ['zip', 'zip code', 'zipcode', 'postal code', 'mailing zip postal code', 'billing zip postal code'],
    job_title: ['title', 'role', 'job title'],
    notes: ['description', 'notes', 'note', 'comments', 'comment'],
    system_size_kw: ['system size', 'system size kw', 'kw', 'size kw'],
    financing: ['financing', 'finance type', 'funding source', 'payment type'],
    funding_source: ['funding source', 'financing', 'finance type'],
    utility: ['utility', 'utility company', 'electric company'],
    avg_monthly_bill: ['avg monthly bill', 'average bill', 'monthly bill', 'average monthly bill'],
    project_title: ['project name', 'project', 'job name', 'name'],
    status: ['status', 'project status', 'stage', 'step'],
    date_due: ['due date', 'due', 'next action due'],
    subject: ['subject', 'activity', 'task'],
    date: ['date', 'activity date', 'event date'],
    type: ['type', 'activity type'],
    outcome: ['outcome', 'result', 'disposition', 'call result']
  };
  const CHOICE_SYN = {
    stage: { 'closed won': 'Sold', won: 'Sold', sold: 'Sold', 'closed lost': 'Lost', lost: 'Lost', prospecting: 'New lead', new: 'New lead', open: 'New lead',
      qualification: 'Follow-up', contacted: 'Follow-up', working: 'Follow-up', 'needs analysis': 'Appointment set', 'value proposition': 'Appointment set',
      'id decision makers': 'Appointment set', appointment: 'Appointment set', 'perception analysis': 'Proposal sent', 'proposal price quote': 'Proposal sent',
      proposal: 'Proposal sent', 'negotiation review': 'Proposal sent', negotiation: 'Proposal sent' }
  };
  function matchField(spec, header, taken) {
    const h = norm(header);
    const fields = Object.keys(schemaOf(spec)).filter((k) => !taken.has(k) && !(spec.hide || []).includes(k));
    let hit = fields.find((k) => norm(k) === h || norm(fieldLabel(spec, k)) === h);
    if (!hit) hit = fields.find((k) => (SYN[k] || []).some((x) => norm(x) === h));
    return hit || '';
  }
  function isoDate(v) {
    const t = String(v).trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; }
    const d = new Date(t);
    return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function convertValue(spec, field, raw, lookups, problems) {
    const v = String(raw ?? '').trim();
    if (v === '') return undefined;
    const t = typeOf(spec, field);
    switch (t.base) {
      case 'NUMBER': {
        const n = Number(v.replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1').replace(/kw$/i, ''));
        if (isNaN(n)) { problems.push(`${fieldLabel(spec, field)}: “${v}” isn’t a number`); return undefined; }
        return n;
      }
      case 'DATE': { const d = isoDate(v); if (!d) problems.push(`${fieldLabel(spec, field)}: “${v}” isn’t a date`); return d || undefined; }
      case 'BOOLEAN': return /^(true|yes|y|1|x|checked)$/i.test(v);
      case 'URL': return /^https?:\/\//i.test(v) ? v : (/\./.test(v) ? 'https://' + v : undefined);
      case 'CHOICE': {
        const opts = t.options;
        const exact = opts.find((o) => o.toLowerCase() === v.toLowerCase());
        if (exact) return exact;
        const syn = CHOICE_SYN[field] && CHOICE_SYN[field][v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()];
        if (syn && opts.includes(syn)) return syn;
        const loose = opts.find((o) => norm(o) === norm(v)) || opts.find((o) => norm(o).startsWith(norm(v)) || norm(v).startsWith(norm(o)));
        if (loose) return loose;
        problems.push(`${fieldLabel(spec, field)}: “${v}” isn’t an option`);
        return undefined;
      }
      case 'REF': {
        const target = byRegId[t.target];
        const map = lookups[t.target];
        const id = map && (map.get(v.toLowerCase()) || map.get(norm(v)));
        if (id) return id;
        if (map && map.create && target) return { create: v, target };
        problems.push(`${fieldLabel(spec, field)}: no ${target ? target.single : 'record'} named “${v}”`);
        return undefined;
      }
      default: return v;
    }
  }
  async function buildLookups(spec) {
    const out = {};
    for (const k of Object.keys(schemaOf(spec))) {
      const t = typeOf(spec, k);
      if (t.base !== 'REF' || out[t.target]) continue;
      const target = byRegId[t.target];
      if (!target) continue;
      const recs = await load(target, true);
      const m = new Map();
      recs.forEach((r) => {
        const title = titleOf(target, r);
        m.set(title.toLowerCase(), r.id); m.set(norm(title), r.id);
        if (r.payload.email) m.set(String(r.payload.email).toLowerCase(), r.id);
      });
      m.create = ['companies', 'contacts', 'locations'].includes(target.key);
      out[t.target] = m;
    }
    return out;
  }
  async function createLinked(target, name) {
    const first = Object.keys(schemaOf(target))[0];
    let payload = { [first]: name };
    if (target.key === 'contacts') { const [a, ...b] = name.split(/\s+/); payload = { first_name: a, last_name: b.join(' ') || undefined }; }
    if (target.key === 'companies') payload.status = 'Lead';
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const r = await api('POST', '/api/vault/insert-record', { registry_id: target.reg.id, payload });
    return r.record.id;
  }
  function guessType(values) {
    const vals = values.filter((v) => v !== '').slice(0, 200);
    if (!vals.length) return 'TEXT';
    if (vals.every((v) => /^[$(]?-?[\d,]+(\.\d+)?\)?$/.test(v))) return 'NUMBER';
    if (vals.every((v) => isoDate(v) && /\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}/.test(v))) return 'DATE';
    if (vals.every((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))) return 'EMAIL';
    if (vals.every((v) => /^https?:\/\//i.test(v))) return 'URL';
    if (vals.some((v) => v.length > 120)) return 'LONGTEXT';
    return 'TEXT';
  }

  function openImport(defaultKey) {
    const choices = specs.filter((x) => !['feed'].includes(x.key));
    const tableSel = el('select', { class: 'select', id: 'imp_table' },
      choices.map((x) => el('option', { value: x.key, selected: x.key === defaultKey }, labelOf(x))),
      el('option', { value: '__new' }, '+ New table from this file'));
    const file = el('input', { class: 'input', id: 'imp_file', type: 'file', accept: '.csv,text/csv,.tsv,text/tab-separated-values' });
    const err = el('div', { class: 'form-error', role: 'alert', hidden: true });
    const body = el('div', { class: 'drawer-body' },
      el('div', { class: 'imp-hero wide' }, el('span', { class: 'qart', style: '--h:200' }, el('span', { class: 'qglow' }), icon('upload')),
        el('div', {}, el('b', {}, 'Bring your data over'),
          el('p', {}, 'Export a CSV from Salesforce (a report or list view), SalesRabbit, a spreadsheet or any CRM, then pick it here. Columns match automatically and you can adjust them before anything is saved.'))),
      el('label', { class: 'field wide', for: 'imp_table' }, el('span', {}, 'Import into'), tableSel),
      el('label', { class: 'field wide', for: 'imp_file' }, el('span', {}, 'CSV file'), file),
      el('p', { class: 'hint wide', style: 'margin:0' }, 'The file stays on this device. Nothing is uploaded.'),
      err);
    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, 'Import'), el('h2', { id: 'drawerTitle' }, 'Import from CSV')),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      body,
      el('div', { class: 'drawer-foot' }, el('span', { class: 'spacer' }), el('button', { class: 'btn ghost', onclick: closeDrawer }, 'Cancel')));
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      err.hidden = true;
      if (f.size > 15 * 1024 * 1024) { err.hidden = false; err.textContent = 'That file is over 15 MB. Split it into smaller files and import them one at a time.'; return; }
      let parsed;
      try { parsed = parseCSV(await f.text()); } catch (e) { err.hidden = false; err.textContent = 'Couldn’t read that file: ' + e.message; return; }
      if (!parsed.headers.length || !parsed.rows.length) { err.hidden = false; err.textContent = 'That file has no rows to import. Check it has a header row and data under it.'; return; }
      let spec;
      if (tableSel.value === '__new') {
        try { spec = await createTableFromCSV(f.name, parsed); } catch (e) { err.hidden = false; err.replaceChildren(el('strong', {}, e.message), e.details ? el('div', {}, [].concat(e.details).join(' · ')) : null); return; }
      } else spec = byKey[tableSel.value];
      mapStep(spec, parsed, f.name);
    });
  }

  async function createTableFromCSV(fileName, parsed) {
    const fields_schema = {}, used = new Set();
    parsed.headers.slice(0, 100).forEach((h, i) => {
      let k = slug(h) || `column_${i + 1}`;
      while (used.has(k)) k = `${k}_${i + 1}`.slice(0, 63);
      used.add(k);
      fields_schema[k] = guessType(parsed.rows.map((r) => r[i]));
    });
    const name = String(fileName).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 90) || 'Imported table';
    let table_name = name, n = 2;
    while (specs.some((x) => x.table === table_name)) table_name = `${name} ${n++}`;
    const r = await api('POST', '/api/registry/create-table', { app_name: 'Custom', table_name, fields_schema });
    await bootstrap();
    renderNav();
    return byRegId[r.registry_id];
  }

  async function mapStep(spec, parsed, fileName) {
    await loadWithRefs(spec);
    const fields = Object.keys(schemaOf(spec)).filter((k) => !(spec.hide || []).includes(k));
    const taken = new Set();
    const auto = parsed.headers.map((h) => { const k = matchField(spec, h, taken); if (k) taken.add(k); return k; });
    // Salesforce-style "Name" on contacts → split into first/last
    const splitName = spec.key === 'contacts' && !auto.includes('first_name') && parsed.headers.findIndex((h) => ['name', 'fullname', 'contactname'].includes(norm(h)));
    const selects = parsed.headers.map((h, i) => el('select', { class: 'select', 'aria-label': `Field for ${h}` },
      el('option', { value: '' }, 'Skip this column'),
      fields.map((k) => el('option', { value: k, selected: auto[i] === k }, fieldLabel(spec, k)))));
    const titleField = fields.find((c) => spec.title && spec.title({ [c]: 'x' }) === 'x') || fields[0];
    const dedupe = el('input', { type: 'checkbox', id: 'imp_dedupe', checked: true });
    const linkNew = el('input', { type: 'checkbox', id: 'imp_link', checked: true });
    const hasRef = fields.some((k) => typeOf(spec, k).base === 'REF');
    const matched = auto.filter(Boolean).length;
    const sample = parsed.rows.slice(0, 2);
    const mapRows = el('div', { class: 'imp-map wide' }, parsed.headers.map((h, i) =>
      el('div', { class: 'imp-row' + (auto[i] ? ' hit' : '') },
        el('div', { class: 'imp-col' }, el('b', {}, h), el('small', {}, sample.map((r) => r[i]).filter(Boolean).join(' · ').slice(0, 70) || 'empty')),
        icon('arrowR'), selects[i])));
    const go = el('button', { class: 'btn primary', onclick: run }, icon('upload'), `Import ${parsed.rows.length.toLocaleString()} row${parsed.rows.length === 1 ? '' : 's'}`);
    const status = el('div', { class: 'imp-status wide', hidden: true });
    showDrawer(
      el('div', { class: 'drawer-head' },
        el('div', {}, el('div', { class: 'eyebrow' }, `Import · ${fileName}`), el('h2', { id: 'drawerTitle' }, `Match columns to ${labelOf(spec)}`)),
        el('button', { class: 'icon-btn', onclick: closeDrawer, 'aria-label': 'Close' }, icon('x'))),
      el('div', { class: 'drawer-body' },
        el('p', { class: 'hint wide', style: 'margin:0' }, `${parsed.rows.length.toLocaleString()} rows · ${parsed.headers.length} columns · ${matched} matched automatically. Columns set to “Skip” aren’t imported.`),
        splitName !== false && splitName > -1 ? el('p', { class: 'hint wide', style: 'margin:0' }, `“${parsed.headers[splitName]}” will be split into first and last name.`) : null,
        mapRows,
        el('div', { class: 'field set-row wide' }, el('label', { for: 'imp_dedupe', style: 'font-weight:500;font-size:14px' }, `Skip rows whose ${fieldLabel(spec, titleField).toLowerCase()} already exists`), el('label', { class: 'toggle' }, dedupe, el('i'))),
        hasRef ? el('div', { class: 'field set-row wide' }, el('label', { for: 'imp_link', style: 'font-weight:500;font-size:14px' }, 'Create missing homeowners, contacts and properties'), el('label', { class: 'toggle' }, linkNew, el('i'))) : null,
        status),
      el('div', { class: 'drawer-foot' }, el('button', { class: 'btn ghost', onclick: () => openImport(spec.key) }, 'Back'), el('span', { class: 'spacer' }), go));

    async function run() {
      const map = selects.map((sel) => sel.value);
      if (!map.some(Boolean) && !(splitName > -1)) { toast('Match at least one column first', true); return; }
      go.disabled = true;
      $$('#drawer select, #drawer input').forEach((x) => { x.disabled = true; });
      status.hidden = false;
      const bar = el('i');
      const label = el('span', {}, 'Starting…');
      status.replaceChildren(el('div', { class: 'imp-bar' }, bar), label);
      const lookups = await buildLookups(spec);
      if (!linkNew.checked) Object.values(lookups).forEach((m) => { m.create = false; });
      const existing = new Set((await load(spec, true)).map((r) => titleOf(spec, r).toLowerCase()));
      let ok = 0, skipped = 0, failed = 0;
      const problems = [];
      const total = parsed.rows.length;
      for (let i = 0; i < total; i++) {
        const row = parsed.rows[i];
        const rowProblems = [];
        const payload = {};
        map.forEach((k, ci) => {
          if (!k) return;
          const v = convertValue(spec, k, row[ci], lookups, rowProblems);
          if (v !== undefined && payload[k] === undefined) payload[k] = v;
        });
        if (splitName > -1 && row[splitName]) {
          const [a, ...b] = row[splitName].split(/\s+/);
          if (!payload.first_name) payload.first_name = a;
          if (!payload.last_name && b.length) payload.last_name = b.join(' ');
        }
        try {
          for (const [k, v] of Object.entries(payload)) {
            if (v && typeof v === 'object' && v.create) {
              const id = await createLinked(v.target, v.create);
              lookups[v.target.reg.id].set(v.create.toLowerCase(), id);
              lookups[v.target.reg.id].set(norm(v.create), id);
              payload[k] = id;
            }
          }
          if (!Object.keys(payload).length) { skipped++; continue; }
          const title = titleOf(spec, { payload }).toLowerCase();
          if (dedupe.checked && title !== 'untitled' && existing.has(title)) { skipped++; continue; }
          await api('POST', '/api/vault/insert-record', { registry_id: spec.reg.id, payload });
          existing.add(title);
          ok++;
          if (rowProblems.length && problems.length < 40) problems.push(`Row ${i + 2}: ${rowProblems.join('; ')} (left blank)`);
        } catch (e) {
          failed++;
          if (problems.length < 40) problems.push(`Row ${i + 2}: ${e.message}${e.details ? ' — ' + [].concat(e.details).map((d) => humanizeError(spec, d)).join(', ') : ''}`);
        }
        if (i % 10 === 0 || i === total - 1) {
          bar.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
          label.textContent = `${(i + 1).toLocaleString()} of ${total.toLocaleString()}`;
          await new Promise((r) => setTimeout(r));
        }
      }
      Object.keys(cache).forEach((k) => delete cache[k]);
      await refreshCounts();
      status.replaceChildren(
        el('div', { class: 'imp-done' }, icon('check'), el('b', {}, `${ok.toLocaleString()} imported`),
          skipped ? el('span', {}, `${skipped} skipped (duplicates or empty)`) : null, failed ? el('span', { class: 'bad' }, `${failed} couldn’t be imported`) : null),
        problems.length ? el('details', { class: 'imp-problems' }, el('summary', {}, `Notes on ${problems.length} row${problems.length === 1 ? '' : 's'}`), el('ul', {}, problems.map((x) => el('li', {}, x)))) : null);
      go.replaceWith(el('a', { class: 'btn primary', href: '#/t/' + spec.key, onclick: () => { closeDrawer(); setTimeout(render, 50); } }, `Open ${labelOf(spec)}`, icon('arrowR')));
      const back = $('#drawer .drawer-foot .btn.ghost'); if (back) back.textContent = 'Import another file';
      toast(`${ok.toLocaleString()} ${ok === 1 ? spec.single : 'records'} imported`);
    }
  }

  function csvCell(v) { const x = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; }
  async function exportCSV(spec) {
    const recs = await loadWithRefs(spec);
    const keys = Object.keys(schemaOf(spec)).filter((k) => !(spec.hide || []).includes(k));
    const lines = [keys.map((k) => csvCell(fieldLabel(spec, k))).join(',')];
    recs.forEach((r) => lines.push(keys.map((k) => {
      const v = r.payload[k];
      const t = typeOf(spec, k);
      return csvCell(t.base === 'REF' && v ? refLabel(t.target, v) : v);
    }).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${slug(labelOf(spec)) || 'export'}-${todayISO()}.csv` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Exported ${recs.length} ${recs.length === 1 ? spec.single : 'records'}`);
  }

  function pageFoot(r) {
    const spec = r.name === 'table' ? byKey[r.key] : null;
    const target = spec && spec.key !== 'feed' ? spec.key : 'deals';
    return el('footer', { class: 'page-foot' },
      el('div', { class: 'pf-brand' }, el('img', { src: 'img/vault-logo.svg', width: 22, height: 22, alt: '' }), el('span', {}, 'VaultCRM')),
      el('div', { class: 'pf-actions' },
        el('button', { class: 'btn', type: 'button', onclick: () => openImport(target) }, icon('upload'), el('span', {}, 'Import CSV')),
        el('button', { class: 'btn', type: 'button', onclick: () => (spec && spec.key !== 'feed' ? exportCSV(spec) : exportBackup()) }, icon('download'), el('span', {}, spec && spec.key !== 'feed' ? 'Export CSV' : 'Backup'))));
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
    if (LOCAL && !(window.VaultLocal && VaultLocal.version >= 10)) {
      // An older cached engine came with this newer app: fetch the matching set once
      let tried = false; try { tried = sessionStorage.getItem('vault_heal') === '1'; sessionStorage.setItem('vault_heal', '1'); } catch (_) {}
      if (!tried) {
        try { if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k); } catch (_) {}
        location.replace(location.pathname + '?r=' + Date.now() + location.hash);
        return;
      }
    }
    wireChrome();
    wireMotion();
    applyTheme();
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const bell = el('button', { class: 'icon-btn bell-btn', id: 'bellBtn', 'aria-label': 'Notifications', onclick: openInbox }, icon('bell'));
    $('#themeBtn').before(bell);
    document.body.append(el('button', { class: 'chat-fab', id: 'chatFab', type: 'button', 'aria-label': 'Team chat', onclick: () => openChat() }, icon('chat'), el('span', { class: 'fab-label' }, 'Chat')));
    const pill = $('#modePill');
    try {
      await api('GET', '/api/health');
      pill.textContent = LOCAL ? 'Browser mode' : 'Live';
      pill.className = 'mode-pill on';
      pill.title = LOCAL ? 'Data is saved in this browser on this device' : 'Connected to the server';
      await bootstrap();
      await ensureMe();
      if (settings.sampleVersion !== SAMPLE_VERSION && (hasSample() || await strayedSample())) {
        // Older or half-loaded sample records → the current full sample. Records you added stay.
        try { await resetSample(); toast('Sample data updated: 30 example customers'); }
        catch (e) { console.warn('Sample refresh failed', e.message); toast('Couldn’t finish loading sample data. Open Settings → Sample data to retry.', true); }
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
