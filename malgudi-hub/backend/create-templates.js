const path = require('path');
const XLSX = require('./node_modules/xlsx');

const dataDir = path.join(__dirname, 'data');

function writeWorkbook(filename, sheetName, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, path.join(dataDir, filename));
}

const leadRows = [
  {
    'Sr No': 1,
    'Date': '2025-01-05',
    'Company Name': 'Kalyani Steel Ltd',
    'Location': 'Pune',
    'State': 'Maharashtra',
    'Product Type': 'EOT Crane',
    'Capacity/Specs': '3T 15M Span',
    'Phone': '9876543210',
    'Email': 'buyer@kalyani.com',
    'Inquiry Status': 'Won',
    'Contact Person': 'Rahul Kalyani',
    'Lead Source': 'Reference',
    'Lead Owner': 'Amit Shah',
    'Quotation No': 'QT-001',
    'Quotation Date': '2025-01-08',
    'Expected Order Value': 1850000,
    'Quotation Status': 'Accepted',
    'Order Loss Analysis': '',
    'Remarks': '3T EOT for fabrication bay'
  },
  {
    'Sr No': 2,
    'Date': '2025-01-10',
    'Company Name': 'Usha Breco Ltd',
    'Location': 'Dhanbad',
    'State': 'Jharkhand',
    'Product Type': 'EOT Crane',
    'Capacity/Specs': '5T 18M Span',
    'Phone': '9822001122',
    'Email': 'projects@ushabreco.com',
    'Inquiry Status': 'Lost',
    'Contact Person': 'S.K. Verma',
    'Lead Source': 'Exhibition',
    'Lead Owner': 'Amit Shah',
    'Quotation No': 'QT-003',
    'Quotation Date': '2025-01-14',
    'Expected Order Value': 3200000,
    'Quotation Status': 'Rejected',
    'Order Loss Analysis': 'Price High',
    'Remarks': 'Competition won on price'
  },
  {
    'Sr No': 3,
    'Date': '2025-02-18',
    'Company Name': 'BHEL Hyderabad',
    'Location': 'Hyderabad',
    'State': 'Telangana',
    'Product Type': 'EOT Crane',
    'Capacity/Specs': '10T Double Girder',
    'Phone': '9849009988',
    'Email': 'purchase@bhel.in',
    'Inquiry Status': 'Won',
    'Contact Person': 'P. Reddy',
    'Lead Source': 'Reference',
    'Lead Owner': 'Rajesh Nair',
    'Quotation No': 'QT-013',
    'Quotation Date': '2025-02-22',
    'Expected Order Value': 1650000,
    'Quotation Status': 'Accepted',
    'Order Loss Analysis': '',
    'Remarks': 'Government order'
  },
  {
    'Sr No': 4,
    'Date': '2025-05-24',
    'Company Name': 'GSFC Ltd',
    'Location': 'Vadodara',
    'State': 'Gujarat',
    'Product Type': 'EOT Crane',
    'Capacity/Specs': '7.5T 20M Span',
    'Phone': '9898012345',
    'Email': 'mech@gsfc.in',
    'Inquiry Status': 'Won',
    'Contact Person': 'H.B. Patel',
    'Lead Source': 'Govt Tender',
    'Lead Owner': 'Priya Sharma',
    'Quotation No': 'QT-032',
    'Quotation Date': '2025-05-27',
    'Expected Order Value': 2100000,
    'Quotation Status': 'Accepted',
    'Order Loss Analysis': '',
    'Remarks': 'Tender converted'
  },
  {
    'Sr No': 5,
    'Date': '2025-07-03',
    'Company Name': 'Bajaj Electricals',
    'Location': 'Pune',
    'State': 'Maharashtra',
    'Product Type': 'Hoist',
    'Capacity/Specs': '1T Electric Hoist',
    'Phone': '9819012233',
    'Email': 'procurement@bajajelectricals.com',
    'Inquiry Status': 'Quotation Sent',
    'Contact Person': 'Anuj Poddar',
    'Lead Source': 'Website',
    'Lead Owner': 'Priya Sharma',
    'Quotation No': 'QT-042',
    'Quotation Date': '2025-07-06',
    'Expected Order Value': 420000,
    'Quotation Status': 'Pending',
    'Order Loss Analysis': '',
    'Remarks': 'Awaiting customer reply'
  }
];

