/* ═══════════════════════════════════════════════════
   MALGUDI CRANES — Shared Navigation, Auth & Helpers
   v2.0 — backend Excel integration
   ═══════════════════════════════════════════════════ */

const MALGUDI = {
  API: `${window.location.origin}/api`,

  // ── GOOGLE SHEETS CONFIG ──────────────────────────
  // Step 1: Open your Google Sheet
  // Step 2: File → Share → Publish to web → Sheet: "Lead Tracker" → CSV
  // Leads load from backend/data/Lead Tracker.xlsx by default.
  GSHEET_URL: 'https://docs.google.com/spreadsheets/d/1T3EUC1JTjE9WGfoWqACtXKCjq5OAWvbI1kKcAe8BOnc/gviz/tq?tqx=out:csv&sheet=Lead%20Tracker',
  SALES_SHEET_ID: '1K3OJfyovT8gOgN785XHsRWaxJSVpZxN4P-28V-0zsIA',
  USE_GSHEETS: false,
  LEAD_SHEETS: {
    '2024-2025': '2024-2025',
    '2025-2026': '2025-2026',
    '2026-2027': '2026-2027'
  },
  GSHEET_INTERVAL: 30, // refresh every 30 seconds
  // ─────────────────────────────────────────────────

  USERS: { admin: 'admin123', manager: 'manager456', accounts: 'accounts789' },
  COLORS: ['#3b82f6','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#6366f1','#f97316','#ec4899','#14b8a6','#84cc16','#f43f5e'],
  REFRESH: 30,

  PAGES: [
    { id:'home',     label:'Home',         icon:'🏠', file:'index.html',    color:'#3b82f6' },
    { id:'leads',    label:'Lead Tracker', icon:'📋', file:'leads.html',    color:'#6366f1' },
    { id:'sales',    label:'Sales',        icon:'💹', file:'sales.html',    color:'#10b981' },
    { id:'projects', label:'Projects',     icon:'🔧', file:'projects.html', color:'#f59e0b' },
    { id:'services', label:'Services',     icon:'⚙️', file:'services.html', color:'#06b6d4' },
    { id:'design',   label:'Design',       icon:'📐', file:'design.html',   color:'#a855f7' },
    { id:'accounts', label:'Accounts',     icon:'🏦', file:'accounts.html', color:'#f43f5e' },
  ]
};

// ══════════════════════════════════
// AUTH
// ══════════════════════════════════
function checkAuth() {
  const u = sessionStorage.getItem('mg_user');
  if (!u || !MALGUDI.USERS[u]) { window.location.href = 'login.html'; return null; }
  return u;
}
function doLogout() {
  if (!confirm('Sign out of Malgudi BI Hub?')) return;
  sessionStorage.removeItem('mg_user');
  window.location.href = 'login.html';
}

// ══════════════════════════════════
// NAVIGATION
// ══════════════════════════════════
function buildNav(activePage) {
  const user = checkAuth();
  if (!user) return;
  const navEl = document.getElementById('mainNav');
  const userAv = document.getElementById('userAv');
  const userNm = document.getElementById('userNm');
  if (userAv) userAv.textContent = user[0].toUpperCase();
  if (userNm) userNm.textContent = user;
  if (!navEl) return;
  navEl.innerHTML = MALGUDI.PAGES.map(p => `
    <a href="${p.file}" class="nav-link ${activePage === p.id ? 'active' : ''}" style="--link-color:${p.color}">
      <span class="dot"></span>${p.icon} ${p.label}
    </a>
  `).join('');
}

/**
 * Centralized Tab/Entity Switching Logic
 * Handles .active toggling for buttons and visibility for panels.
 * Accessible globally as switchTab() or switchSalesEntity().
 */
