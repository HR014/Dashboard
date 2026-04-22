/**
 * LeadFlow Dashboard — Frontend Script
 * Features: API polling, dynamic charts, filters, export, auth, dark/light mode
 */

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';
const REFRESH_INTERVAL = 30; // seconds

// Chart.js global defaults
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.color = '#64748b';

// Chart instances registry
const charts = {};

// State
let currentPage = 1;
const pageSize = 15;
let allLeads = [];
let filteredLeads = [];
let refreshCountdown = REFRESH_INTERVAL;
let refreshTimer = null;

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
const USERS = { admin: 'admin123', manager: 'manager456' };

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  const err = document.getElementById('login-error');

  if (USERS[user] && USERS[user] === pass) {
    sessionStorage.setItem('lf_auth', user);
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.querySelector('.user-avatar').textContent = user[0].toUpperCase();
    document.querySelector('.user-badge span').textContent = user;
    initDashboard();
  } else {
    err.style.display = 'block';
    err.textContent = 'Invalid username or password';
  }
}

function handleLogout() {
  if (!confirm('Sign out?')) return;
  sessionStorage.removeItem('lf_auth');
  location.reload();
}

// Check session on load
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('lf_auth');
  if (saved && USERS[saved]) {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.querySelector('.user-avatar').textContent = saved[0].toUpperCase();
    document.querySelector('.user-badge span').textContent = saved;
    initDashboard();
  }

  // Enter key on login
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
});

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-btn');
  const isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.setAttribute('data-theme', 'dark');
    btn.textContent = '🌙';
    Chart.defaults.color = '#64748b';
  } else {
    html.setAttribute('data-theme', 'light');
    btn.textContent = '☀️';
    Chart.defaults.color = '#475569';
  }
  localStorage.setItem('lf_theme', isLight ? 'dark' : 'light');
  // Redraw charts
  Object.values(charts).forEach(c => { if (c && c.destroy) c.destroy(); });
  Object.keys(charts).forEach(k => delete charts[k]);
  loadAllData();
}

(function initTheme() {
  const t = localStorage.getItem('lf_theme');
  if (t) {
    document.documentElement.setAttribute('data-theme', t);
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-btn');
      if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
    });
    Chart.defaults.color = t === 'light' ? '#475569' : '#64748b';
  }
})();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function fmtINR(n) {
  if (!n || isNaN(n)) return '₹0';
  n = parseFloat(n);
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}

function getChartColors() {
  return ['#3b82f6','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#6366f1','#059669','#f97316','#ec4899','#14b8a6','#8b5cf6'];
}

function getTooltipConfig() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    backgroundColor: isLight ? '#ffffff' : '#1c2438',
    titleColor: isLight ? '#475569' : '#94a3b8',
    bodyColor: isLight ? '#0f172a' : '#f1f5f9',
    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
  };
}

function getGridColor() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
}

function buildQuery() {
  const params = new URLSearchParams();
  const from = document.getElementById('f-from').value;
  const to = document.getElementById('f-to').value;
  const state = document.getElementById('f-state').value;
  const product = document.getElementById('f-product').value;
  const owner = document.getElementById('f-owner').value;
  const source = document.getElementById('f-source').value;
  const status = document.getElementById('f-status').value;
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (state && state !== 'all') params.set('state', state);
  if (product && product !== 'all') params.set('product', product);
  if (owner && owner !== 'all') params.set('owner', owner);
  if (source && source !== 'all') params.set('source', source);
  if (status && status !== 'all') params.set('status', status);
  return params.toString();
}

