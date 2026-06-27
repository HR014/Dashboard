# 📖 Malgudi BI Hub: The Detailed Guidebook

## 🏛️ System Architecture

The Malgudi BI Hub follows a "Local-First" architecture. Unlike traditional BI tools that require cloud databases, this system uses your existing Excel workflow as the "database."

### 1. The Data Layer (`backend/data/`)
The backend monitors the `data` folder for specific filenames like `Lead Tracker.xlsx` and `Sales.xlsx`. 
*   **Logic:** When an API request comes in, the server opens the file, reads the relevant tab (Financial Year), and converts the rows into JSON objects.
*   **Normalization:** Since different people might name columns differently (e.g., "Sr No" vs "S.No"), the `normalizeLeadRow` function in `server.js` acts as a translator to ensure the dashboard always understands the data.

### 2. The Logic Layer (`backend/server.js`)
The server handles:
*   **FY Calculation:** `getCurrentFY()` determines the current period (April to March).
*   **Fuzzy Matching:** If you name a sheet `2025-2026` but the code expects `2025 - 2026`, the server strips spaces and dashes to find the best match.
*   **Aggregation:** When `year=all` is requested, the server loops through every sheet in the workbook and combines those that look like Financial Years into a single master list.
*   **YoY Growth:** The API automatically calculates Year-over-Year growth by fetching the previous year's data and applying the same filters for a direct comparison.
*   **Filtering:** The server does the heavy lifting of filtering data by state, owner, or status before sending it to your browser.

### 3. The Presentation Layer (`frontend/`)
*   **`nav.js`:** The brain of the frontend. It handles security, shared chart configurations, and global data fetching.
*   **`fetchData()`:** This function is centralized. It can talk to either the local Node server or directly to Google Sheets if configured.

## 📅 Financial Year (FY) Logic

The Hub is hardcoded for the **Indian Financial Year (April 1 - March 31)**. 

*   **Current Date:** Feb 2025 -> System defaults to `2024-2025`.
*   **Current Date:** April 2025 -> System defaults to `2025-2026`.

To support this, your `Lead Tracker.xlsx` should have tabs named exactly as `YYYY-YYYY`.

## 🔧 Troubleshooting Data Loading

If your dashboard shows "Sample Data" instead of "Excel File Live":

1.  **Check Headers:** Ensure your Excel headers match one of the aliases in `normalizeLeadRow`. For example, a "Company Name" column is required.
2.  **Check Empty Rows:** The system filters out rows that don't have a Serial Number, Date, or Company Name.
3.  **Check Permissions:** Ensure the Excel file isn't "Locked for Editing" by another user on the network.

## 🎨 Customizing the Dashboard

### Adding a User
Open `frontend/shared/nav.js` and add a new entry to the `USERS` object:
```javascript
USERS: { 
  admin: 'admin123', 
  new_user: 'password789' 
}
```

### Changing Brand Colors
The `MALGUDI.COLORS` array in `nav.js` controls the sequence of colors used in all charts. You can reorder these hex codes to change the look of the dashboard.

## 📡 Network Sharing
The Hub is designed to run on one "Server" PC (e.g., the Project Engineer's PC). 
1.  Find your IP address (`ipconfig` in CMD).
2.  Others can join by typing `http://YOUR_IP:3000`.
3.  Ensure the firewall rule for Port 3000 is active (see `SETUP_GUIDE.md`).

---
*Documentation updated Feb 2025*
*For technical support, refer to the source code comments in server.js.*