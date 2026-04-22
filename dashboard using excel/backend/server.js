/**
 * Lead Tracking & Sales Funnel Dashboard — Backend
 * Node.js + Express | Author: Senior BI Developer
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─────────────────────────────────────────────
// SAMPLE DATA — Replace with Excel loader below
// ─────────────────────────────────────────────
let LEADS = require('./data/leads.json');

// Optional: Load from Excel if file exists
try {
  const XLSX = require('xlsx');
  const xlFile = path.join(__dirname, 'data', 'Lead Tracker.xlsx');
  if (fs.existsSync(xlFile)) {
    const wb = XLSX.readFile(xlFile);
    const ws = wb.Sheets['Lead Tracker'];
    LEADS = XLSX.utils.sheet_to_json(ws, { defval: '' });
    console.log(`✅ Loaded ${LEADS.length} records from Excel`);
  }
} catch (e) {
  console.log('📋 Using sample JSON data:', e.message);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function parseDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  // Excel serial number
  if (typeof d === 'number') {
    const xlEpoch = new Date(1900, 0, 1);
    return new Date(xlEpoch.getTime() + (d - 2) * 86400000);
  }
  return new Date(d);
}

function filterLeads(leads, query) {
  let data = [...leads];
  const { from, to, state, product, owner, source, status } = query;

  if (from) data = data.filter(l => {
    const d = parseDate(l['Date'] || l['date']);
    return d && d >= new Date(from);
  });
  if (to) data = data.filter(l => {
    const d = parseDate(l['Date'] || l['date']);
    return d && d <= new Date(to);
  });
  if (state && state !== 'all') data = data.filter(l =>
    (l['State'] || '').toLowerCase() === state.toLowerCase());
  if (product && product !== 'all') data = data.filter(l =>
    (l['Product Type'] || '').toLowerCase() === product.toLowerCase());
  if (owner && owner !== 'all') data = data.filter(l =>
    (l['Lead Owner'] || '').toLowerCase() === owner.toLowerCase());
  if (source && source !== 'all') data = data.filter(l =>
    (l['Lead Source'] || '').toLowerCase() === source.toLowerCase());
  if (status && status !== 'all') data = data.filter(l =>
    (l['Inquiry Status'] || '').toLowerCase() === status.toLowerCase());

  return data;
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(arr, keyGroup, keySum) {
  return arr.reduce((acc, item) => {
    const k = item[keyGroup] || 'Unknown';
    const v = parseFloat(String(item[keySum] || '0').replace(/[₹,\s]/g, '')) || 0;
    acc[k] = (acc[k] || 0) + v;
    return acc;
  }, {});
}

function getMonthLabel(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// GET /api/leads — all leads with optional filters
app.get('/api/leads', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const start = (page - 1) * limit;
    res.json({
      total: data.length,
      page,
      limit,
      data: data.slice(start, start + limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/summary — KPI cards
app.get('/api/summary', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const totalLeads = data.length;
    const wonLeads = data.filter(l => /won|order confirmed|converted/i.test(l['Inquiry Status'] || l['Quotation Status'] || ''));
    const lostLeads = data.filter(l => /lost|rejected|cancelled/i.test(l['Inquiry Status'] || l['Quotation Status'] || ''));
    const quotations = data.filter(l => l['Quotation No'] && String(l['Quotation No']).trim() !== '');
    const activeLeads = data.filter(l => !/won|lost|order confirmed|rejected|converted|cancelled/i.test(l['Inquiry Status'] || ''));

    const totalRevenue = data.reduce((sum, l) => {
      const v = parseFloat(String(l['Expected Order Value'] || '0').replace(/[₹,\s]/g, '')) || 0;
      return sum + v;
    }, 0);
    const wonRevenue = wonLeads.reduce((sum, l) => {
      const v = parseFloat(String(l['Expected Order Value'] || '0').replace(/[₹,\s]/g, '')) || 0;
      return sum + v;
    }, 0);

    res.json({
      totalLeads,
      activeLeads: activeLeads.length,
      quotationsGenerated: quotations.length,
      ordersWon: wonLeads.length,
      ordersLost: lostLeads.length,
      conversionRate: totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : '0.0',
      totalExpectedRevenue: totalRevenue,
      wonRevenue
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/funnel — funnel stage counts
app.get('/api/funnel', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const inquiry = data.length;
    const quotation = data.filter(l => l['Quotation No'] && String(l['Quotation No']).trim() !== '').length;
    const won = data.filter(l => /won|order confirmed|converted/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')).length;
    const lost = data.filter(l => /lost|rejected|cancelled/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')).length;

    res.json({
      stages: [
        { stage: 'Inquiry', count: inquiry, color: '#6366f1' },
        { stage: 'Quotation', count: quotation, color: '#3b82f6' },
        { stage: 'Won', count: won, color: '#10b981' },
        { stage: 'Lost', count: lost, color: '#ef4444' }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/revenue — revenue breakdowns
app.get('/api/revenue', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);

    const byProduct = sumBy(data, 'Product Type', 'Expected Order Value');
    const byState = sumBy(data, 'State', 'Expected Order Value');
    const byOwner = sumBy(data, 'Lead Owner', 'Expected Order Value');

    // Monthly revenue
    const monthly = {};
    data.forEach(l => {
      const d = parseDate(l['Date'] || l['Quotation Date']);
      if (!d || isNaN(d.getTime())) return;
      const key = getMonthLabel(d);
      const v = parseFloat(String(l['Expected Order Value'] || '0').replace(/[₹,\s]/g, '')) || 0;
      monthly[key] = (monthly[key] || 0) + v;
    });

    res.json({ byProduct, byState, byOwner, monthly });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/conversion — conversion metrics
app.get('/api/conversion', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const byOwner = {};
    const owners = [...new Set(data.map(l => l['Lead Owner'] || 'Unknown'))];

    owners.forEach(owner => {
      const ownerLeads = data.filter(l => (l['Lead Owner'] || 'Unknown') === owner);
      const won = ownerLeads.filter(l => /won|order confirmed|converted/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')).length;
      byOwner[owner] = {
        total: ownerLeads.length,
        won,
        rate: ownerLeads.length > 0 ? ((won / ownerLeads.length) * 100).toFixed(1) : '0.0'
      };
    });

    const bySource = {};
    const sources = [...new Set(data.map(l => l['Lead Source'] || 'Unknown'))];
    sources.forEach(src => {
      const srcLeads = data.filter(l => (l['Lead Source'] || 'Unknown') === src);
      const won = srcLeads.filter(l => /won|order confirmed|converted/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')).length;
      bySource[src] = {
        total: srcLeads.length,
        won,
        rate: srcLeads.length > 0 ? ((won / srcLeads.length) * 100).toFixed(1) : '0.0'
      };
    });

    res.json({ byOwner, bySource });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/loss-analysis — why orders are lost
app.get('/api/loss-analysis', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const lostLeads = data.filter(l => /lost|rejected|cancelled/i.test(l['Inquiry Status'] || l['Quotation Status'] || ''));
    const reasons = groupBy(lostLeads, 'Order Loss Analysis');
    const byProduct = groupBy(lostLeads, 'Product Type');
    const byState = groupBy(lostLeads, 'State');

    res.json({ reasons, byProduct, byState, total: lostLeads.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/filters — unique values for dropdowns
app.get('/api/filters', (req, res) => {
  try {
    const unique = (key) => [...new Set(LEADS.map(l => l[key] || '').filter(Boolean))].sort();
    res.json({
      states: unique('State'),
      products: unique('Product Type'),
      owners: unique('Lead Owner'),
      sources: unique('Lead Source'),
      statuses: unique('Inquiry Status')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/trends — monthly lead trends
app.get('/api/trends', (req, res) => {
  try {
    const data = filterLeads(LEADS, req.query);
    const monthly = {};

    data.forEach(l => {
      const d = parseDate(l['Date']);
      if (!d || isNaN(d.getTime())) return;
      const key = getMonthLabel(d);
      if (!monthly[key]) monthly[key] = { total: 0, won: 0, lost: 0, quotations: 0 };
      monthly[key].total++;
      if (/won|order confirmed|converted/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')) monthly[key].won++;
      if (/lost|rejected|cancelled/i.test(l['Inquiry Status'] || l['Quotation Status'] || '')) monthly[key].lost++;
      if (l['Quotation No'] && String(l['Quotation No']).trim()) monthly[key].quotations++;
    });

    // Sort by date
    const sorted = Object.entries(monthly).sort((a, b) => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const [ma, ya] = a[0].split(' ');
      const [mb, yb] = b[0].split(' ');
      return ya !== yb ? ya - yb : months.indexOf(ma) - months.indexOf(mb);
    });

    res.json(Object.fromEntries(sorted));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Lead Dashboard running at http://localhost:${PORT}`);
});

module.exports = app;