async function fetchAPI(endpoint, query = '') {
  const url = `${API_BASE}/${endpoint}${query ? '?' + query : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
async function initDashboard() {
  await loadFilters();
  await loadAllData();
  startRefreshTimer();
}

async function loadFilters() {
  try {
    const data = await fetchAPI('filters');
    populateSelect('f-state', data.states);
    populateSelect('f-product', data.products);
    populateSelect('f-owner', data.owners);
    populateSelect('f-source', data.sources);
    populateSelect('f-status', data.statuses);
  } catch (e) {
    console.warn('Filter load failed, using defaults');
  }
}

function populateSelect(id, items) {
  const el = document.getElementById(id);
  const current = el.value;
  // Keep first "All" option
  while (el.options.length > 1) el.remove(1);
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = item;
    el.appendChild(opt);
  });
  if (current) el.value = current;
}

// ─────────────────────────────────────────────
// LOAD ALL DATA
// ─────────────────────────────────────────────
async function loadAllData() {
  const q = buildQuery();
  try {
    const [summary, funnel, revenue, conversion, lossData, trends, leads] = await Promise.all([
      fetchAPI('summary', q),
      fetchAPI('funnel', q),
      fetchAPI('revenue', q),
      fetchAPI('conversion', q),
      fetchAPI('loss-analysis', q),
      fetchAPI('trends', q),
      fetchAPI('leads', q + (q ? '&' : '') + `limit=1000`)
    ]);

    updateKPIs(summary);
    renderFunnel(funnel.stages, summary.totalLeads);
    renderSourcePie(leads.data);
    renderProductRevenue(revenue.byProduct);
    renderTrend(trends);
    renderStateBar(leads.data);
    renderOwnerPerformance(conversion.byOwner);
    renderLossAnalysis(lossData.reasons);
    renderRevenueByState(revenue.byState);
    renderTable(leads.data);

    allLeads = leads.data;
    filteredLeads = leads.data;

    document.getElementById('last-updated').textContent =
      'Last updated: ' + new Date().toLocaleTimeString();

  } catch (e) {
    console.error('Data load error:', e);
  }
}

function applyFilters() {
  currentPage = 1;
  loadAllData();
}

function resetFilters() {
  ['f-from','f-to'].forEach(id => document.getElementById(id).value = '');
  ['f-state','f-product','f-owner','f-source','f-status'].forEach(id => document.getElementById(id).value = 'all');
  applyFilters();
}

// ─────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────
function updateKPIs(s) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('v-total', s.totalLeads);
  set('v-active', s.activeLeads);
  set('v-quot', s.quotationsGenerated);
  set('v-won', s.ordersWon);
  set('v-lost', s.ordersLost);
  set('v-conv', s.conversionRate + '%');
  set('v-rev', fmtINR(s.totalExpectedRevenue));
  set('v-won-rev', fmtINR(s.wonRevenue));
}

// ─────────────────────────────────────────────
// FUNNEL CHART (Custom CSS-based)
// ─────────────────────────────────────────────
function renderFunnel(stages, total) {
  const container = document.getElementById('funnel-container');
  container.innerHTML = '';

  const colors = [
    { bg: '#6366f1', light: 'rgba(99,102,241,0.15)' },
    { bg: '#3b82f6', light: 'rgba(59,130,246,0.15)' },
    { bg: '#10b981', light: 'rgba(16,185,129,0.15)' },
    { bg: '#ef4444', light: 'rgba(239,68,68,0.15)' },
  ];

  stages.forEach((s, i) => {
    const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : 0;
    const width = Math.max(20, parseInt(pct));
    const color = colors[i] || colors[colors.length - 1];

    const step = document.createElement('div');
    step.className = 'funnel-step';
    step.style.cssText = `background: ${color.bg}; width: ${Math.min(100, 100 - i * 8)}%; margin: 0 auto;`;
    step.innerHTML = `
      <div>
        <div class="funnel-label">${s.stage}</div>
        <div class="funnel-pct">${pct}% of total</div>
      </div>
      <div class="funnel-count">${s.count}</div>
    `;
    container.appendChild(step);
  });
}

// ─────────────────────────────────────────────
// SOURCE PIE
// ─────────────────────────────────────────────
function renderSourcePie(leads) {
  const counts = {};
  leads.forEach(l => {
    const src = l['Lead Source'] || 'Unknown';
    counts[src] = (counts[src] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = getChartColors();
  const tt = getTooltipConfig();

  if (charts.source) charts.source.destroy();
  charts.source = new Chart(document.getElementById('chart-source'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 10 } },
        tooltip: { ...tt, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} leads` } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// PRODUCT REVENUE
