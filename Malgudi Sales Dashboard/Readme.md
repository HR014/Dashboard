# MCE/MA Sales Dashboard 🏗️🔧

[![Dashboard Preview](https://via.placeholder.com/800x400/0a0d14/ffffff?text=MCE+Sales+Dashboard)](https://htmlpreview.github.io/?https://github.com/example/mce-dashboard/MCE_MA_Sales_Dashboard.html](https://github.com/HR014/Dashboard/blob/blackboxai/docs/Malgudi%20Sales%20Dashboard/MCE_MA_Sales_Dashboard.html)

**Live, interactive sales analytics dashboard** for **MCE (Malgudi Cranes & Equipments)** and **MA (Malgudi Associates)**. Fetches real-time data from Google Sheets, renders 10+ **Chart.js** charts, **KPI cards**, filterable tables. **Zero setup** - opens in any browser.

## ✨ Features
| Feature | Description |
|---------|-------------|
| **📊 10+ Charts** | Revenue trends, product mix, customer rankings, GST breakdown |
| **🎯 KPI Cards** | Revenue (excl/incl GST), invoices, avg value, **target gaps** |
| **🔍 Filters** | Date range, PO search, product/customer dropdowns (**live updates**) |
| **🏢 Entity Views** | Switch MCE / MA / **Combined** |
| **📅 FY Switch** | 2025-26 / 2026-27 |
| **🎨 Dark/Light** | Theme toggle (persists) |
| **📱 Responsive** | Mobile-first (480px → 1800px+) |
| **⚡ Performance** | <100ms updates, handles 1000+ rows |

## 🚀 Quick Start
1. **Open** `MCE_MA_Sales_Dashboard.html` in browser
2. **Data auto-loads** from Google Sheet
3. **Filter & Explore** - everything updates live

```
No npm install, no server, no build step needed!
```

## 📊 Data Source
**Google Sheet**: [ID: 1K3OJfyovT8gOgN785XHsRWaxJSVpZxN4P-28V-0zsIA](https://docs.google.com/spreadsheets/d/1K3OJfyovT8gOgN785XHsRWaxJSVpZxN4P-28V-0zsIA)

**Required Tabs**:
- `MCE-25-26`, `MA-25-26` → Sales data (Date, Customer, Product, Revenue, GrossTotal, GST...)
- `Targets` → FY targets:
  ```
  FY        | Entity   | Target
  2025-2026 | mce      | 62000000
  2025-2026 | ma       | 12000000
  2025-2026 | combined | 74000000
  ```

**Data processed to**:
```js
{ Date: "2025-04-15", Revenue: 1250000, GrossTotal: 1406250, Product: "Crawler Crane",
  Customer: "ABC Corp", FY: "2025-2026", Entity: "mce" }
```

## 🛠 Core Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| **`loadData(fy)`** | Fetch/parse Sheets → `ALL_DATA[]` | Page load, FY switch |
| **`updateAll()`** | Refresh **all** charts/KPIs/tables | Every filter change |
| **`getFiltered()`** | Apply date/product/PO filters | `updateAll()` |
| **`updateKPIs()`** | 7 KPI cards + avg invoice calc | `updateAll()` |
| **`switchEntity(entity)`** | MCE/MA/Combined view toggle | Entity buttons |
| **`toggleTheme()`** | Dark/light + chart redraw | Theme button |
| **`fmt(n)`** | ₹1.2 Cr / ₹15 L formatter | All tooltips |

**Full Flow**:
```
loadData() → applyFilters() → updateAll() → 11 parallel updates (charts/tables)
```

## 🎨 Customization
```js
// Sheet ID (line ~500)
const SHEET_FILE_ID = 'your-new-sheet-id';

// Add FY (line ~510)
'2027-2028': { mce: 'MCE-27-28', ma: 'MA-27-28' }
```

**CSS Vars** (for rebranding):
```css
--accent: #3b82f6;  /* Primary blue */
--accent2: #06d6a0; /* Success green */
```

## 📱 Responsive Breakpoints
| Size | Layout |
|------|--------|
| **≤480px** | Mobile: 1-col grids, stacked filters |
| **481-768px** | Tablet: 2-col KPIs/charts |
| **769-1440px** | Desktop: Full 3-col |
| **>1440px** | Ultra-wide: 6 KPI cards |

## 🔍 Charts Overview
| Chart | Type | Purpose |
|-------|------|---------|
| Monthly Revenue | Line | MoM trend |
| MCE vs MA | Line | Entity compare |
| Product Mix | Doughnut | % share |
| Growth % | Bar | MoM delta |
| GST Split | Pie | CGST/IGST |
| Top Customers | H-Bar | Key accounts |

## 🧪 Testing
```cmd
# Windows (current dir)
start MCE_MA_Sales_Dashboard.html

# Verify:
# ✅ Charts load (needs internet)
# ✅ Filters update live
# ✅ Theme persists
# ✅ Mobile view (F12 → 375px)
```

## 📈 Sample Metrics (Demo Data)
```
Basic Value: ₹4.2 Cr  Gross: ₹4.7 Cr  Invoices: 134
Target Progress: 68% (Gap: ₹1.8 Cr)
Top Product: Crawler Crane (₹2.1 Cr)
```

## 🤝 Credits
- **Chart.js v4.4.1** - Charts
- **Google Fonts** - Syne/DM Sans
- **opensheet.elk.sh** - Sheet API

**Built for sales teams** - professional, fast, insightful! 🚀

---