function switchTab(id) {
  if (!id) return;

  // Update global state variables if the current page uses them
  if (typeof window.CURRENT_ENTITY !== 'undefined') window.CURRENT_ENTITY = id;
  if (typeof window.CURRENT_TAB !== 'undefined') window.CURRENT_TAB = id;
  if (typeof window.CURRENT_SALES_ENTITY !== 'undefined') window.CURRENT_SALES_ENTITY = id;

  // Toggle 'active' class on any element with matching data-tab or data-ent
  document.querySelectorAll('[data-tab], [data-ent], [data-sales-entity]').forEach(el => {
    const val = el.dataset.tab || el.dataset.ent || el.dataset.salesEntity;
    el.classList.toggle('active', val === id);
  });

  // Toggle visibility for elements with .tab-panel class or data-panel attribute
  document.querySelectorAll('.tab-panel, [data-panel]').forEach(panel => {
    const isMatch = panel.id === `${id}-panel` || panel.dataset.panel === id;
    panel.classList.toggle('active', isMatch);
    if (panel.classList.contains('tab-panel')) {
      panel.style.display = isMatch ? 'block' : 'none';
    }
  });

  // Trigger page-specific refresh functions if they exist
  if (typeof updateAll === 'function') updateAll();
  if (typeof renderCharts === 'function') renderCharts();
}

// Expose globally for both JS access and HTML onclick handlers
window.switchTab = switchTab;
window.switchSalesEntity = switchTab;

function applyFilters() {}

function resetFilters() {
  ['fFrom','fTo','tblSearch'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['fState','fProd','fOwner','fSrc','fStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  if (typeof renderCharts === 'function') renderCharts();
  if (typeof renderTable === 'function') renderTable();
}

// Global delegated click handler for tab buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab], [data-ent], [data-sales-entity]');
  // Only trigger if it's a tab button (and doesn't have an href)
  if (btn && !btn.getAttribute('href')) {
    e.preventDefault();
    const id = btn.dataset.tab || btn.dataset.ent || btn.dataset.salesEntity;
    switchTab(id);
  }
});

// ══════════════════════════════════
// THEME
// ══════════════════════════════════
function initTheme() {
  const t = localStorage.getItem('mg_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'light' ? '☀️ Light' : '🌙 Dark';
}
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mg_theme', next);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = next === 'light' ? '☀️ Light' : '🌙 Dark';
  if (typeof Chart !== 'undefined') Chart.defaults.color = next === 'light' ? '#475569' : '#64748b';
  if (typeof redrawCharts === 'function') redrawCharts();
}

/**
 * Returns the current Financial Year string (e.g., "2025-2026")
 */
