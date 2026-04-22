# 🏗️ Malgudi Cranes & Equipments — Dashboard Collection

[![Node.js](https://img.shields.io/badge/Node.js-v18+-3C873A?style=flat&logo=node.js)](https://nodejs.org)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5)](https://html5.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat&logo=chart.js&logoColor=white)](https://chartjs.org)

**Production-ready BI dashboards** for **Lead Tracking, Sales Analytics, Projects, Services** at Malgudi Cranes. Built for office LAN sharing (zero cloud costs). Supports **Excel drops** or **Google Sheets live sync**.

## 📁 Repo Structure

```
Dashboard/
├── dashboard using excel/           ← LeadFlow Dashboard (full-stack)
│   ├── backend/ (Node+Excel API)
│   └── frontend/ (charts, auth, filters)
├── Malgudi Sales Dashboard/        ← Single-file HTML (Google Sheets)
│   └── MCE_MA_Sales_Dashboard.html
└── malgudi-hub/                    ← BI Hub v2.0 (6 dashboards)
    ├── backend/ (unified Node server)
    └── frontend/ (leads/sales/projects/services/design/accounts)
├── README.md                       ← You're reading it!
└── TODO.md                         ← Progress tracking
```

## 🚀 Quick Start Guide

### Option 1: malgudi-hub (Recommended — All-in-One)
```bash
cd \"c:/Users/harsh/Projects/Dashboard/malgudi-hub/backend\"
npm install
node server.js
```
**Open**: http://localhost:3000  
**Login**: admin/admin123 | manager/manager456

<details>
<summary>📊 All 6 Dashboards unlocked → Click to expand</summary>

| Dashboard | URL | Data Source | Key Features |
|-----------|-----|-------------|--------------|
| **Home** | `/` | - | Hero overview |
| **Leads** | `/leads.html` | Excel/Google Sheets | Funnel, KPI, loss analysis |
| **Sales** | `/sales.html` | Sales.xlsx | Revenue trends |
| **Projects** | `/projects.html` | Projects.xlsx | Timeline, status |
| **Services** | `/services.html` | Services.xlsx | AMC renewals |
| **Design** | `/design.html` | Design.xlsx | Jobs pipeline |
| **Accounts** | `/accounts.html` | Accounts.xlsx | Invoicing, payments |

</details>

### Option 2: Standalone Sales Dashboard (Zero Setup)
```bash
# Windows
start \"c:/Users/harsh/Projects/Dashboard/Malgudi Sales Dashboard/MCE_MA_Sales_Dashboard.html\"
```
**Live data**: Google Sheet auto-loads (revenue, GST, targets, MCE/MA split).

### Option 3: LeadFlow Dashboard
```bash
cd \"c:/Users/harsh/Projects/Dashboard/dashboard using excel/backend\"
npm install
node server.js
```
**Open**: http://localhost:3000  
**Drop Excel**: `backend/data/Lead Tracker.xlsx`

## 🎯 Project Comparison

| Project | Tech | Backend | Live Data | Multi-User | Dashboards | Setup Time |
|---------|------|---------|-----------|------------|------------|------------|
| **malgudi-hub** | Node+HTML+Chart.js | ✅ Node API | Excel/Sheets | ✅ Auth+LAN | **6** | 5 min |
| **LeadFlow** | Node+HTML+Chart.js | ✅ Node API | **Excel** | ✅ Auth | **1** (Leads) | 3 min |
| **Sales HTML** | HTML+Chart.js | ❌ None | **Google Sheets** | ❌ None | **1** (Sales) | **0 min** |

## 🔌 Data Sources & Integration

### Excel (All Projects)
1. Drop `.xlsx` in `backend/data/`
2. Sheet name: `Lead Tracker` (or first sheet)
3. Restart server → **Auto-parsed to JSON API**

### Google Sheets (Live Sync)
Update `frontend/shared/nav.js`:
```js
GSHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv',
USE_GSHEETS: true
```
✅ Real-time updates, no restarts!

## 🌐 Office LAN Sharing
1. Run `ipconfig` → Note IPv4 (e.g., `192.168.1.105`)
2. Share URL: `http://192.168.1.105:3000`
3. Windows Firewall: Allow port 3000 (one-time)

**Pro Tip**: Use PM2 for auto-restart:
```bash
npm i -g pm2
pm2 start server.js --name malgudi-hub
```

## ✨ Shared Features
- 📊 **Interactive Charts** (Chart.js): Trends, funnels, pies, bars
- 🔍 **Live Filters**: Date, state, product, owner, status
- 🎨 **Themes**: Dark/Light (persists)
- 📱 **Responsive**: Mobile → Ultra-wide
- 🚀 **Performance**: <100ms updates
- 💾 **Export**: Filtered data to Excel/CSV

## 🛠 Development & Customization
```bash
# Install deps (per backend)
npm install

# Dev mode (auto-reload)
npm run dev

# Add Excel files to backend/data/
# Update nav.js for Google Sheets URLs/users
```

**Rebranding**: Edit CSS vars (`--accent: #your-color`).

## 📋 TODO Progress
See [TODO.md](TODO.md)

## 🤝 Contributing
1. Add your Excel → Test dashboard
2. Report issues in GitHub Discussions
3. PRs welcome for new dashboards/metrics

## 🆘 Troubleshooting
| Issue | Fix |
|-------|-----|
| `Cannot GET /leads.html` | Use full path or start correct server |
| No data/charts | Verify Excel sheet name/columns |
| Port busy | Change `PORT=4000` in server.js |
| CORS/Sheets | Use `gviz/tq?tqx=out:csv` format |
| npm missing | Install Node.js LTS |

## 📄 License
**🎯 Use Case**

This project is designed for:

Sales teams
Lead tracking systems
Business analytics
Excel-based reporting automation

## 👨‍💻Author

**Harsh Raja**

GitHub: https://github.com/HR014

## ⭐ Future Improvements
API integration
Authentication system
Advanced analytics (Power BI style)
Database integration (MongoDB/MySQL)

**Built for sales excellence** 🚀
