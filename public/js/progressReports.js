const prContractSelect = document.getElementById('prContractSelect');
const prContractTitle = document.getElementById('prContractTitle');
const prCompletePercent = document.getElementById('prCompletePercent');
const prCompleteBar = document.getElementById('prCompleteBar');
const prWeeksSubmitted = document.getElementById('prWeeksSubmitted');
const prAwaitingReview = document.getElementById('prAwaitingReview');
const prItemsOver = document.getElementById('prItemsOver');
const prOveragePanel = document.getElementById('prOveragePanel');
const prOverageGrid = document.getElementById('prOverageGrid');
const prSubmissionsList = document.getElementById('prSubmissionsList');
const prSubmissionDetail = document.getElementById('prSubmissionDetail');
const prSubmissionsPanel = document.getElementById('prSubmissionsPanel');
const prToDatePanel = document.getElementById('prToDatePanel');
const prToDateBody = document.getElementById('prToDateBody');

let prSelectedContractId = null;
let prSelectedReportId = null;

async function prLoadContracts() {
    const res = await fetch('/api/contracts/dropdown');
    const contracts = await res.json();

    prContractSelect.innerHTML = contracts
        .map((c) => `<option value="${c.id}">${c.contract_name}</option>`)
        .join('');

    if (contracts.length) {
        prSelectedContractId = contracts[0].id;
        prContractTitle.textContent = contracts[0].contract_name;
        prLoadOverview();
        prLoadToDate();
    }
}

async function prLoadOverview() {
    if (!prSelectedContractId) return;

    const res = await fetch(`/api/contracts/${prSelectedContractId}/progress-reports`);
    if (!res.ok) return;
    const data = await res.json();

    prCompletePercent.textContent = `${data.completionPercent}%`;
    prCompleteBar.style.width = `${Math.min(data.completionPercent, 100)}%`;
    prWeeksSubmitted.textContent = data.weeksSubmitted;
    prAwaitingReview.textContent = data.awaitingReview;
    prItemsOver.textContent = data.itemsOverProposal;

    if (data.overageFlags.length) {
        prOveragePanel.hidden = false;
        prOverageGrid.innerHTML = data.overageFlags.map((item) => `
            <div class="pr-overage-card">
                <div class="code">${item.bid_item_no ?? 'Item #' + item.id}</div>
                <div class="desc">${item.description ?? ''}</div>
                <div class="amt">${item.to_date} ${item.unit_of_measure} placed vs ${item.proposal} proposed &mdash; ${Math.round(item.to_date - item.proposal)} over</div>
            </div>
        `).join('');
    } else {
        prOveragePanel.hidden = true;
        prOverageGrid.innerHTML = '';
    }

    renderSubmissionsList(data.reports);
}

function renderSubmissionsList(reports) {
    if (!reports.length) {
        prSubmissionsList.innerHTML = '<p class="pr-empty">No weekly reports submitted yet.</p>';
        return;
    }

    prSubmissionsList.innerHTML = reports.map((r) => `
        <div class="pr-submission-card${r.id === prSelectedReportId ? ' active' : ''}" data-id="${r.id}">
            <div class="top-row">
                <span>${r.report_code}</span>
                <span class="pr-badge ${r.status}">${r.status === 'pending' ? 'New' : 'Synced'}</span>
            </div>
            <div class="meta">${formatDateRange(r.week_start, r.week_end)}</div>
            <div class="meta">${r.foreman_name || 'Unknown foreman'} &middot; ${r.line_item_count} line item${r.line_item_count === '1' ? '' : 's'} &middot; ${r.total_units} units</div>
        </div>
    `).join('');

    prSubmissionsList.querySelectorAll('.pr-submission-card').forEach((card) => {
        card.addEventListener('click', () => {
            prSelectedReportId = parseInt(card.dataset.id);
            prSubmissionsList.querySelectorAll('.pr-submission-card').forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            loadSubmissionDetail(prSelectedReportId);
        });
    });
}

function formatDateRange(start, end) {
    const fmt = (d) => new Date(d).toLocaleDateString('en-US');
    return `${fmt(start)} - ${fmt(end)}`;
}