function getCurrentFY() {
  const now = new Date();
  const year = now.getFullYear();
  // April (month 3) starts the FY in India
  return (now.getMonth() >= 3) ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
window.getCurrentFY = getCurrentFY; // Expose for page-level initialization

// ══════════════════════════════════
// DATA FETCHING — API + Google Sheets
// ══════════════════════════════════
async function fetchData(endpoint, query = '') {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);

  // Prefer Google Sheets for leads when enabled, then fall back to API/sample data.
  if (MALGUDI.USE_GSHEETS && endpoint === 'leads') {
    const year = params.get('year') || getCurrentFY();
    const sheetData = await fetchGSheets(year);
    if (sheetData) return sheetData;
  }

  try {
    // If fetching leads and no year is specified, default to current FY
    if (endpoint === 'leads' && !params.has('year')) {
      params.set('year', getCurrentFY());
    }
    params.set('_', Date.now());
    const r = await fetch(`${MALGUDI.API}/${endpoint}?${params.toString()}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      if (d) {
        if (MALGUDI.USE_GSHEETS && endpoint === 'leads') d.sheetFallback = true;
        return d;
      }
    }
  } catch(e) {}
  return null;
}

async function fetchGSheets(year) {
  try {
    let csv = '';
    let lastStatus = '';
    const sheetName = MALGUDI.LEAD_SHEETS[year] || 'Lead Tracker';

    for (const url of getSheetCsvUrls(MALGUDI.GSHEET_URL, sheetName)) {
      const bust = url.includes('?') ? '&' : '?';
      const proxiedUrl = `${MALGUDI.API}/sheet-csv?url=${encodeURIComponent(`${url}${bust}_=${Date.now()}`)}`;
      const r = await fetch(proxiedUrl);
      lastStatus = `${r.status} ${r.statusText}`;
      if (r.ok) {
        csv = await r.text();
        break;
      }
    }
    if (!csv) throw new Error(`Sheet CSV not accessible (${lastStatus})`);
    const rows = parseCSVRows(csv.trim());
    const headers = parseCSVRow(rows[0]).map(cleanHeader);
    const data = rows.slice(1).filter(r => r.trim()).map(row => {
      const vals = parseCSVRow(row);
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = cleanCell(vals[i]); });
      return normalizeLeadRow(obj);
    }).filter(row => row.Sr || row.Date || row['Company Name']);
    return { total: data.length, data, source: 'gsheets' };
  } catch(e) {
    console.warn('Google Sheets fetch failed:', e.message);
    return null;
  }
}

function getSheetCsvUrls(url, sheetName = 'Lead Tracker') {
  const raw = String(url || '').trim();
  const match = raw.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return [raw];
  const gid = (raw.match(/[?&]gid=(\d+)/) || [null, '0'])[1];
  const id = match[1];
  return [
    raw.replace(/sheet=[^&]+/, `sheet=${encodeURIComponent(sheetName)}`),
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`,
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/pub?gid=${gid}&single=true&output=csv`
  ];
}

function cleanHeader(value) {
  return String(value || '').replace(/"/g, '').replace(/\s+/g, ' ').trim();
}

function cleanCell(value) {
  return String(value || '').replace(/^"|"$/g, '').trim();
}

function normalizeLeadRow(row) {
  const compact = {};
  Object.entries(row).forEach(([key, value]) => {
    compact[cleanHeader(key).toLowerCase()] = value;
  });
  const pick = (...keys) => keys.map(k => compact[cleanHeader(k).toLowerCase()]).find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';
  const normalized = { ...row };

  normalized.Sr = pick('Sr', 'Sr no', 'Sr No', 'SR NO', 'S.No', 'S No', 'Serial No') || normalized.Sr;
  normalized.Date = normalizeDate(pick('Date', 'Lead Date', 'Inquiry Date'));
  normalized['Company Name'] = pick('Company Name', 'Company', 'Customer Name', 'Client Name');
  normalized.Location = pick('Location', 'City', 'Place');
  normalized.State = pick('State', 'States', 'Others', 'STATE');
  normalized['Product Type'] = pick('Product Type', 'Product', 'Product/Service');
  normalized['Capacity / Specs'] = pick('Capacity / Specs', 'Capacity', 'Specs', 'Requirement');
  normalized.Phone = pick('Phone', 'Mobile', 'Contact No', 'Contact Number');
  normalized.Email = pick('Email', 'Mail');
  normalized['Inquiry Status'] = pick('Inquiry Status', 'Status', 'Lead Status');
  normalized['Lead Source'] = pick('Lead Source', 'Source', 'Channel');
  normalized['Lead Owner'] = pick('Lead Owner', 'Owner', 'Sales Person', 'Salesperson');
  normalized['Contact Person'] = pick('Contact Person', 'Contact', 'Person');
  normalized['Quotation No'] = pick('Quotation No', 'Quote No', 'Quotation Number');
  normalized['Quotation Date'] = normalizeDate(pick('Quotation Date', 'Quote Date'));
  normalized['PO Date'] = normalizeDate(pick('PO Date', 'PO DATE', 'PO DAT', 'Purchase Order Date', 'Order Date'));
  normalized['Expected Order Value'] = pick('Expected Order Value', 'Order Value', 'Value', 'Amount');
  normalized['Quotation Status'] = pick('Quotation Status', 'Quote Status');
  normalized['Order Loss Analysis'] = pick('Order Loss Analysis', 'Order loss Analysis', 'Loss Analysis', 'Order Loss');
  normalized.Remarks = pick('Remarks', 'Remark', 'Notes');

  return normalized;
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const dt = new Date(Math.round((Number(raw) - 25569) * 86400 * 1000));
    return isNaN(dt) ? '' : dt.toISOString().slice(0, 10);
  }
  const m = raw.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/);
  if (m) {
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const month = months[m[2].slice(0,3).toLowerCase()];
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    if (month !== undefined) {
      const dt = new Date(Date.UTC(year, month, Number(m[1])));
      return dt.toISOString().slice(0, 10);
    }
  }
  const dt = new Date(raw);
  return isNaN(dt) ? raw : dt.toISOString().slice(0, 10);
}

function parseCSVRow(row) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"' && row[i + 1] === '"') { cur += '"'; i++; }
    else if (row[i] === '"') inQ = !inQ;
    else if (row[i] === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += row[i];
  }
  result.push(cur);
  return result;
}

function parseCSVRows(csv) {
  const rows = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"' && csv[i + 1] === '"') { cur += '""'; i++; }
    else if (ch === '"') { inQ = !inQ; cur += ch; }
    else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (cur.trim()) rows.push(cur);
      cur = '';
      if (ch === '\r' && csv[i + 1] === '\n') i++;
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(cur);
  return rows;
}

// Show Google Sheets sync status in header
function updateSyncStatus(source) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  if (source === 'gsheets') {
    el.innerHTML = `<span class="gsync-dot live"></span> Google Sheets Live`;
    el.style.color = 'var(--green)';
  } else if (source === 'api-fallback') {
    el.innerHTML = `<span class="gsync-dot offline"></span> Sheet Failed - API Fallback`;
    el.style.color = 'var(--amber)';
  } else if (source === 'api') {
    el.innerHTML = `<span class="gsync-dot live"></span> Excel File Live`;
    el.style.color = 'var(--green)';
  } else {
    el.innerHTML = `<span class="gsync-dot offline"></span> Sample Data`;
    el.style.color = 'var(--amber)';
  }
}

// ══════════════════════════════════
// HELPERS
// ══════════════════════════════════
function fmtDateLabel(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day = String(dt.getDate()).padStart(2, '0');
  const mon = dt.toLocaleString('en-IN', { month: 'short' }).replace('.', '');
  return `${day}-${mon}-${dt.getFullYear()}`;
}
function fmtINR(n) {
  n = parseFloat(n) || 0;
  if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n/1e5).toFixed(1) + ' L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(1) + ' K';
  return '₹' + n.toFixed(0);
}
function parseVal(v) { return parseFloat(String(v||'0').replace(/[^0-9.-]/g,''))||0; }
function groupBy(arr, key) { return arr.reduce((a,i)=>{ const k=i[key]||'Unknown'; a[k]=(a[k]||0)+1; return a; },{}); }
function sumByKey(arr,kG,kS) { return arr.reduce((a,i)=>{ const k=i[kG]||'Unknown'; a[k]=(a[k]||0)+parseVal(i[kS]); return a; },{}); }
function setV(id,val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function getChartOpts() {
  const L = document.documentElement.getAttribute('data-theme')==='light';
  return {
    tt:{ backgroundColor:L?'#ffffff':'#1a2235', titleColor:L?'#475569':'#94a3b8',
         bodyColor:L?'#0f172a':'#f1f5f9', borderColor:L?'#e2e8f0':'rgba(255,255,255,.1)',
         borderWidth:1, padding:10, cornerRadius:8 },
    grid: L?'rgba(0,0,0,.06)':'rgba(255,255,255,.04)'
  };
}
function startCountdown(seconds, onTick, onRefresh) {
  let count = seconds;
  return setInterval(()=>{ count--; onTick(count); if(count<=0){ count=seconds; onRefresh(); } }, 1000);
}
const CH = {};
function ensureChartBox(el, baseHeight) {
  let box = el.parentElement;
  if (!box || !box.classList.contains('chart-box')) {
    box = document.createElement('div');
    box.className = 'chart-box';
    el.parentNode.insertBefore(box, el);
    box.appendChild(el);
  }
  box.style.position = 'relative';
  box.style.width = '100%';
  box.style.height = `${baseHeight}px`;
  box.style.minHeight = `${baseHeight}px`;
  return box;
}
function mkChart(id, cfg) {
  if (CH[id]) { CH[id].destroy(); delete CH[id]; }
  const el = document.getElementById(id);
  if (!el) return;
  const baseHeight = parseInt(el.getAttribute('height') || '220', 10);
  ensureChartBox(el, baseHeight);
  el.removeAttribute('height');
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.inset = '0';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.maxWidth = '100%';
  el.style.maxHeight = '100%';
  CH[id] = new Chart(el, cfg);
  CH[id].resize();
  return CH[id];
}
function sortMonths(obj) {
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Object.fromEntries(Object.entries(obj).sort((a,b)=>{
    const [ma,ya]=a[0].split(' '); const [mb,yb]=b[0].split(' ');
    return ya!==yb?ya-yb:mo.indexOf(ma)-mo.indexOf(mb);
  }));
}
function monthKey(d) {
  const dt=new Date(d); if(isNaN(dt)) return null;
  return dt.toLocaleString('en-US',{month:'short'})+' '+dt.getFullYear();
}
