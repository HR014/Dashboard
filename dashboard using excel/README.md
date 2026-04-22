# ⚡ LeadFlow — Lead Tracking & Sales Funnel Dashboard

A production-ready, Power BI-like Sales Intelligence Dashboard built with Node.js + Express backend and vanilla HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
lead-dashboard/
├── backend/
│   ├── server.js          ← Express REST API
│   ├── package.json
│   └── data/
│       └── leads.json     ← Sample data (replace with your Excel)
└── frontend/
    ├── index.html         ← Main dashboard page
    ├── style.css          ← Styling (dark/light mode)
    └── script.js          ← Charts, filters, API calls
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Add Your Excel File (Optional)

Drop your `Lead Tracker.xlsx` into `backend/data/`. The server auto-detects it.

**Important:** Sheet name must be `Lead Tracker` and columns must match:
```
Sr No | Date | Company Name | Location | State | Product Type | Capacity/Specs
Phone | Email | Inquiry Status | Contact Person | Lead Source | Lead Owner
Quotation No | Quotation Date | Expected Order Value | Quotation Status
Order Loss Analysis | Remarks
```

### 3. Start the Server

```bash
node server.js
# or for development (auto-reload):
npx nodemon server.js
```

Server runs at: **http://localhost:3000**

### 4. Open the Dashboard

Visit **http://localhost:3000** in your browser.

**Login credentials:**
- admin / admin123
- manager / manager456

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | All leads (paginated, filterable) |
| GET | `/api/summary` | KPI card data |
| GET | `/api/funnel` | Sales funnel stages |
| GET | `/api/revenue` | Revenue breakdowns |
| GET | `/api/conversion` | Conversion by owner/source |
| GET | `/api/loss-analysis` | Lost order analysis |
| GET | `/api/trends` | Monthly trend data |
| GET | `/api/filters` | Filter dropdown values |

### Query Parameters (all endpoints support):
```
?from=2025-01-01&to=2025-12-31
&state=Maharashtra
&product=EOT Crane
&owner=Amit Shah
&source=Reference
&status=Won
```

### Sample API Response — `/api/summary`
```json
{
  "totalLeads": 50,
  "activeLeads": 18,
  "quotationsGenerated": 43,
  "ordersWon": 28,
  "ordersLost": 11,
  "conversionRate": "56.0",
  "totalExpectedRevenue": 87650000,
  "wonRevenue": 54200000
}
```

---

## 📊 Dashboard Features

### KPI Cards
- Total Leads, Active Leads, Quotations Generated
- Orders Won, Orders Lost, Conversion Rate %
- Total Expected Revenue, Won Revenue

### Charts
1. **Sales Funnel** — Visual funnel: Inquiry → Quotation → Won/Lost
2. **Leads by Source** — Doughnut chart by channel
3. **Revenue by Product** — Revenue breakdown per product type
4. **Monthly Trend** — Line chart: Leads vs Quotations vs Won
5. **Leads by State** — Horizontal bar by geography
6. **Salesperson Performance** — Total vs Won per owner
7. **Loss Analysis** — Root cause of lost deals
8. **Revenue by State** — Expected value by state

### Filters
All charts dynamically update when you filter by:
- Date Range, State, Product Type, Lead Owner, Lead Source, Status

### Other Features
- 🔐 Login authentication (session-based)
- 🌙 Dark / ☀️ Light mode toggle (preference saved)
- 📥 Export filtered data to Excel
- 🔍 Real-time table search
- 🔄 Auto-refresh every 30 seconds
- 📱 Fully responsive (mobile + desktop)

---

## 🔧 Using Your OneDrive Excel

Since the OneDrive link requires authentication, download your file manually:

1. Open the link: https://1drv.ms/x/c/d16196e134b82b54/...
2. Download as `.xlsx`
3. Rename to `Lead Tracker.xlsx`
4. Place in `backend/data/`
5. Restart server → data auto-loads

---

## 🎨 Customization

### Change refresh interval (in `script.js`):
```js
const REFRESH_INTERVAL = 30; // seconds
```

### Change API base URL (for production):
```js
const API_BASE = 'https://your-domain.com/api';
```

### Add more users (in `script.js`):
```js
const USERS = { admin: 'admin123', john: 'password', ... };
```

---

## 📦 Dependencies

**Backend:**
- express ^4.18.2
- cors ^2.8.5
- xlsx ^0.18.5

**Frontend (CDN):**
- Chart.js 4.4.1
- SheetJS (xlsx) 0.18.5

---

Built with ❤️ — LeadFlow Sales Intelligence Platform © 2025