async function loadSubmissionDetail(reportId) {
    const res = await fetch(`/api/progress-reports/${reportId}`);
    if (!res.ok) return;
    const report = await res.json();

    const itemRows = report.items.map((item) => `
        <tr>
            <td>${item.bid_item_no ?? '-'}</td>
            <td>${item.description ?? ''}</td>
            <td>${item.unit_of_measure ?? ''}</td>
            <td class="num">${item.qty_this_week}</td>
        </tr>
    `).join('');

    prSubmissionDetail.innerHTML = `
        <div class="pr-detail-header">
            <div>
                <h3>${formatDateRange(report.week_start, report.week_end)}</h3>
                <div class="sub">${report.work_order_code} &middot; Foreman ${report.foreman_name || 'Unknown'} &middot; ${report.title}</div>
            </div>
            ${report.status === 'pending'
                ? `<button type="button" class="pr-approve-btn" id="prApproveBtn">Approve &amp; queue</button>`
                : `<span class="pr-badge approved">Synced</span>`}
        </div>
        ${report.crew_notes ? `<div class="pr-crew-note">${report.crew_notes}</div>` : ''}
        <div class="pr-table-wrap">
            <table class="pr-table">
                <thead><tr><th>Item</th><th>Description</th><th>Unit</th><th class="num">This Week</th></tr></thead>
                <tbody>${itemRows}</tbody>
            </table>
        </div>
    `;

    const approveBtn = document.getElementById('prApproveBtn');
    if (approveBtn) {
        approveBtn.addEventListener('click', async () => {
            approveBtn.disabled = true;
            approveBtn.textContent = 'Approving...';
            try {
                const approveRes = await fetch(`/api/progress-reports/${reportId}/approve`, { method: 'POST' });
                if (!approveRes.ok) throw new Error('Failed to approve');
                await prLoadOverview();
                await loadSubmissionDetail(reportId);
                await prLoadToDate();
            } catch (err) {
                console.log(err.message);
                alert('Failed to approve report. Please try again.');
                approveBtn.disabled = false;
                approveBtn.textContent = 'Approve & queue';
            }
        });
    }
}

async function prLoadToDate() {
    if (!prSelectedContractId) return;

    const res = await fetch(`/api/contracts/${prSelectedContractId}/progress-reports/to-date`);
    if (!res.ok) return;
    const items = await res.json();

    prToDateBody.innerHTML = items.map((item) => `
        <tr class="${item.status === 'Over' ? 'over' : ''}">
            <td>${item.bid_item_no ?? '-'}</td>
            <td>${item.description ?? ''}</td>
            <td>${item.unit_of_measure ?? ''}</td>
            <td class="num">${item.proposal}</td>
            <td class="num">${item.to_date}</td>
            <td class="num">${item.remaining}</td>
            <td><span class="pr-status-chip ${item.status}">${item.status}</span></td>
        </tr>
    `).join('');
}

prContractSelect.addEventListener('change', () => {
    prSelectedContractId = parseInt(prContractSelect.value);
    prSelectedReportId = null;
    prContractTitle.textContent = prContractSelect.selectedOptions[0].textContent;
    prSubmissionDetail.innerHTML = '<p class="pr-empty">Select a submission to view its details.</p>';
    prLoadOverview();
    prLoadToDate();
});

document.querySelectorAll('.pr-subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pr-subtab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.subtab;
        prSubmissionsPanel.hidden = target !== 'submissions';
        prToDatePanel.hidden = target !== 'toDate';
    });
});

// Progress Reports is a sub-tab within Work Orders, not its own sidebar
// tab - load its data lazily the first time it's actually opened rather
// than on every Work Orders page load.
const woMainView = document.getElementById('woMainView');
const woProgressReportsView = document.getElementById('woProgressReportsView');
const woContentCta = document.querySelector('#workOrderContent > .content-header .content-cta');
let prLoaded = false;

function showWoSubtab(target) {
    woMainView.hidden = target !== 'workOrders';
    woProgressReportsView.hidden = target !== 'progressReports';
    if (woContentCta) woContentCta.hidden = target !== 'workOrders';

    if (target === 'progressReports' && !prLoaded) {
        prLoaded = true;
        prLoadContracts();
    }
}

// "Progress Reports" is nested under "Work Orders" in the sidebar rather
// than being its own top-level tab or an in-page tab bar. Both sidebar
// items share data-tab="workOrderContent" (so main.js's generic tab
// switcher activates the right panel either way) - this listener just also
// picks the correct sub-view once that panel is showing.
document.querySelectorAll('li[data-tab="workOrderContent"]').forEach((item) => {
    item.addEventListener('click', () => {
        showWoSubtab(item.dataset.wosubtab || 'workOrders');
    });
});
