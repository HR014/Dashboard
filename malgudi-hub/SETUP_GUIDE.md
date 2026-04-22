# 🏗️ Malgudi BI Hub v2.0 — Complete Setup Guide

## FILE STRUCTURE
```
malgudi-hub/
├── backend/
│   ├── server.js               ← Node.js server (serves everything)
│   ├── package.json
│   └── data/
│       ├── leads.json          ← Sample fallback data (built-in)
│       ├── Lead Tracker.xlsx   ← DROP YOUR EXCEL HERE ← ← ←
│       ├── Sales.xlsx
│       ├── Projects.xlsx
│       ├── Services.xlsx
│       ├── Design.xlsx
│       └── Accounts.xlsx
│
└── frontend/
    ├── login.html              ← Login page
    ├── index.html              ← Home page (professional hero slider)
    ├── leads.html              ← Lead Tracker (full analytics)
    ├── sales.html              ← Sales dashboard
    ├── projects.html           ← Projects tracker
    ├── services.html           ← Services / AMC dashboard
    ├── design.html             ← Design jobs tracker
    ├── accounts.html           ← Accounts dashboard
    └── shared/
        ├── style.css           ← Shared stylesheet
        └── nav.js              ← Auth, navigation, helpers, Google Sheets config
```

---

## 🚀 PART 1 — RUN ON YOUR PC (5 minutes)

### Step 1: Install Node.js
Download LTS from: https://nodejs.org

### Step 2: Install dependencies
```powershell
cd C:\path\to\malgudi-hub\backend
npm install
```

### Step 3: Start server
```powershell
node server.js
```
You'll see:
```
🏗️  ═══════════════════════════════════════════
    MALGUDI CRANES BI HUB — v2.0
    ═══════════════════════════════════════════

🚀  Server running at: http://localhost:3000
🌐  Share with office: http://192.168.1.105:3000
```

### Step 4: Open in browser
http://localhost:3000

**Login credentials:**
| Username | Password |
|----------|----------|
| admin | admin123 |
| manager | manager456 |
| accounts | accounts789 |

---

## 📊 PART 2 — CONNECT YOUR EXCEL DATA

### Fastest method — just drop your file:
1. Copy your `Lead Tracker.xlsx` to `backend/data/`
2. Make sure the first sheet is named **Lead Tracker** (or it reads any first sheet)
3. Restart server: Ctrl+C then `node server.js`
4. Dashboard auto-reads the file — no config needed!

### Column headers expected (Lead Tracker.xlsx):
```
Sr No | Date | Company Name | Location | State | Product Type | 
Capacity/Specs | Phone | Email | Inquiry Status | Contact Person | 
Lead Source | Lead Owner | Quotation No | Quotation Date | 
Expected Order Value | Quotation Status | Order Loss Analysis | Remarks
```

### Other Excel files (add these to backend/data/):
| File | Sheet Name | Used By |
|------|-----------|---------|
| Lead Tracker.xlsx | Lead Tracker | leads.html |
| Sales.xlsx | Sales | sales.html |
| Projects.xlsx | Projects | projects.html |
| Services.xlsx | Services | services.html |
| Design.xlsx | Design | design.html |
| Accounts.xlsx | Accounts | accounts.html |

---

## 🌐 PART 3 — OFFICE LAN ACCESS

### Find your PC's IP:
```powershell
ipconfig
# Look for IPv4 Address: 192.168.1.XXX
```

### Share with colleagues:
Tell them to open: `http://192.168.1.XXX:3000`

### Windows Firewall — allow access:
```powershell
# Run as Administrator:
netsh advfirewall firewall add rule name="Malgudi BI Hub" dir=in action=allow protocol=TCP localport=3000
```
OR: Windows Defender Firewall → Advanced → Inbound Rules → New Rule → Port 3000 → Allow

---

## 📊 PART 4 — GOOGLE SHEETS LIVE DATA

Instead of Excel, connect directly to Google Sheets for real-time updates!

