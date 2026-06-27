// MCE/MA Sales dashboard logic (adapted)
// Loads from Google Sheets CSV via backend proxy or falls back to /api/sales sample.

(() => {
  // Utils (format)
  function parseNum(v) {
    if (v === null || v === undefined) return 0;
    let s = String(v).replace(/[₹,\s]/g, '').trim();
    // Handle Tally/Accounting Dr/Cr suffixes
    s = s.replace(/Dr$/i, '').replace(/Cr$/i, '');
    return parseFloat(s) || 0;
  }

  function fmtINR(n) {
    n = parseNum(n);
    if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n/1e5).toFixed(1) + ' L';
    return '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:0});
  }

  function fmtINRExact(n) {
    n = parseNum(n);
    return '₹ ' + n.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function parseRobustDate(str) {
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    if (!str) return null;
    let s = String(str).trim();
    
    // Handle DD-MMM-YYYY or DD-MMM-YY
    const parts = s.split("-");
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let rawMonth = parts[1].substring(0,3);
      let monthKey = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase();
      let month = months[monthKey];
      let year = parseInt(parts[2]);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        if (year < 100) year += 2000;
        return new Date(Date.UTC(year, month, day));
      }
    }

    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.substring(0,10) + 'T00:00:00Z');
    
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // ============================================================
  // DATE PARSER (API COMPATIBLE)
  // ============================================================
  function parseDate(str) {
    const months = {
      Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
      Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
    };
    if (!str) return null;
    const parts = String(str).split("-");
    if (parts.length !== 3) return new Date(str);
    let dayStr = parts[0].trim();
    let day = parseInt(dayStr);
    if (isNaN(day) || day < 1 || day > 31) return null;
    if (day < 10) dayStr = '0' + day;
    let month = months[parts[1].trim()];
    let yearStr = parts[2].trim();
    let year = parseInt(yearStr);
    if (isNaN(year)) return null;
    if (year < 100) year += 2000;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${dayStr}`;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  const SAMPLE_DATA = [
    {Date:"2025-04-05",Customer:"L&T Construction Ltd",Product:"Crawler Crane 120T",QTY:1,Revenue:12500000,GrossTotal:14050000,Entity:"mce",Month:"2025-04",FY:"2025-2026",InvoiceNo:"INV-MCE-001",PO:"PO-LT-4501"},
    {Date:"2025-04-12",Customer:"Tata Projects Ltd",Product:"Tower Crane 10T",QTY:2,Revenue:8500000,GrossTotal:9558000,Entity:"mce",Month:"2025-04",FY:"2025-2026",InvoiceNo:"INV-MCE-002",PO:"PO-TP-4512"},
    {Date:"2025-04-18",Customer:"Adani Infra Pvt Ltd",Product:"Mobile Crane 50T",QTY:1,Revenue:4200000,GrossTotal:4728000,Entity:"mce",Month:"2025-04",FY:"2025-2026",InvoiceNo:"INV-MCE-003",PO:"PO-AI-4518"},
    {Date:"2025-05-03",Customer:"Shapoorji Pallonji & Co",Product:"Crawler Crane 80T",QTY:1,Revenue:9800000,GrossTotal:11016000,Entity:"mce",Month:"2025-05",FY:"2025-2026",InvoiceNo:"INV-MCE-005",PO:"PO-SP-4503"},
    {Date:"2025-04-08",Customer:"Local Contractor ABC",Product:"Hydra Crane 16T",QTY:5,Revenue:1250000,GrossTotal:1405000,Entity:"ma",Month:"2025-04",FY:"2025-2026",InvoiceNo:"INV-MA-001",PO:"PO-LCA-4508"}
  ];

  function loadTargets(data) {
    return loadTargetsFromRows(data);
  }

  function fiscalYearFromDate(d) {
    // FY 2025-2026 means Apr 2025..Mar 2026
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth(); // 0=Jan
    return m >= 3 ? `${y}-${y+1}` : `${y-1}-${y}`;
  }

  function monthKey(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleString('en-US', { month: 'short' }) + ' ' + dt.getUTCFullYear();
  }

  function cleanHeader(v) {
    return String(v || '').replace(/"/g, '').replace(/\s+/g, ' ').trim();
  }

  function csvParseRows(csv) {
    const rows = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < csv.length; i++) {
      const ch = csv[i];
      if (ch === '"' && csv[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = !inQ; cur += ch; }
      else if ((ch === '\n' || ch === '\r') && !inQ) {
        if (cur.trim()) rows.push(cur);
        cur = '';
        if (ch === '\r' && csv[i + 1] === '\n') i++;
      } else cur += ch;
    }
    if (cur.trim()) rows.push(cur);
    return rows;
  }

  function csvParseRow(row) {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"' && row[i + 1] === '"') { cur += '"'; i++; }
      else if (row[i] === '"') inQ = !inQ;
      else if (row[i] === ',' && !inQ) { out.push(cur); cur = ''; }
      else cur += row[i];
    }
    out.push(cur);
    return out;
  }

  function csvCleanCell(v) {
    return String(v || '').replace(/^"|"$/g, '').trim();
  }

  // CONFIG: use same google sheets as downloaded dashboard
  // Extracted from: C:\Users\harsh\Downloads\MCE_MA_Sales_Dashboard.html
  const SHEET_FILE_ID = (typeof MALGUDI !== 'undefined' && MALGUDI.SALES_SHEET_ID)
    ? MALGUDI.SALES_SHEET_ID
    : '1K3OJfyovT8gOgN785XHsRWaxJSVpZxN4P-28V-0zsIA';
  const SHEET_TAB_MAP = {
    // FY 2024-2025: your sheet currently uses Targets tab for these names.
    // Update these once you confirm the actual transaction tabs for FY 2024-2025.
    '2024-2025': { mce: 'MCE-24-25', ma: 'MA-24-25' },
    '2025-2026': { mce: 'MCE-25-26', ma: 'MA-25-26' },
    '2026-2027': { mce: 'MCE-26-27', ma: 'MA-26-27' },
    '2027-2028': { mce: 'MCE-27-28', ma: 'MA-27-28' }
  };


  // Targets tab name in your sheet
  const TARGETS_TAB_NAME = 'Targets';

  // Old dashboard formatting expects these exact column names from MCE/MA tabs
  const COLS = {
    DATE: 'Date',
    CUSTOMER: 'Customer',
    PRODUCT: 'Product',
    QTY: 'QTY',
    VOUCHER_TYPE: 'Voucher Type',
    INVOICE_NO: 'Invoice No',
    PO: 'Purchase Order No',
    GSTIN_UIN: 'GSTIN/UIN',
    REVENUE: 'Revenue',
    GROSS_TOTAL: 'GrossTotal',
    OUTPUT_CGST_9: 'OUTPUT CGST 9%',
    OUTPUT_SGST_9: 'OUTPUT SGST 9%'
  };


  // Prefer shared MALGUDI settings so Sales behaves like Leads
  const GSHEET_ENABLED = typeof MALGUDI !== 'undefined' && MALGUDI.USE_GSHEETS;
  const SALES_BASE_URL = (typeof MALGUDI !== 'undefined' && MALGUDI.SALES_GSHEET_BASE_URL)
    ? MALGUDI.SALES_GSHEET_BASE_URL
    : `https://docs.google.com/spreadsheets/d/${SHEET_FILE_ID}/gviz/tq?tqx=out:csv&sheet=`;

  const DEFAULT_TARGETS = {
    '2024-2025': { mce: 0, ma: 0, combined: 0 },
    '2025-2026': { mce: 0, ma: 0, combined: 0 },
    '2026-2027': { mce: 0, ma: 0, combined: 0 },
    '2027-2028': { mce: 0, ma: 0, combined: 0 }
  };

  // State
  let ALL_DATA = [];
  let ACTIVE_DATA = [];
  window.CURRENT_FY = null;
  window.CURRENT_ENTITY = 'combined';
  window.CURRENT_SALES_ENTITY = 'mce';

  // Targets data loaded from sheet tab named Targets
  let TARGETS_DATA = {};

  let sortCol = 'Date', sortDir = -1;

  function ensureSelectOptions(selectEl, values, curValue) {
    selectEl.innerHTML = '<option value="">All</option>' + values.map(v => `<option value="${v}" ${v===curValue?'selected':''}>${v}</option>`).join('');
  }

  function getCurrentFY() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return m >= 4 ? `${y}-${y+1}` : `${y-1}-${y}`;
  }

  function getFiscalRange(fy) {
    const [s,e] = String(fy).split('-').map(Number);
    return { from: `${s}-04-01`, to: `${e}-03-31` };
  }

  function getTarget(fy, entity) {
    const v = (TARGETS_DATA[fy] && TARGETS_DATA[fy][entity]) || DEFAULT_TARGETS[fy]?.[entity] || 0;
    return v;
  }

  function setTxt(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function pickTargetForUI() {
    return getTarget(window.CURRENT_FY, window.CURRENT_ENTITY) || getTarget(window.CURRENT_FY, 'combined');
  }

  function parseTargetValue(v) {
    return parseNum(v);
  }

  function loadTargetsFromRows(rows) {
    TARGETS_DATA = {};
    rows.forEach(r => {
      const fy = String(r.FY || r['FY'] || '').trim();
      const entity = String(r.Entity || r['Entity'] || '').trim().toLowerCase();
      const target = parseTargetValue(r.Target || r.Amount || r['FY Target'] || 0);
      if (!fy || !entity) return;
      TARGETS_DATA[fy] = TARGETS_DATA[fy] || {};
      TARGETS_DATA[fy][entity] = target;
    });
  }

  // ============================================================
  // LOAD DATA FROM GOOGLE SHEETS (API)
  // ============================================================
  async function loadData(fy = window.CURRENT_FY) {
    console.log('📥 Loading sales data for FY:', fy);
    
    const tabs = SHEET_TAB_MAP[fy];
    if (!tabs) {
      console.error(`❌ No sheet tab mapping for FY ${fy}`);
      return;
    }

    try {
      const [mceRes, maRes, targetRes] = await Promise.all([
        fetch(`https://opensheet.elk.sh/${SHEET_FILE_ID}/${encodeURIComponent(tabs.mce)}`),
        fetch(`https://opensheet.elk.sh/${SHEET_FILE_ID}/${encodeURIComponent(tabs.ma)}`),
        fetch(`https://opensheet.elk.sh/${SHEET_FILE_ID}/Targets`).catch(() => null)
      ]);

      if (!mceRes.ok) throw new Error(`MCE sheet failed: HTTP ${mceRes.status}`);
      if (!maRes.ok) throw new Error(`MA sheet failed: HTTP ${maRes.status}`);

      const mceData = await mceRes.json();
      const maData = await maRes.json();
      const targetData = targetRes ? await targetRes.json() : null;

      if (targetData) loadTargets(targetData);

      const format = (data, entity) =>
        data.map(row => {
          const d = parseDate(row.Date);
          if (!d || isNaN(d)) return null;
          const year = d.getFullYear();
          const m = d.getMonth();
          const fyStr = m >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

          return {
            Date: d.toISOString().slice(0,10),
            Customer: row.Customer,
            Product: row.Product,
            QTY: Number(row.QTY) || 0,
            VoucherNo: row["Voucher Type"] || '-',
            InvoiceNo: row["Invoice No"],
            PO: row["Purchase Order No"] || "-",
            "GSTIN/UIN": row["GSTIN/UIN"],

            Revenue: Number(String(row.Revenue || '').replace(/[^\d.-]/g, '')) || 0,
            GrossTotal: Number(String(row.GrossTotal || '').replace(/[^\d.-]/g, '')) || 0,
            TotalGST: (Number(String(row["OUTPUT CGST 9%"] || '').replace(/[^\d.-]/g, '')) || 0) + 
                     (Number(String(row["OUTPUT SGST 9%"] || '').replace(/[^\d.-]/g, '')) || 0),

            FY: fyStr,
            Month: d.toISOString().slice(0,7),
            MonthName: d.toLocaleString('en-IN',{month:'short',year:'numeric'}),
            Entity: entity
          };
        }).filter(Boolean);

      ALL_DATA = [...format(mceData, 'mce'), ...format(maData, 'ma')];
      
      if (ALL_DATA.length === 0) {
        console.warn('⚠️ No data after parsing, using sample data');
        ALL_DATA = SAMPLE_DATA.map(d => ({...d, TotalGST: d.GrossTotal * 0.12}));
      }

      console.log(`📈 Final ALL_DATA: ${ALL_DATA.length} records`);
      renderEntityMode();
      rebuildFilterDropdowns();
      updateAll();

    } catch (err) {
      console.error("❌ API ERROR:", err.message);
      ALL_DATA = SAMPLE_DATA.map(d => ({...d, TotalGST: d.GrossTotal * 0.12}));
      renderEntityMode();
      updateAll();
    }
  }
  window.loadData = loadData; // Export for global use


  function applyCurrentFilters() {
    const from = document.getElementById('filter-from')?.value;
    const to = document.getElementById('filter-to')?.value;
    const product = document.getElementById('filter-product')?.value;
    const customer = document.getElementById('filter-customer')?.value;
    const poSearch = document.getElementById('filter-po')?.value?.toLowerCase().trim();

    const data = [...ALL_DATA];

    ACTIVE_DATA = data.filter(d => {
      if (d.FY !== window.CURRENT_FY) return false;
      if (from && d.Date < from) return false;
      if (to && d.Date > to) return false;
      if (product && d.Product !== product) return false;
      if (customer && d.Customer !== customer) return false;
      if (poSearch && !String(d.PO).toLowerCase().includes(poSearch)) return false;
      return true;
    });

    // entity mode
    if (window.CURRENT_ENTITY !== 'combined') {
      ACTIVE_DATA = ACTIVE_DATA.filter(d => d.Entity === window.CURRENT_ENTITY);
    }
  }

  function rebuildFilterDropdowns() {
    const products = [...new Set(ALL_DATA.map(d => d.Product).filter(Boolean))].sort();
    const customers = [...new Set(ALL_DATA.map(d => d.Customer).filter(Boolean))].sort();

    const pSel = document.getElementById('filter-product');
    const cSel = document.getElementById('filter-customer');
    if (pSel) ensureSelectOptions(pSel, products, pSel.value);
    if (cSel) ensureSelectOptions(cSel, customers, cSel.value);

    // FY select
    const fySel = document.getElementById('filter-fy');
    if (fySel && !fySel.dataset.inited) {
      fySel.dataset.inited = '1';
      const fyOptions = Object.keys(SHEET_TAB_MAP).map(fy => `<option value="${fy}" ${fy===window.CURRENT_FY?'selected':''}>FY ${fy.split('-')[0]}–${fy.split('-')[1]}</option>`).join('');
      fySel.innerHTML = fyOptions;
    }
  }

  function updateKPIs(data) {
    const totalRev = data.reduce((a,d)=>a + (d.Revenue||0), 0);
    const totalGross = data.reduce((a,d)=>a + (d.GrossTotal||0), 0);
    const invoices = new Set(data.map(d => String(d.InvoiceNo||'').trim()).filter(Boolean));
    const avgInvoice = invoices.size ? totalGross / invoices.size : 0;

    setTxt('kpi-revenue', totalRev ? fmtINR(totalRev) : '—');
    setTxt('kpi-revenue-exact', fmtINRExact(totalRev));

    setTxt('kpi-gross', totalGross ? fmtINR(totalGross) : '—');
    setTxt('kpi-gross-exact', fmtINRExact(totalGross));

    setTxt('kpi-orders', invoices.size || '—');

    setTxt('kpi-avg', avgInvoice ? fmtINR(avgInvoice) : '—');
    setTxt('kpi-avg-exact', fmtINRExact(avgInvoice));

    const combinedRevenue = ALL_DATA.filter(d => d.FY === window.CURRENT_FY).reduce((a,d)=>a + (d.Revenue||0), 0);
    setTxt('kpi-combined', combinedRevenue ? fmtINR(combinedRevenue) : '—');
    setTxt('kpi-combined-exact', fmtINRExact(combinedRevenue));

    const target = pickTargetForUI();
    setTxt('kpi-target', target ? fmtINR(target) : '—');
    setTxt('kpi-target-exact', target ? `₹ ${target.toLocaleString('en-IN')}` : 'Update Targets tab');

    const gap = target ? Math.max(target - totalRev, 0) : 0;
    const pct = target ? Math.round((totalRev/target)*100) : 0;
    setTxt('kpi-gap', target ? fmtINR(gap) : '—');
    setTxt('kpi-gap-exact', target ? `${pct}% of target` : 'No target');

    // pending monthly: only show for combined
    const isCombined = window.CURRENT_ENTITY === 'combined';
    const pendingCard = document.getElementById('kpi-monthly-pending');
    if (pendingCard) pendingCard.style.display = isCombined ? 'block' : 'none';

    if (pendingCard) {
      const now = new Date();
      const curMonth = now.toISOString().slice(0,7);
      const monthlyData = ALL_DATA.filter(d => d.FY === window.CURRENT_FY && d.Month === curMonth);
      const curRev = monthlyData.reduce((a,d)=>a + (d.Revenue||0), 0);
      const monthlyTarget = target ? (target/12) : 0;
      const pending = Math.max(monthlyTarget - curRev, 0);
      setTxt('kpi-monthly-pending-value', fmtINR(pending));
      setTxt('kpi-monthly-pending-sub', `${now.toLocaleString('en-IN',{month:'short'})} ${fmtINR(curRev)} / ${fmtINR(monthlyTarget)}`);
    }
  }

  function updateMonthly(data) {
    const map = {};
    data.forEach(d => {
      map[d.Month] = map[d.Month] || {label: d.MonthName, rev:0, gross:0};
      map[d.Month].rev += d.Revenue||0;
      map[d.Month].gross += d.GrossTotal||0;
    });
    const months = Object.keys(map).sort();
    const labels = months.map(m => map[m].label);
    const revs = months.map(m => map[m].rev);
    const gross = months.map(m => map[m].gross);

    const O = getChartOpts();
    mkChart('chart-monthly', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: revs,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...O.tt,
            callbacks: { label: (ctx) => ' ' + fmtINR(ctx.raw) }
          }
        },
        scales: {
          x: { grid: { color: O.grid }, ticks: { color: 'var(--txt2)', font: { size: 10 } } },
          y: { grid: { color: O.grid }, ticks: { color: 'var(--txt2)', font: { size: 10 }, callback: v => fmtINR(v) } }
        }
      }
    });
  }

  function updateProductPie(data) {
    const map = {};
    data.forEach(d => { map[d.Product] = (map[d.Product]||0) + (d.Revenue||0); });
    const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]);
    const labels = sorted.map(x=>x[0]);
    const values = sorted.map(x=>x[1]);

    const O = getChartOpts();
    mkChart('chart-product-pie', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: MALGUDI.COLORS.slice(0, labels.length), borderColor: 'transparent', borderWidth: 2, hoverOffset: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 8, padding: 6, font: { size: 10 }, color: 'var(--txt2)' } },
          tooltip: {
            ...O.tt,
            callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtINR(ctx.raw)} (${(ctx.raw/values.reduce((a,b)=>a+b,0)*100||0).toFixed(1)}%)` }
          }
        }
      }
    });
  }

  function updateCustomers(data) {
    const map = {};
    data.forEach(d => { map[d.Customer] = (map[d.Customer] || 0) + (d.Revenue || 0); });
    const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const labels = sorted.map(e => e[0].length > 20 ? e[0].substring(0,19)+'…' : e[0]);
    const values = sorted.map(e => e[1]);

    const O = getChartOpts();
    mkChart('chart-customers', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: MALGUDI.COLORS[2],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: { ...O.tt, callbacks: { label: (ctx) => ' ' + fmtINR(ctx.raw) } }
        },
        scales: {
          x: { grid: { color: O.grid }, ticks: { color: 'var(--txt2)', font: { size: 10 }, callback: v => fmtINR(v) } },
          y: { grid: { display: false }, ticks: { color: 'var(--txt2)', font: { size: 10 } } }
        }
      }
    });
  }

  function updateGSTPie(data) {
    let cgstSgst = 0, igst = 0, none = 0;
    data.forEach(d => {
      const gstin = String(d['GSTIN/UIN'] || '');
      if (gstin.startsWith('27')) cgstSgst += (d.TotalGST || 0);
      else if (gstin) igst += (d.TotalGST || 0);
      else none += (d.TotalGST || 0);
    });
    const O = getChartOpts();
    mkChart('chart-gst-pie', {
      type: 'pie',
      data: {
        labels: ['CGST+SGST (MH)', 'IGST (OS)', 'Other'],
        datasets: [{ data: [cgstSgst, igst, none], backgroundColor: [MALGUDI.COLORS[0], MALGUDI.COLORS[1], MALGUDI.COLORS[5]], borderColor: 'transparent' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, color: 'var(--txt2)', font: { size: 10 } } },
          tooltip: { ...O.tt, callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtINR(ctx.raw)}` } }
        }
      }
    });
  }

  function updateEntityCompareChart() {
    const mceMap = {}, maMap = {};
    ALL_DATA.filter(d => d.FY === window.CURRENT_FY).forEach(d => {
      const map = d.Entity === 'mce' ? mceMap : maMap;
      map[d.Month] = (map[d.Month] || 0) + d.Revenue;
    });
    const months = [...new Set([...Object.keys(mceMap), ...Object.keys(maMap)])].sort();
    const O = getChartOpts();
    mkChart('chart-entity-compare', {
      type: 'line',
      data: {
        labels: months.map(m => new Date(m+'-01').toLocaleString('en-IN',{month:'short'})),
        datasets: [
          { label: 'MCE', data: months.map(m=>mceMap[m]||0), borderColor: '#3b82f6', tension: 0.3 },
          { label: 'MA', data: months.map(m=>maMap[m]||0), borderColor: '#f59e0b', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtINR(v) } } } }
    });
  }

  function updateGrowthChart(data) {
    const map = {};
    data.forEach(d => { map[d.Month] = (map[d.Month] || 0) + d.Revenue; });
    const months = Object.keys(map).sort();
    const growth = months.map((m, i) => {
      if (i === 0) return 0;
      const prev = map[months[i-1]];
      return prev ? ((map[m] - prev) / prev * 100) : 0;
    });
    mkChart('chart-growth', {
      type: 'bar',
      data: {
        labels: months.map(m => new Date(m+'-01').toLocaleString('en-IN',{month:'short'})),
        datasets: [{ label: 'MoM Growth %', data: growth, backgroundColor: growth.map(v => v >= 0 ? '#10b981' : '#ef4444') }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function updateBusinessInsights(data) {
    const el = document.getElementById('insights-body');
    if (!el) return;
    const total = data.reduce((a,d)=>a+d.Revenue, 0);
    const target = pickTargetForUI();
    const prog = target ? Math.round((total/target)*100) : 0;
    
    const prodMap = {};
    data.forEach(d => { prodMap[d.Product] = (prodMap[d.Product]||0) + d.Revenue; });
    const topProd = Object.entries(prodMap).sort((a,b)=>b[1]-a[1])[0] || ['None', 0];

    el.innerHTML = `
      <div style="color:var(--txt)"><strong>Top Focus</strong> ${topProd[0]}</div>
      <div style="color:var(--txt)"><strong>FY Progress</strong> ${prog}% Achieved</div>
      <div style="margin-top:auto; font-size:0.75rem; color:var(--txt3);">
        Target ${fmtINR(target)}<br>Taxable Rev ${fmtINR(total)}
      </div>
    `;
  }

  window.sortTable = function(col) {
    if (sortCol === col) sortDir *= -1;
    else { sortCol = col; sortDir = 1; }
    updateTxnTable(ACTIVE_DATA);
  };

  function renderEntityMode() {
    const activeEntity = window.CURRENT_ENTITY;
    const showCombined = activeEntity === 'combined';

    // Toggle visibility of combined-specific KPI cards
    ['kpi-combined-card', 'kpi-target-card', 'kpi-gap-card'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = showCombined ? 'block' : 'none';
    });

    const sect = document.getElementById('combined-dashboard-section');
    if (sect) sect.style.display = showCombined ? 'block' : 'none';
    
    if (showCombined) {
      updateEntityCompareChart();
      updateGrowthChart(ACTIVE_DATA);
      updateBusinessInsights(ACTIVE_DATA);
    }
  }

  function updateTxnTable(data) {
    const tbody = document.getElementById('txn-body');
    if (!tbody) return;
    const search = (document.getElementById('txn-search')?.value || '').toLowerCase().trim();
    const pageSize = window._txnPageSize || 25;
    const currentPage = window._txnPage || 1;

    const sorted = [...data].sort((a,b) => {
      const valA = a[sortCol] || '';
      const valB = b[sortCol] || '';
      if (typeof valA === 'number') return (valA - valB) * sortDir;
      return String(valA).localeCompare(String(valB)) * sortDir;
    });

    const filtered = sorted.filter(r => {
      if (!search) return true;
      const text = `${r.Date} ${r.InvoiceNo} ${r.PO} ${r.Customer} ${r.Product}`.toLowerCase();
      return text.includes(search);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);

    tbody.innerHTML = '';
    pageRows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtDateLabel(r.Date)}</td>
        <td style="font-family:var(--mono);font-size:.72rem;color:var(--txt3)">${r.InvoiceNo||'-'}</td>
        <td style="font-family:var(--mono);font-size:.72rem;color:var(--txt3)">${r.PO||'-'}</td>
        <td>${r.Customer||'-'}</td>
        <td><span class="product-tag">${r.Product||'-'}</span></td>
        <td style="text-align:center">${r.QTY||1}</td>
        <td style="text-align:right;font-weight:600">${fmtINR(r.Revenue||0)}</td>
        <td style="text-align:right;color:var(--txt3)">${fmtINR(r.GrossTotal||0)}</td>
        <td style="text-align:right;color:var(--txt2)">${fmtINR(r.TotalGST||0)}</td>
      `;
      tbody.appendChild(tr);
    });

    const countEl = document.getElementById('txn-search-count');
    if (countEl) countEl.textContent = filtered.length;
    const txnCountEl = document.getElementById('txn-count');
    if (txnCountEl) txnCountEl.textContent = filtered.length;

    // Update pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  function updateAll() {
    applyCurrentFilters();
    updateKPIs(ACTIVE_DATA);
    updateMonthly(ACTIVE_DATA);
    updateProductPie(ACTIVE_DATA);
    updateCustomers(ACTIVE_DATA);
    updateGSTPie(ACTIVE_DATA);
    updateTxnTable(ACTIVE_DATA);
    renderEntityMode();
  }
  window.updateAll = updateAll; // Expose for nav.js

  // FY switch
  window.switchFY = function(fy) {
    window.CURRENT_FY = fy;
    return loadData(fy).then(() => {
      rebuildFilterDropdowns();
      // set filter defaults for new FY range
      const r = getFiscalRange(window.CURRENT_FY);
      const fromEl = document.getElementById('filter-from');
      const toEl = document.getElementById('filter-to');
      if (fromEl) fromEl.value = r.from;
      if (toEl) toEl.value = r.to;
      updateAll();
    });
  };

  window.resetFilters = function() {
    const r = getFiscalRange(window.CURRENT_FY);
    const fromEl = document.getElementById('filter-from');
    const toEl = document.getElementById('filter-to');
    if (fromEl) fromEl.value = r.from;
    if (toEl) toEl.value = r.to;
    const pSel = document.getElementById('filter-product');
    const cSel = document.getElementById('filter-customer');
    if (pSel) pSel.value = '';
    if (cSel) cSel.value = '';
    const po = document.getElementById('filter-po');
    if (po) po.value = '';
    updateAll();
  };

  // Init
  window.initSalesMceMa = async function() {
    window.CURRENT_FY = getCurrentFY();

    // Load data for current FY from google sheets
    await loadData(window.CURRENT_FY);
    rebuildFilterDropdowns();

    // set filter defaults
    const r = getFiscalRange(window.CURRENT_FY);
    const fromEl = document.getElementById('filter-from');
    const toEl = document.getElementById('filter-to');
    if (fromEl) fromEl.value = r.from;
    if (toEl) toEl.value = r.to;

    // default entity
    window.CURRENT_ENTITY = window.CURRENT_SALES_ENTITY === 'combined' ? 'combined' : window.CURRENT_SALES_ENTITY;

    // Update Hub Sync Status
    if (typeof updateSyncStatus === 'function') updateSyncStatus('gsheets');

    updateAll();

    // event listeners
    ['filter-from','filter-to','filter-product','filter-customer','filter-po'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => updateAll());
      el.addEventListener('change', () => updateAll());
    });

    // txn search + pagination
    const searchEl = document.getElementById('txn-search');
    if (searchEl) searchEl.addEventListener('input', () => { window._txnPage = 1; updateTxnTable(ACTIVE_DATA); });

    const pageSizeEl = document.getElementById('page-size');
    if (pageSizeEl) {
      pageSizeEl.addEventListener('change', (e) => {
        window._txnPageSize = parseInt(e.target.value, 10) || 25;
        window._txnPage = 1;
        updateTxnTable(ACTIVE_DATA);
      });
    }

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.addEventListener('click', () => { window._txnPage = Math.max(1, (window._txnPage||1)-1); updateTxnTable(ACTIVE_DATA); });
    if (nextBtn) nextBtn.addEventListener('click', () => { window._txnPage = (window._txnPage||1)+1; updateTxnTable(ACTIVE_DATA); });

    // init countdown
    if (typeof startCountdown === 'function') {
      const interval = (typeof MALGUDI !== 'undefined' && MALGUDI.GSHEET_INTERVAL) || 30;
      startCountdown(interval, c => setTxt('cdown', c), async () => {
        console.log('🔄 Syncing live sales data...');
        await loadData(window.CURRENT_FY);
        updateAll();
      });
    }
  };
})();