const salesRows = [
  {
    'Date': '2025-04-01',
    'Salesperson': 'Amit Shah',
    'Region': 'West',
    'Customer': 'JSW Steel',
    'Product Type': 'EOT Crane',
    'Order No': 'SO-101',
    'Order Value': 1580000,
    'Collection Value': 950000,
    'Status': 'Won',
    'Remarks': 'Phase 1 billed'
  },
  {
    'Date': '2025-04-24',
    'Salesperson': 'Amit Shah',
    'Region': 'West',
    'Customer': 'Torrent Power',
    'Product Type': 'Gantry Crane',
    'Order No': 'SO-102',
    'Order Value': 8500000,
    'Collection Value': 2400000,
    'Status': 'Won',
    'Remarks': 'Multi-crane package'
  },
  {
    'Date': '2025-05-12',
    'Salesperson': 'Priya Sharma',
    'Region': 'West',
    'Customer': 'Nuvoco Vistas',
    'Product Type': 'LCS Crane',
    'Order No': 'SO-103',
    'Order Value': 1260000,
    'Collection Value': 600000,
    'Status': 'Won',
    'Remarks': 'Civil plant order'
  },
  {
    'Date': '2025-06-21',
    'Salesperson': 'Rajesh Nair',
    'Region': 'North',
    'Customer': 'NTPC Ltd',
    'Product Type': 'EOT Crane',
    'Order No': 'SO-104',
    'Order Value': 4800000,
    'Collection Value': 1800000,
    'Status': 'Won',
    'Remarks': 'PSU order'
  },
  {
    'Date': '2025-07-14',
    'Salesperson': 'Rajesh Nair',
    'Region': 'East',
    'Customer': 'Vedanta Ltd',
    'Product Type': 'EOT Crane',
    'Order No': '',
    'Order Value': 6500000,
    'Collection Value': 0,
    'Status': 'Lost',
    'Remarks': 'Lost on price'
  }
];

const projectRows = [
  {
    'Project No': 'P-001',
    'Project Name': '10T EOT Crane',
    'Client': 'JSW Steel',
    'Type': 'EOT Crane',
    'Order Value': 1580000,
    'Start Date': '2025-04-01',
    'Expected Delivery': '2025-07-30',
    'Status': 'In Progress',
    'Percent Complete': 75,
    'Remarks': 'Manufacturing stage'
  },
  {
    'Project No': 'P-002',
    'Project Name': '2x EOT 5T Cranes',
    'Client': 'Toyota Kirloskar',
    'Type': 'EOT Crane',
    'Order Value': 5800000,
    'Start Date': '2025-02-15',
    'Expected Delivery': '2025-06-30',
    'Status': 'Delayed',
    'Percent Complete': 60,
    'Remarks': 'Customer hold on dispatch'
  },
  {
    'Project No': 'P-003',
    'Project Name': 'Gantry Crane 15T',
    'Client': 'Torrent Power',
    'Type': 'Gantry',
    'Order Value': 8500000,
    'Start Date': '2025-05-01',
    'Expected Delivery': '2025-09-30',
    'Status': 'In Progress',
    'Percent Complete': 40,
    'Remarks': 'Structural fabrication underway'
  },
  {
    'Project No': 'P-004',
    'Project Name': 'Jib Crane 500kg',
    'Client': 'Havells India',
    'Type': 'Jib Crane',
    'Order Value': 380000,
    'Start Date': '2025-06-10',
    'Expected Delivery': '2025-07-25',
    'Status': 'Dispatched',
    'Percent Complete': 95,
    'Remarks': 'Ready for installation'
  },
  {
    'Project No': 'P-005',
    'Project Name': 'EOT Crane 20T',
    'Client': 'NTPC Ltd',
    'Type': 'EOT Crane',
    'Order Value': 4800000,
    'Start Date': '2025-07-01',
    'Expected Delivery': '2025-11-30',
    'Status': 'Design Phase',
    'Percent Complete': 20,
    'Remarks': 'GA drawing approval pending'
  }
];

const serviceRows = [
  {
    'Ticket No': 'SV-0084',
    'Client': 'JSW Steel',
    'Service Type': 'Breakdown',
    'Crane Type': '10T EOT',
    'Reported Date': '2025-08-01',
    'Engineer': 'Ramesh K',
    'Priority': 'High',
    'Status': 'In Progress',
    'Resolution Date': '',
    'Revenue': 35000,
    'Remarks': 'Travelled same day'
  },
  {
    'Ticket No': 'SV-0083',
    'Client': 'Kalyani Steel',
    'Service Type': 'Preventive',
    'Crane Type': '3T EOT',
    'Reported Date': '2025-07-30',
    'Engineer': 'Suresh M',
    'Priority': 'Medium',
    'Status': 'Resolved',
    'Resolution Date': '2025-07-31',
    'Revenue': 12000,
    'Remarks': 'Routine service'
  },
  {
    'Ticket No': 'SV-0082',
    'Client': 'CEAT Ltd',
    'Service Type': 'AMC Visit',
    'Crane Type': '5T EOT',
    'Reported Date': '2025-07-28',
    'Engineer': 'Ramesh K',
    'Priority': 'Low',
    'Status': 'Resolved',
    'Resolution Date': '2025-07-29',
    'Revenue': 18000,
    'Remarks': 'AMC call closed'
  },
  {
    'Ticket No': 'SV-0081',
    'Client': 'Thermax',
    'Service Type': 'Breakdown',
    'Crane Type': 'Gantry 15T',
    'Reported Date': '2025-07-25',
    'Engineer': 'Vivek T',
    'Priority': 'High',
    'Status': 'Pending Parts',
    'Resolution Date': '',
    'Revenue': 0,
    'Remarks': 'Awaiting gearbox'
  },
  {
    'Ticket No': 'SV-0080',
    'Client': 'Bajaj Auto',
    'Service Type': 'Inspection',
    'Crane Type': '2T Jib',
    'Reported Date': '2025-07-22',
    'Engineer': 'Suresh M',
    'Priority': 'Low',
    'Status': 'Resolved',
    'Resolution Date': '2025-07-22',
    'Revenue': 9000,
    'Remarks': 'Annual inspection complete'
  }
];