### Step 1: Prepare your Google Sheet
1. Open Google Sheets with your lead data
2. Name the sheet tab exactly: `Lead Tracker`
3. Headers must match the column names above

### Step 2: Publish to web
1. File → Share → Publish to web
2. Select sheet: **Lead Tracker**
3. Format: **CSV**
4. Click **Publish** → Copy the URL

### Step 3: Configure nav.js
Open `frontend/shared/nav.js` and update these 2 lines:
```javascript
GSHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_ID/pub?gid=0&single=true&output=csv',
USE_GSHEETS: true,   // ← change false to true
```

### Step 4: Verify
- Dashboard header shows "🟢 Google Sheets Live"
- Add a row to your sheet → dashboard updates in 30 seconds

### If CORS error, use this URL format instead:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv&sheet=Lead%20Tracker
```

**Priority order:** Backend API (Excel) → Google Sheets → Sample Data

---

## 🔁 PART 5 — AUTO-START (Keep server always running)

### Method A: PM2 (Best — restarts if server crashes)
```powershell
npm install -g pm2
cd C:\path\to\malgudi-hub\backend
pm2 start server.js --name "malgudi-hub"
pm2 startup
pm2 save
```

### Method B: Windows Task Scheduler
```powershell
# Run once as Administrator:
schtasks /create /tn "MalgudiHub" /tr "node C:\path\to\malgudi-hub\backend\server.js" /sc onlogon /ru %USERNAME% /f
```

### Method C: Startup BAT file (simplest)
Create `start-malgudi.bat`:
```batch
@echo off
cd /d C:\path\to\malgudi-hub\backend
node server.js
```
Press Win+R → `shell:startup` → Place the .bat file there

---

## 🔐 PART 6 — CHANGE PASSWORDS

Edit `frontend/shared/nav.js`:
```javascript
USERS: { 
  admin: 'YourStrongPassword1',
  manager: 'YourStrongPassword2',
  accounts: 'AccountsPass3',
  priya: 'PriyaPassword4'  // add more users
},
```
Note: Passwords are client-side only. For true security, use a real auth backend.

---

## 📱 PART 7 — MOBILE ACCESS

Works automatically on any device on office WiFi:
- Connect phone to office WiFi
- Open browser → `http://192.168.1.XXX:3000`
- Dashboard is fully responsive

**Add to home screen (Android/iOS):**
Chrome/Safari → Menu → "Add to Home Screen"

---

## 🗺️ NETWORK DIAGRAM
```
Office WiFi Router
       │
       ├── Your PC (Server)     → runs node server.js
       │      IP: 192.168.1.105   port: 3000
       │
       ├── Colleague PC         → http://192.168.1.105:3000
       ├── Manager Laptop       → http://192.168.1.105:3000
       ├── Sales Phone          → http://192.168.1.105:3000
       └── Accounts PC          → http://192.168.1.105:3000
```

---

## ✅ QUICK CHECKLIST

- [ ] Node.js installed (nodejs.org)
- [ ] `npm install` done in backend/
- [ ] `node server.js` running — see green output
- [ ] Open http://localhost:3000 → login works
- [ ] Drop `Lead Tracker.xlsx` in backend/data/
- [ ] Note your IP from `ipconfig`
- [ ] Firewall rule added for port 3000
- [ ] Colleagues can access via `http://YOUR_IP:3000`
- [ ] PM2 configured for auto-start
- [ ] Google Sheets URL configured (optional — for live updates)

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `Cannot find module 'express'` | Run `npm install` in backend/ |
| `Port 3000 in use` | Change PORT in server.js to 4000 or 5000 |
| Colleagues can't connect | Check firewall rule, verify same WiFi network |
| Excel not loading | Verify file is in backend/data/, sheet name matches |
| Google Sheets CORS error | Use `gviz/tq?tqx=out:csv` URL format |
| Dashboard shows "—" everywhere | Excel has no data, or column names don't match |
| Login redirect loop | Clear browser sessionStorage (DevTools → Application) |

---

*Malgudi Cranes & Equipments Private Limited — BI Hub v2.0 © 2025*