// ─────────────────────────────────────────────
function renderProductRevenue(byProduct) {
  const labels = Object.keys(byProduct);
  const data = Object.values(byProduct);
  const colors = getChartColors();
  const tt = getTooltipConfig();

  if (charts.product) charts.product.destroy();
  charts.product = new Chart(document.getElementById('chart-product'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 10 } },
        tooltip: { ...tt, callbacks: { label: ctx => ` ${ctx.label}: ${fmtINR(ctx.raw)}` } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// MONTHLY TREND
// ─────────────────────────────────────────────
function renderTrend(trends) {
  const labels = Object.keys(trends);
  const total = labels.map(k => trends[k].total);
  const won = labels.map(k => trends[k].won);
  const quots = labels.map(k => trends[k].quotations);
  const grid = getGridColor();
  const tt = getTooltipConfig();

  if (charts.trend) charts.trend.destroy();
  charts.trend = new Chart(document.getElementById('chart-trend'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Leads', data: total,
          borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
          borderWidth: 2.5, pointRadius: 4, fill: true, tension: 0.4
        },
        {
          label: 'Quotations', data: quots,
          borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)',
          borderWidth: 2, pointRadius: 4, fill: true, tension: 0.4
        },
        {
          label: 'Won', data: won,
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)',
          borderWidth: 2, pointRadius: 4, fill: true, tension: 0.4
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' }, tooltip: tt },
      scales: {
        x: { grid: { color: grid } },
        y: { grid: { color: grid }, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// STATE BAR
// ─────────────────────────────────────────────
function renderStateBar(leads) {
  const counts = {};
  leads.forEach(l => {
    const s = l['State'] || 'Unknown';
    counts[s] = (counts[s] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const data = sorted.map(e => e[1]);
  const grid = getGridColor();
  const tt = getTooltipConfig();

  if (charts.state) charts.state.destroy();
  charts.state = new Chart(document.getElementById('chart-state'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Leads',
        data,
        backgroundColor: getChartColors(),
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: tt },
      scales: {
        x: { grid: { color: grid }, beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// OWNER PERFORMANCE
// ─────────────────────────────────────────────
function renderOwnerPerformance(byOwner) {
  const owners = Object.keys(byOwner);
  const total = owners.map(o => byOwner[o].total);
  const won = owners.map(o => byOwner[o].won);
  const grid = getGridColor();
  const tt = getTooltipConfig();

  if (charts.owner) charts.owner.destroy();
  charts.owner = new Chart(document.getElementById('chart-owner'), {
    type: 'bar',
    data: {
      labels: owners,
      datasets: [
        { label: 'Total Leads', data: total, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 5, borderSkipped: false },
        { label: 'Won',         data: won,   backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 5, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          ...tt,
          callbacks: {
            afterBody: (items) => {
              const owner = items[0].label;
              const rate = byOwner[owner]?.rate || 0;
              return [`Conversion: ${rate}%`];
            }
          }
        }
      },
      scales: {
        x: { grid: { color: grid } },
        y: { grid: { color: grid }, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// LOSS ANALYSIS
// ─────────────────────────────────────────────
function renderLossAnalysis(reasons) {
  const filtered = Object.entries(reasons).filter(([k]) => k && k !== 'Unknown' && k !== '');
  if (!filtered.length) {
    const canvas = document.getElementById('chart-loss');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const labels = filtered.map(e => e[0]);
  const data = filtered.map(e => e[1]);
  const colors = ['#ef4444','#f97316','#f59e0b','#a855f7','#6366f1','#ec4899'];
  const tt = getTooltipConfig();

  if (charts.loss) charts.loss.destroy();
  charts.loss = new Chart(document.getElementById('chart-loss'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Lost Orders',
        data,
        backgroundColor: colors,
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: tt },
      scales: {
        x: { grid: { color: getGridColor() }, beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// REVENUE BY STATE
// ─────────────────────────────────────────────
function renderRevenueByState(byState) {
  const sorted = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(e => e[0]);
  const data = sorted.map(e => e[1]);
  const tt = getTooltipConfig();

  if (charts.revState) charts.revState.destroy();
  charts.revState = new Chart(document.getElementById('chart-rev-state'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data,
        backgroundColor: 'rgba(99,102,241,0.75)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { ...tt, callbacks: { label: ctx => ' ' + fmtINR(ctx.raw) } }
      },
      scales: {
        x: { grid: { color: getGridColor() }, ticks: { callback: v => fmtINR(v) } },
        y: { grid: { display: false } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// LEADS TABLE
// ─────────────────────────────────────────────
function renderTable(leads) {
  filteredLeads = leads;
  currentPage = 1;
  renderPage();
}

function searchTable() {
  const q = document.getElementById('table-search').value.toLowerCase();
  filteredLeads = allLeads.filter(l => {
    return (
      (l['Company Name'] || '').toLowerCase().includes(q) ||
      (l['Contact Person'] || '').toLowerCase().includes(q) ||
      (l['State'] || '').toLowerCase().includes(q) ||
      (l['Product Type'] || '').toLowerCase().includes(q) ||
      (l['Lead Owner'] || '').toLowerCase().includes(q)
    );
  });
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const tbody = document.getElementById('leads-tbody');
  const start = (currentPage - 1) * pageSize;
  const page = filteredLeads.slice(start, start + pageSize);

  tbody.innerHTML = page.map((l, i) => {
    const status = l['Inquiry Status'] || '';
    const statusClass = /won|order confirmed|converted/i.test(status) ? 'status-won'
                      : /lost|rejected|cancelled/i.test(status) ? 'status-lost'
                      : /quotation|sent/i.test(status) ? 'status-quot'
                      : /inquiry/i.test(status) ? 'status-inq'
                      : 'status-other';

    const val = parseFloat(String(l['Expected Order Value'] || '0').replace(/[₹,\s]/g, '')) || 0;

    return `<tr>
      <td style="color:var(--text3);font-family:var(--mono)">${l['Sr No'] || start + i + 1}</td>
      <td style="font-family:var(--mono);font-size:0.75rem">${l['Date'] || '—'}</td>
      <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis">${l['Company Name'] || '—'}</td>
      <td>${l['Location'] || '—'}</td>
      <td>${l['State'] || '—'}</td>
      <td>${l['Product Type'] || '—'}</td>
      <td>${l['Contact Person'] || '—'}</td>
      <td style="font-size:0.75rem">${l['Lead Owner'] || '—'}</td>
      <td style="font-size:0.75rem">${l['Lead Source'] || '—'}</td>
      <td style="font-family:var(--mono);font-size:0.75rem">${l['Quotation No'] || '—'}</td>
      <td style="font-family:var(--mono);font-weight:600;color:var(--amber)">${val ? fmtINR(val) : '—'}</td>
      <td><span class="status-badge ${statusClass}">${status || 'Inquiry'}</span></td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;color:var(--text2);font-size:0.75rem">${l['Remarks'] || '—'}</td>
    </tr>`;
  }).join('');

  const total = filteredLeads.length;
  const totalPages = Math.ceil(total / pageSize);
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages} (${total} records)`;
  document.getElementById('table-count').textContent = `Showing ${Math.min(start + pageSize, total)} of ${total} records`;
  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;
}

function changePage(dir) {
  currentPage += dir;
  renderPage();
}

// ─────────────────────────────────────────────
// EXPORT TO EXCEL
// ─────────────────────────────────────────────
function exportToExcel() {
  if (!filteredLeads || !filteredLeads.length) {
    alert('No data to export');
    return;
  }

  const headers = ['Sr No','Date','Company Name','Location','State','Product Type',
    'Capacity/Specs','Contact Person','Phone','Email','Lead Source','Lead Owner',
    'Quotation No','Quotation Date','Expected Order Value','Inquiry Status','Quotation Status',
    'Order Loss Analysis','Remarks'];

  const rows = filteredLeads.map(l => headers.map(h => l[h] || ''));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Column widths
  ws['!cols'] = headers.map((h, i) => ({ wch: [8,12,30,15,15,15,20,18,14,25,15,15,15,15,18,15,15,20,30][i] || 15 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Lead Tracker');

  // Summary sheet
  const summary = [
    ['LeadFlow Export — ' + new Date().toLocaleDateString()],
    [],
    ['Total Leads', filteredLeads.length],
    ['Won Orders', filteredLeads.filter(l => /won|converted/i.test(l['Inquiry Status'] || '')).length],
    ['Lost Orders', filteredLeads.filter(l => /lost|rejected/i.test(l['Inquiry Status'] || '')).length],
    ['Total Revenue', filteredLeads.reduce((s, l) => s + (parseFloat(String(l['Expected Order Value'] || '0').replace(/[₹,\s]/g,'')) || 0), 0)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  XLSX.writeFile(wb, `LeadFlow_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─────────────────────────────────────────────
// AUTO REFRESH
// ─────────────────────────────────────────────
function startRefreshTimer() {
  clearInterval(refreshTimer);
  refreshCountdown = REFRESH_INTERVAL;

  refreshTimer = setInterval(() => {
    refreshCountdown--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = refreshCountdown;

    if (refreshCountdown <= 0) {
      refreshCountdown = REFRESH_INTERVAL;
      loadAllData();
    }
  }, 1000);
}
