/* ═══════════════════════════════════════════════════
   MALGUDI CRANES — Shared Navigation, Auth & Helpers
   v2.0 — with Google Sheets Live Integration
   ═══════════════════════════════════════════════════ */

const MALGUDI = {
  API: 'http://localhost:3000/api',

  // ── GOOGLE SHEETS CONFIG ──────────────────────────
  // Step 1: Open your Google Sheet
  // Step 2: File → Share → Publish to web → Sheet: "Lead Tracker" → CSV
  // Step 3: Paste the URL below and set USE_GSHEETS: true
  GSHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv',
  USE_GSHEETS: false,   // ← change to true after setting URL above
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

// ══════════════════════════════════
// DATA FETCHING — API + Google Sheets
// ══════════════════════════════════
async function fetchData(endpoint, query = '') {
  // 1. Try backend REST API
  try {
    const r = await fetch(`${MALGUDI.API}/${endpoint}${query ? '?' + query : ''}`);
    if (r.ok) { const d = await r.json(); if (d) return d; }
  } catch(e) {}
  // 2. Fallback to Google Sheets (leads only)
  if (MALGUDI.USE_GSHEETS && endpoint === 'leads') return await fetchGSheets();
  return null;
}

async function fetchGSheets() {
  try {
    const r = await fetch(MALGUDI.GSHEET_URL);
    if (!r.ok) throw new Error('Sheet not accessible');
    const csv = await r.text();
    const rows = csv.trim().split('\n');
    const headers = parseCSVRow(rows[0]);
    const data = rows.slice(1).filter(r => r.trim()).map(row => {
      const vals = parseCSVRow(row);
      const obj = {};
      headers.forEach((h, i) => obj[h.replace(/"/g,'').trim()] = (vals[i]||'').replace(/"/g,'').trim());
      return obj;
    });
    return { total: data.length, data, source: 'gsheets' };
  } catch(e) {
    console.warn('Google Sheets fetch failed:', e.message);
    return null;
  }
}

function parseCSVRow(row) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') inQ = !inQ;
    else if (row[i] === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += row[i];
  }
  result.push(cur);
  return result;
}

// Show Google Sheets sync status in header
function updateSyncStatus(source) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  if (source === 'gsheets') {
    el.innerHTML = `<span class="gsync-dot live"></span> Google Sheets Live`;
    el.style.color = 'var(--green)';
  } else if (source === 'api') {
    el.innerHTML = `<span class="gsync-dot live"></span> API Connected`;
    el.style.color = 'var(--green)';
  } else {
    el.innerHTML = `<span class="gsync-dot offline"></span> Sample Data`;
    el.style.color = 'var(--amber)';
  }
}

// ══════════════════════════════════
// HELPERS
// ══════════════════════════════════
function fmtINR(n) {
  n = parseFloat(n) || 0;
  if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n/1e5).toFixed(1) + ' L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(1) + ' K';
  return '₹' + n.toFixed(0);
}
function parseVal(v) { return parseFloat(String(v||'0').replace(/[₹,\s]/g,''))||0; }
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
function mkChart(id, cfg) {
  if (CH[id]) { CH[id].destroy(); delete CH[id]; }
  const el = document.getElementById(id);
  if (!el) return;
  CH[id] = new Chart(el, cfg);
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
