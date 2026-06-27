# 💹 Malgudi BI Hub v2.2

A professional Business Intelligence dashboard designed specifically for **Malgudi Cranes & Equipments Private Limited**. This system streamlines lead tracking, sales analysis, and project management by turning local Excel files into interactive, web-based analytics.

## 🚀 Quick Overview

The Malgudi BI Hub acts as a bridge between your operational Excel files and a centralized management dashboard. It allows multiple departments (Sales, Accounts, Design, Projects) to view live data without needing to open shared spreadsheets simultaneously.

## 🛠️ Key Features

*   **Lead Tracker Dashboard:** Full funnel analysis with state-wise, product-wise, and owner-wise filtering.
*   **Multi-Year Support:** Seamlessly switch between financial years or view an aggregated "All Years" dataset within the same Excel workbook.
*   **Automatic FY Detection:** The system knows when a new financial year starts (April 1st) and switches the default view automatically.
*   **Live Excel Sync:** Drop an updated `.xlsx` file into the data folder, and the dashboard reflects changes instantly.
*   **Sales Insights:** Combined views for MCE and MA entities.
*   **Role-Based Access:** Dedicated views for Admin, Managers, and Accounts.

## 💻 Tech Stack

*   **Backend:** Node.js & Express.
*   **Data Processing:** `xlsx` (SheetJS) for parsing complex workbooks.
*   **Frontend:** Vanilla JavaScript, Chart.js, and CSS3.
*   **Architecture:** REST API driven data flow.

## ⏱️ Fast Start

1.  Ensure **Node.js** is installed.
2.  Run `cd backend && npm install`.
3.  Place your `Lead Tracker.xlsx` in `backend/data/`.
4.  Run `node server.js`.
5.  Open `http://localhost:3000` in your browser.

---

**Developed for:**
*Malgudi Cranes & Equipments Private Limited*
*Internal Management System © 2025*