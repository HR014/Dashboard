/**
 * MALGUDI CRANES BI HUB — Backend Server
 * Node.js + Express · v2.0
 * 
 * Serves static frontend + REST API for dashboard data
 * Reads from Excel files in /data/ folder
 * 
 * Run: node server.js
 * Access: http://localhost:3000
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const XLSX     = require('xlsx');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use(express.static(path.join(__dirname, '../frontend')));  // serve frontend

// ── PATHS ───────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');

// ── HELPERS ─────────────────────────────────────────────
function readExcel(filename, sheetName) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  const wb = XLSX.readFile(fp);
  
  let ws = null;
  if (sheetName) {
    // Try exact match
    ws = wb.Sheets[sheetName];
    // If not found, try fuzzy match (lowercase, no spaces)
    if (!ws) {
      const target = sheetName.toLowerCase().replace(/[\s-]/g, '');
      const actualName = wb.SheetNames.find(n => n.toLowerCase().replace(/[\s-]/g, '') === target);
      if (actualName) ws = wb.Sheets[actualName];
    }
  }
  
  // Fallback to first sheet if no specific sheet requested or found
  if (!ws && !sheetName) ws = wb.Sheets[wb.SheetNames[0]];
  
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function getCurrentFY() {
  const now = new Date();
  const year = now.getFullYear();
  // April (month 3 in JS) is the start of the FY in India
  return (now.getMonth() >= 3) ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getPreviousFY(fy) {
  if (!fy || !fy.includes('-')) return null;
  const parts = fy.split('-');
  const s = parseInt(parts[0]);
  const e = parseInt(parts[1]);
  return (isNaN(s) || isNaN(e)) ? null : `${s - 1}-${e - 1}`;
}

function cleanHeader(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeDate(value) {
  if (value instanceof Date && !isNaN(value)) return value.toISOString().slice(0, 10);

  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = XLSX.SSF.parse_date_code(Number(raw));
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const m = raw.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/);
  if (m) {
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const month = months[m[2].slice(0, 3).toLowerCase()];
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    if (month !== undefined) {
      const dt = new Date(Date.UTC(year, month, Number(m[1])));
      return dt.toISOString().slice(0, 10);
    }
  }

  const dt = new Date(raw);
  return isNaN(dt) ? raw : dt.toISOString().slice(0, 10);
}

function normalizeLeadRow(row) {
  const compact = {};
  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith('__EMPTY')) compact[cleanHeader(key).toLowerCase()] = value;
  });

  const pick = (...keys) => {
    for (const key of keys) {
      const value = compact[cleanHeader(key).toLowerCase()];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  };

  return {
    Sr: pick('Sr', 'Sr no', 'Sr No', 'SR NO', 'S.No', 'S No', 'Serial No'),
    Date: normalizeDate(pick('Date', 'Lead Date', 'Inquiry Date')),
    'Company Name': pick('Company Name', 'Company', 'Customer Name', 'Client Name'),
    Location: pick('Location', 'City', 'Place'),
    State: pick('State', 'States', 'Others', 'STATE'),
    'Product Type': pick('Product Type', 'Product', 'Product/Service'),
    'Capacity / Specs': pick('Capacity / Specs', 'Capacity', 'Specs', 'Requirement'),
    Phone: pick('Phone', 'Mobile', 'Contact No', 'Contact Number'),
    Email: pick('Email', 'Mail'),
    'Inquiry Status': pick('Inquiry Status', 'Status', 'Lead Status'),
    'Contact Person': pick('Contact Person', 'Contact', 'Person'),
    'Lead Source': pick('Lead Source', 'Source', 'Channel'),
    'Lead Owner': pick('Lead Owner', 'Owner', 'Sales Person', 'Salesperson'),
    'Quotation No': pick('Quotation No', 'Quote No', 'Quotation Number'),
    'Quotation Date': normalizeDate(pick('Quotation Date', 'Quote Date')),
    'PO Date': normalizeDate(pick('PO Date', 'PO DATE', 'PO DAT', 'Purchase Order Date', 'Order Date')),
    'Order Value': pick('Order Value', 'Expected Order Value', 'Value', 'Amount'),
    'Expected Order Value': pick('Expected Order Value', 'Order Value', 'Value', 'Amount'),
    'Quotation Status': pick('Quotation Status', 'Quote Status'),
    'Order Loss Analysis': pick('Order Loss Analysis', 'Order loss Analysis', 'Loss Analysis', 'Order Loss', 'Order Analysis'),
    Remarks: pick('Remarks', 'Remark', 'Notes')
  };
}

function filterLeads(data, query) {
  const { state, product, owner, source: qSource, status, from, to } = query;
  let filtered = [...data];
  if (state)    filtered = filtered.filter(r => r['State'] === state);
  if (product)  filtered = filtered.filter(r => r['Product Type'] === product);
  if (owner)    filtered = filtered.filter(r => r['Lead Owner'] === owner);
  if (qSource)  filtered = filtered.filter(r => r['Lead Source'] === qSource);
  if (status)   filtered = filtered.filter(r => r['Inquiry Status'] === status);
  if (from)     filtered = filtered.filter(r => r['Date'] >= from);
  if (to)       filtered = filtered.filter(r => r['Date'] <= to);
  return filtered;
}

function readLeadTracker(sheetName) {
  const fp = path.join(DATA_DIR, 'Lead Tracker.xlsx');
  if (!fs.existsSync(fp)) {
    const fallback = readExcel('leads.xlsx', null);
    return (fallback || []).map(normalizeLeadRow).filter(row => row.Sr || row.Date || row['Company Name']);
  }

  const wb = XLSX.readFile(fp);
  
  if (sheetName === 'all') {
    let combined = [];
    wb.SheetNames.forEach(name => {
      // Match sheet names like 2024-2025, 25-26, or "Lead Tracker"
      const isFY = /^\d{2,4}-\d{2,4}$/.test(name.trim());
      const isMain = name.trim().toLowerCase() === 'lead tracker';
      if (isFY || isMain) {
        const ws = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
          .map(normalizeLeadRow)
          .filter(row => row.Sr || row.Date || row['Company Name']);
        combined = combined.concat(data);
      }
    });
    return combined;
  }

  // Single sheet logic
  const data = readExcel('Lead Tracker.xlsx', sheetName) || 
               readExcel('Lead Tracker.xlsx', 'Lead Tracker') || 
               readExcel('Lead Tracker.xlsx', null) || 
               readExcel('leads.xlsx', null);

  return (data || [])
    .map(normalizeLeadRow)
    .filter(row => row.Sr || row.Date || row['Company Name']);
}

app.get('/api/sheet-csv', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '');
    const url = new URL(rawUrl);
    if (url.hostname !== 'docs.google.com' || !url.pathname.includes('/spreadsheets/')) {
      return res.status(400).send('Invalid Google Sheets URL');
    }

    const upstream = await fetch(rawUrl, { redirect: 'follow' });
    if (!upstream.ok) return res.status(upstream.status).send(`Sheet fetch failed: ${upstream.statusText}`);

    const csv = await upstream.text();
    res.type('text/csv').send(csv);
  } catch (err) {
    res.status(500).send(`Sheet proxy error: ${err.message}`);
  }
});

// ── API: LEADS ───────────────────────────────────────────
// Reads from "Lead Tracker.xlsx" or falls back to leads.json
app.get('/api/leads', (req, res) => {
  const { year, limit = 2000 } = req.query;
  const activeYear = year || getCurrentFY();
  let dataSource = 'api';
  
  console.log(`[API] Fetching leads for FY: ${activeYear}`);
  let data = readLeadTracker(activeYear);
  
  // If Excel data is empty or missing, fallback to JSON and change source status
  if (!data || !data.length) {
    console.warn(`[API] No data found in Excel for ${activeYear}. Falling back to sample JSON.`);
    data = readJSON('leads.json');
    dataSource = 'sample';
  }

  if (!data) return res.status(404).json({ error: 'No leads data found.' });

  data = filterLeads(data, req.query);

  let yoy = null;
  if (activeYear !== 'all') {
    const prevYear = getPreviousFY(activeYear);
    const prevDataRaw = readLeadTracker(prevYear);
    if (prevDataRaw && prevDataRaw.length > 0) {
      const prevData = filterLeads(prevDataRaw, req.query);
      if (prevData.length > 0) {
        yoy = {
          previousTotal: prevData.length,
          growth: ((data.length - prevData.length) / prevData.length) * 100
        };
      }
    }
  }

  res.json({ total: data.length, data: data.slice(0, parseInt(limit)), source: dataSource, yoy });
});

// ── API: SALES ───────────────────────────────────────────
app.get('/api/sales', (req, res) => {
  let dataSource = 'api';
  let data = readExcel('Sales.xlsx', 'Sales');
  if (!data || !data.length) {
    data = readJSON('sales.json');
    dataSource = 'sample';
  }
  res.json({ total: data ? data.length : 0, data: data || [], source: dataSource });
});

// ── API: PROJECTS ────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  const data = readExcel('Projects.xlsx', 'Projects') || readJSON('projects.json');
  if (!data) return res.json({ total: 0, data: [], source: 'sample' });
  res.json({ total: data.length, data, source: 'api' });
});

// ── API: SERVICES ────────────────────────────────────────
app.get('/api/services', (req, res) => {
  const data = readExcel('Services.xlsx', 'Services') || readJSON('services.json');
  if (!data) return res.json({ total: 0, data: [], source: 'sample' });
  res.json({ total: data.length, data, source: 'api' });
});

// ── API: DESIGN ──────────────────────────────────────────
app.get('/api/design', (req, res) => {
  const data = readExcel('Design.xlsx', 'Design') || readJSON('design.json');
  if (!data) return res.json({ total: 0, data: [], source: 'sample' });
  res.json({ total: data.length, data, source: 'api' });
});

// ── API: ACCOUNTS ────────────────────────────────────────
app.get('/api/accounts', (req, res) => {
  const data = readExcel('Accounts.xlsx', 'Accounts') || readJSON('accounts.json');
  if (!data) return res.json({ total: 0, data: [], source: 'sample' });
  res.json({ total: data.length, data, source: 'api' });
});

// ── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [];
  res.json({ status: 'ok', version: '2.0', dataFiles: files, timestamp: new Date().toISOString() });
});

// ── CATCHALL → serve index.html ──────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── START ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🏗️  ═══════════════════════════════════════════');
  console.log(`    MALGUDI CRANES BI HUB — v2.0`);
  console.log('    ═══════════════════════════════════════════');
  console.log(`\n🚀  Server running at: http://localhost:${PORT}`);
  console.log(`📁  Data folder: ${DATA_DIR}`);
  
  // Check which data files exist
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    if (files.length) {
      console.log(`\n📊  Data files found:`);
      files.forEach(f => console.log(`     ✅  ${f}`));
    } else {
      console.log(`\n⚠️   No data files in ${DATA_DIR}`);
      console.log(`     → Drop your Excel files there (Lead Tracker.xlsx, etc.)`);
      console.log(`     → Or use Google Sheets (see SETUP_GUIDE.md)`);
    }
  }

  // Find local IP for LAN sharing
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const lanIPs = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) lanIPs.push(net.address);
    }
  }
  if (lanIPs.length) {
    console.log(`\n🌐  Share with office (same WiFi):`);
    lanIPs.forEach(ip => console.log(`     📡  http://${ip}:${PORT}`));
  }
  
  console.log('\n📖  Docs: see SETUP_GUIDE.md');
  console.log('     Press Ctrl+C to stop\n');
});
