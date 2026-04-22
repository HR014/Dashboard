# 🏗️ Malgudi Cranes & Equipments — Dashboard Collection

[![Node.js](https://img.shields.io/badge/Node.js-v18+-3C873A?style=flat\&logo=node.js)](https://nodejs.org)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat\&logo=html5)](https://html5.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat\&logo=chart.js\&logoColor=white)](https://chartjs.org)

Production-ready **Business Intelligence dashboards** for **Lead Tracking, Sales Analytics, Projects, and Services** at Malgudi Cranes.

Built for **office LAN usage (zero cloud cost)** with support for:

* Excel-based data
* Google Sheets live sync

---

## 📁 Repo Structure

```
Dashboard/
├── dashboard using excel/           # LeadFlow Dashboard (Full Stack)
│   ├── backend/ (Node + Excel API)
│   └── frontend/ (UI + Charts)
├── Malgudi Sales Dashboard/        # Standalone HTML Dashboard
│   └── MCE_MA_Sales_Dashboard.html
├── malgudi-hub/                    # BI Hub (6 Dashboards)
│   ├── backend/
│   └── frontend/
├── README.md
```

---

## 🚀 Quick Start

### 🔹 Option 1: malgudi-hub (Recommended)

```
cd malgudi-hub/backend
npm install
node server.js
```

Open: http://localhost:3000
Login:

* admin / admin123
* manager / manager456

---

### 🔹 Option 2: Standalone Sales Dashboard

```
Open: Malgudi Sales Dashboard/MCE_MA_Sales_Dashboard.html
```

✔ No setup required
✔ Uses Google Sheets live data

---

### 🔹 Option 3: LeadFlow Dashboard

```
cd dashboard using excel/backend
npm install
node server.js
```

---

## 📊 Features

* Interactive Charts (Chart.js)
* Excel + Google Sheets Integration
* Live Filters (Date, State, Product, etc.)
* Responsive UI
* LAN Sharing Support
* Export to Excel/CSV
* Dark/Light Theme

---

## 🔌 Data Integration

### Excel

* Place `.xlsx` inside:

```
backend/data/
```

### Google Sheets

Update:

```js
GSHEET_URL = "your-link"
```

---

## 🌐 LAN Usage

1. Run:

```
ipconfig
```

2. Use:

```
http://YOUR-IP:3000
```

---

## 💻 Multi-PC Development Workflow

### 🖥️ First Time Setup (New PC)

```
git clone https://github.com/HR014/Dashboard.git
cd Dashboard
git checkout main
git pull origin main
```

---

### 🔁 Daily Workflow (Any PC)

Before starting:

```
git pull origin main
```

After changes:

```
git add .
git commit -m "update"
git push origin main
```

---

## 📁 Working on Specific Folder (Recommended)

Example: Only working on `malgudi-hub`

```
git pull origin main

# Make changes in malgudi-hub/

git add malgudi-hub/
git commit -m "Updated malgudi-hub"
git push origin main
```

✔ Prevents unwanted file commits
✔ Keeps repo clean

---

## 🔄 Switching Between PCs

### PC1

```
git push origin main
```

### PC2

```
git pull origin main
```

Workflow:

```
PC1 → PUSH → PC2 → PULL
PC2 → PUSH → PC1 → PULL
```

---

## ⚠️ Rules to Follow

* Always `git pull` before starting work
* Always commit before switching PC
* Avoid `git add .` unless needed
* Resolve conflicts immediately

---

## 🚀 Advanced (Optional)

Use feature branches:

```
git checkout -b feature-update
git add malgudi-hub/
git commit -m "feature update"
git push origin feature-update
```

---

## 🛠 Tech Stack

* HTML, CSS, JavaScript
* Node.js
* Chart.js
* Excel / Google Sheets

---

## 👨‍💻 Author

**Harsh Raja**
GitHub: https://github.com/HR014

---

## ⭐ Future Improvements

* API Integration
* Authentication Enhancements
* Database Integration (MongoDB/MySQL)
* Advanced Analytics

---

## 📌 Use Case

* Sales Teams
* Lead Management
* Business Analytics
* Excel Automation Systems

---

🚀 Built for real-world business usage
