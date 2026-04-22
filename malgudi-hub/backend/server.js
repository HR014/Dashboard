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
app.use(express.static(path.join(__dirname, '../frontend')));  // serve frontend

// ── PATHS ───────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');

// ── HELPERS ─────────────────────────────────────────────
function readExcel(filename, sheetName) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  const wb = XLSX.readFile(fp);
  const ws = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

// ── API: LEADS ───────────────────────────────────────────
// Reads from "Lead Tracker.xlsx" or falls back to leads.json
app.get('/api/leads', (req, res) => {
  let data = readExcel('Lead Tracker.xlsx', 'Lead Tracker')
          || readExcel('leads.xlsx', null)
          || readJSON('leads.json');

  if (!data) return res.status(404).json({ error: 'No leads data found. Drop Lead Tracker.xlsx in backend/data/' });

  // Apply query filters
  const { state, product, owner, source, status, from, to, limit = 2000 } = req.query;
  if (state)   data = data.filter(r => r['State'] === state);
  if (product) data = data.filter(r => r['Product Type'] === product);
  if (owner)   data = data.filter(r => r['Lead Owner'] === owner);
  if (source)  data = data.filter(r => r['Lead Source'] === source);
  if (status)  data = data.filter(r => r['Inquiry Status'] === status);
  if (from)    data = data.filter(r => r['Date'] >= from);
  if (to)      data = data.filter(r => r['Date'] <= to);

  res.json({ total: data.length, data: data.slice(0, parseInt(limit)), source: 'api' });
});

// ── API: SALES ───────────────────────────────────────────
app.get('/api/sales', (req, res) => {
  const data = readExcel('Sales.xlsx', 'Sales') || readJSON('sales.json');
  if (!data) return res.json({ total: 0, data: [], source: 'sample' });
  res.json({ total: data.length, data, source: 'api' });
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
