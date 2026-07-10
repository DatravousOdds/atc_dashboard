// ============================================
// REPORTS TAB
// ============================================
// Front-end only for now — no /api/reports endpoint exists yet.
// Results are populated from placeholder data per report type so the
// two-step flow (choose report -> view results) can be reviewed and
// wired to a real endpoint later.

const REPORT_LABELS = {
    'project-performance': 'Project Performance',
    'work-order-summary': 'Work Order Summary',
    'invoice-payment': 'Invoice & Payment',
    'budget-utilization': 'Budget Utilization',
    'contract-win-rate': 'Contract Win Rate',
    'vendor-performance': 'Vendor Performance'
};

const REPORT_PLACEHOLDER_ROWS = {
    'project-performance': [
        { project: 'Northgate Terminal - HVAC Retrofit', type: 'Revenue', date: '2026-04-12', status: 'On Track', amount: 482300 },
        { project: 'I-35 Signal Upgrade', type: 'Revenue', date: '2026-04-02', status: 'At Risk', amount: 215400 },
        { project: 'Riverside Bridge Repair', type: 'Revenue', date: '2026-03-28', status: 'Completed', amount: 891200 },
        { project: 'Downtown Loop Resurfacing', type: 'Revenue', date: '2026-03-15', status: 'On Track', amount: 356700 },
        { project: 'Airport Access Road', type: 'Revenue', date: '2026-02-20', status: 'Delayed', amount: 128900 },
        { project: 'Westside Drainage Project', type: 'Revenue', date: '2026-02-10', status: 'Completed', amount: 674500 }
    ],
    'work-order-summary': [
        { project: 'Northgate Terminal - HVAC Retrofit', type: 'Assignment', date: '2026-05-01', status: 'In Progress', amount: 12 },
        { project: 'I-35 Signal Upgrade', type: 'Assignment', date: '2026-04-28', status: 'Completed', amount: 8 },
        { project: 'Riverside Bridge Repair', type: 'Assignment', date: '2026-04-20', status: 'In Progress', amount: 5 },
        { project: 'Downtown Loop Resurfacing', type: 'Assignment', date: '2026-04-11', status: 'Overdue', amount: 3 }
    ],
    'invoice-payment': [
        { project: 'Northgate Terminal - HVAC Retrofit', type: 'Invoice', date: '2026-05-05', status: 'Paid', amount: 94200 },
        { project: 'I-35 Signal Upgrade', type: 'Invoice', date: '2026-04-22', status: 'Outstanding', amount: 41800 },
        { project: 'Riverside Bridge Repair', type: 'Invoice', date: '2026-04-09', status: 'Paid', amount: 152300 },
        { project: 'Airport Access Road', type: 'Invoice', date: '2026-03-30', status: 'Outstanding', amount: 26900 }
    ],
    'budget-utilization': [
        { project: 'Northgate Terminal - HVAC Retrofit', type: 'Budget', date: '2026-05-01', status: '78% Used', amount: 780000 },
        { project: 'I-35 Signal Upgrade', type: 'Budget', date: '2026-05-01', status: '54% Used', amount: 540000 },
        { project: 'Riverside Bridge Repair', type: 'Budget', date: '2026-05-01', status: '96% Used', amount: 960000 }
    ],
    'contract-win-rate': [
        { project: 'TxDOT District 12 Resurfacing', type: 'Bid', date: '2026-03-01', status: 'Won', amount: 1240000 },
        { project: 'County Rd 48 Widening', type: 'Bid', date: '2026-02-14', status: 'Lost', amount: 640000 },
        { project: 'City Hall Parking Structure', type: 'Bid', date: '2026-01-22', status: 'Won', amount: 890000 }
    ],
    'vendor-performance': [
        { project: 'Alamo Aggregates', type: 'Vendor', date: '2026-04-15', status: 'On Time', amount: 128400 },
        { project: 'Lone Star Electrical Supply', type: 'Vendor', date: '2026-04-01', status: 'Delayed', amount: 54200 },
        { project: 'Hill Country Concrete', type: 'Vendor', date: '2026-03-18', status: 'On Time', amount: 219800 }
    ]
};

const ROWS_PER_PAGE = 5;
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

let currentRows = [];
let filteredRows = [];
let currentPage = 1;
let selectedReportKey = null;