const designRows = [
  {
    'Job No': 'DG-112',
    'Project': 'NTPC 20T EOT',
    'Design Type': 'GA Drawing',
    'Assigned To': 'Sanjay V',
    'Start Date': '2025-07-01',
    'Deadline': '2025-07-18',
    'Status': 'In Progress',
    'Percent Done': 60,
    'Revision Count': 1,
    'Remarks': 'Customer comments expected'
  },
  {
    'Job No': 'DG-111',
    'Project': 'Torrent Gantry',
    'Design Type': 'Detail Design',
    'Assigned To': 'Meera P',
    'Start Date': '2025-07-05',
    'Deadline': '2025-07-20',
    'Status': 'Overdue',
    'Percent Done': 45,
    'Revision Count': 2,
    'Remarks': 'Pending beam loading check'
  },
  {
    'Job No': 'DG-110',
    'Project': 'JSW EOT Crane',
    'Design Type': 'BOM',
    'Assigned To': 'Sanjay V',
    'Start Date': '2025-07-10',
    'Deadline': '2025-07-22',
    'Status': 'Completed',
    'Percent Done': 100,
    'Revision Count': 0,
    'Remarks': 'Released to production'
  },
  {
    'Job No': 'DG-109',
    'Project': 'L&T Hoist',
    'Design Type': 'Structural',
    'Assigned To': 'Arun S',
    'Start Date': '2025-07-12',
    'Deadline': '2025-07-25',
    'Status': 'Review',
    'Percent Done': 85,
    'Revision Count': 1,
    'Remarks': 'Internal review stage'
  },
  {
    'Job No': 'DG-108',
    'Project': 'CEAT EOT Upgrade',
    'Design Type': 'Electrical',
    'Assigned To': 'Pradeep K',
    'Start Date': '2025-07-15',
    'Deadline': '2025-07-28',
    'Status': 'In Progress',
    'Percent Done': 55,
    'Revision Count': 0,
    'Remarks': 'Panel layout in progress'
  }
];

const accountRows = [
  {
    'Invoice No': 'INV-0142',
    'Client': 'Torrent Power',
    'Amount': 4250000,
    'Invoice Date': '2025-05-10',
    'Due Date': '2025-07-09',
    'Collected Amount': 0,
    'Collection Date': '',
    'Payment Mode': 'NEFT/RTGS',
    'Status': 'Overdue',
    'Remarks': 'Follow-up ongoing'
  },
  {
    'Invoice No': 'INV-0148',
    'Client': 'L&T',
    'Amount': 1900000,
    'Invoice Date': '2025-06-15',
    'Due Date': '2025-08-14',
    'Collected Amount': 950000,
    'Collection Date': '2025-07-20',
    'Payment Mode': 'Cheque',
    'Status': 'Partial',
    'Remarks': 'Balance pending'
  },
  {
    'Invoice No': 'INV-0151',
    'Client': 'JSW Steel',
    'Amount': 2900000,
    'Invoice Date': '2025-07-01',
    'Due Date': '2025-08-30',
    'Collected Amount': 0,
    'Collection Date': '',
    'Payment Mode': 'LC',
    'Status': 'Upcoming',
    'Remarks': 'Within credit terms'
  },
  {
    'Invoice No': 'INV-0153',
    'Client': 'NTPC',
    'Amount': 2400000,
    'Invoice Date': '2025-07-20',
    'Due Date': '2025-09-18',
    'Collected Amount': 0,
    'Collection Date': '',
    'Payment Mode': 'NEFT/RTGS',
    'Status': 'Upcoming',
    'Remarks': 'PSU processing'
  },
  {
    'Invoice No': 'INV-0155',
    'Client': 'Toyota Kirloskar',
    'Amount': 5800000,
    'Invoice Date': '2025-07-25',
    'Due Date': '2025-09-23',
    'Collected Amount': 1500000,
    'Collection Date': '2025-08-05',
    'Payment Mode': 'Advance',
    'Status': 'Partial',
    'Remarks': 'Stage billing'
  }
];

writeWorkbook('Lead Tracker Template.xlsx', 'Lead Tracker', leadRows);
writeWorkbook('Sales.xlsx', 'Sales', salesRows);
writeWorkbook('Projects.xlsx', 'Projects', projectRows);
writeWorkbook('Services.xlsx', 'Services', serviceRows);
writeWorkbook('Design.xlsx', 'Design', designRows);
writeWorkbook('Accounts.xlsx', 'Accounts', accountRows);

console.log('Excel templates created in backend/data');
