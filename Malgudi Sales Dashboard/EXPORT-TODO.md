# Export Report Feature Plan (BBX-AI)

## Information Gathered:
- Dashboard has complete data visualization (KPIs, charts, tables)
- Transaction table has search/sort/pagination
- Print styles partially exist (BBX-RESP-8 pending)
- Need PDF generation with charts and data summary

## Plan:
1. **Add Export Button**: In Transactions section header, next to search
2. **Capture Dashboard Content**: Use html2canvas + jsPDF for charts/tables
3. **Generate Multi-page PDF**:
   - Page 1: Summary (KPIs + key charts)
   - Page 2-N: Transaction table (paginated)
4. **Download**: Auto-save as "Malgudi-Sales-Report-[FY]-[Date].pdf"
5. **Print Optimization**: Enhance @media print styles for direct printing

## Dependent Files:
- `MCE_MA_Sales_Dashboard.html` (add button + JS logic)

## Followup Steps:
- Install no external deps (pure JS)
- Test PDF quality on charts
- Mobile export testing
- Update TODO.md after completion

<ask_followup_question>
Does this export plan look good? Should it include specific sections (KPIs only, full dashboard, transactions focus)? Confirm to proceed with implementation.
</ask_followup_question>