document.addEventListener('DOMContentLoaded', function () {
    const reportTypeStep = document.getElementById('reportTypeStep');
    const reportResultsStep = document.getElementById('reportResultsStep');
    const reportCategoryTabs = document.getElementById('reportCategoryTabs');
    const reportTypeGrid = document.getElementById('reportTypeGrid');
    const runReportBtn = document.getElementById('runReportBtn');
    const reportBackBtn = document.getElementById('reportBackBtn');
    const reportResultsTitle = document.getElementById('reportResultsTitle');
    const reportSearchInput = document.getElementById('reportSearchInput');
    const reportsResultsBody = document.getElementById('reportsResultsBody');
    const reportPagination = document.getElementById('reportPagination');
    const reportPrintBtn = document.getElementById('reportPrintBtn');
    const reportExportBtn = document.getElementById('reportExportBtn');

    if (!reportTypeStep || !reportResultsStep) return;

    // ---- Step 1: category filter ----
    reportCategoryTabs.addEventListener('click', function (e) {
        const btn = e.target.closest('.report-category-btn');
        if (!btn) return;

        reportCategoryTabs.querySelectorAll('.report-category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.category;
        reportTypeGrid.querySelectorAll('.report-card').forEach(card => {
            const matches = category === 'all' || card.dataset.category === category;
            card.style.display = matches ? '' : 'none';
        });
    });

    // ---- Step 1: report card selection ----
    reportTypeGrid.addEventListener('change', function (e) {
        if (e.target.matches('.report-card-input')) {
            runReportBtn.disabled = false;
        }
    });

    // ---- Step 1 -> Step 2 ----
    runReportBtn.addEventListener('click', function () {
        const selectedInput = reportTypeGrid.querySelector('.report-card-input:checked');
        if (!selectedInput) return;

        selectedReportKey = selectedInput.value;
        reportResultsTitle.textContent = REPORT_LABELS[selectedReportKey] || 'Report Results';
        currentRows = REPORT_PLACEHOLDER_ROWS[selectedReportKey] || [];
        filteredRows = currentRows;
        currentPage = 1;
        reportSearchInput.value = '';
        renderResultsTable();

        reportTypeStep.classList.remove('active');
        reportResultsStep.classList.add('active');
    });

    // ---- Step 2 -> Step 1 ----
    reportBackBtn.addEventListener('click', function () {
        reportResultsStep.classList.remove('active');
        reportTypeStep.classList.add('active');
    });

    // ---- Search ----
    reportSearchInput.addEventListener('input', function () {
        const term = reportSearchInput.value.trim().toLowerCase();
        filteredRows = !term
            ? currentRows
            : currentRows.filter(row =>
                Object.values(row).some(value => String(value).toLowerCase().includes(term))
            );
        currentPage = 1;
        renderResultsTable();
    });

    // ---- Print ----
    reportPrintBtn.addEventListener('click', function () {
        window.print();
    });

    // ---- Export (xlsx via SheetJS, already loaded for work order export) ----
    reportExportBtn.addEventListener('click', function () {
        if (!filteredRows.length) {
            console.log('No report rows to export.');
            return;
        }

        const exportRows = filteredRows.map(row => ({
            Project: row.project,
            Type: row.type,
            Date: row.date,
            Status: row.status,
            Amount: row.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        const fileLabel = (REPORT_LABELS[selectedReportKey] || 'report').toLowerCase().replace(/\s+/g, '-');
        XLSX.writeFile(workbook, `${fileLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    });

    function renderResultsTable() {
        reportsResultsBody.innerHTML = '';

        if (!filteredRows.length) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'report-no-results';
            emptyRow.innerHTML = '<td colspan="5">No results found.</td>';
            reportsResultsBody.appendChild(emptyRow);
            renderPagination(0);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
        currentPage = Math.min(currentPage, totalPages);
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        const pageRows = filteredRows.slice(start, start + ROWS_PER_PAGE);

        pageRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.project}</td>
                <td>${row.type}</td>
                <td>${row.date}</td>
                <td>${row.status}</td>
                <td>${currencyFormatter.format(row.amount)}</td>
            `;
            reportsResultsBody.appendChild(tr);
        });

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        reportPagination.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'report-page-nav';
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.setAttribute('title', 'Previous page');
        prevBtn.disabled = currentPage <= 1;
        prevBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
        prevBtn.addEventListener('click', function () {
            currentPage -= 1;
            renderResultsTable();
        });
        reportPagination.appendChild(prevBtn);

        for (let page = 1; page <= totalPages; page += 1) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = 'report-page-btn' + (page === currentPage ? ' active' : '');
            pageBtn.dataset.page = String(page);
            pageBtn.textContent = String(page);
            pageBtn.addEventListener('click', function () {
                currentPage = page;
                renderResultsTable();
            });
            reportPagination.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'report-page-nav';
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.setAttribute('title', 'Next page');
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
        nextBtn.addEventListener('click', function () {
            currentPage += 1;
            renderResultsTable();
        });
        reportPagination.appendChild(nextBtn);
    }
});
