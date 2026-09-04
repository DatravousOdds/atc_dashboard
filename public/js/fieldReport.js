const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const confirmState = document.getElementById('confirmState');
const formState = document.getElementById('formState');

const woTitle = document.getElementById('woTitle');
const woCode = document.getElementById('woCode');
const weekSelect = document.getElementById('weekSelect');
const customerName = document.getElementById('customerName');
const projectName = document.getElementById('projectName');
const foremanName = document.getElementById('foremanName');
const itemsBody = document.getElementById('itemsBody');
const itemCount = document.getElementById('itemCount');
const crewNotes = document.getElementById('crewNotes');
const statReported = document.getElementById('statReported');
const statOverages = document.getElementById('statOverages');
const submitBtn = document.getElementById('submitBtn');

const token = new URLSearchParams(window.location.search).get('token');
let reportData = null;

function formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${date.getFullYear()}`;
}

function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

// Sun-Sat weeks going back 8 weeks from the current one - no week-picker
// concept exists anywhere else in the app, so this is generated client-side
// rather than sourced from a backend "weeks" table.
function populateWeekOptions() {
    const currentWeekStart = getWeekStart(new Date());

    for (let i = 0; i < 8; i++) {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const option = document.createElement('option');
        option.value = start.toISOString().slice(0, 10);
        option.dataset.weekEnd = end.toISOString().slice(0, 10);
        option.textContent = `${formatDate(start)} - ${formatDate(end)}` + (i === 0 ? ' (current)' : '');
        weekSelect.appendChild(option);
    }
}

function renderItems(lineItems) {
    itemCount.textContent = `${lineItems.length} item${lineItems.length === 1 ? '' : 's'}`;

    itemsBody.innerHTML = lineItems.map((item, index) => {
        const proposal = parseFloat(item.proposal) || 0;
        const prior = parseFloat(item.prior) || 0;
        return `
            <tr data-index="${index}" data-proposal="${proposal}" data-prior="${prior}">
                <td>${item.bid_item_no ?? '-'}</td>
                <td>${item.description ?? ''}</td>
                <td>${item.unit_of_measure ?? ''}</td>
                <td class="num">${proposal}</td>
                <td class="num">${prior}</td>
                <td class="num">
                    <input type="number" class="fr-qty-input" min="0" value="0" data-bid-item-id="${item.bid_item_id}">
                </td>
                <td class="num to-date-cell">${prior}</td>
            </tr>
        `;
    }).join('');

    itemsBody.querySelectorAll('.fr-qty-input').forEach((input) => {
        input.addEventListener('input', () => updateRow(input));
    });

    updateSummary();
}

function updateRow(input) {
    const row = input.closest('tr');
    const proposal = parseFloat(row.dataset.proposal);
    const prior = parseFloat(row.dataset.prior);
    const thisWeek = parseFloat(input.value) || 0;
    const toDate = prior + thisWeek;

    row.querySelector('.to-date-cell').textContent = toDate;
    row.classList.toggle('fr-over', toDate > proposal);

    updateSummary();
}

function updateSummary() {
    const rows = Array.from(itemsBody.querySelectorAll('tr'));
    let reported = 0;
    let overages = 0;

    rows.forEach((row) => {
        const input = row.querySelector('.fr-qty-input');
        const thisWeek = parseFloat(input.value) || 0;
        if (thisWeek > 0) reported++;
        if (row.classList.contains('fr-over')) overages++;
    });

    statReported.textContent = reported;
    statOverages.textContent = overages;
}

async function loadReport() {
    if (!token) {
        loadingState.hidden = true;
        errorState.hidden = false;
        return;
    }

    try {
        const res = await fetch(`/api/field-reports/${token}`);
        if (!res.ok) throw new Error('Report link not found');

        reportData = await res.json();

        woTitle.textContent = reportData.title || 'Weekly Progress Report';
        woCode.textContent = reportData.work_order_code || '';
        customerName.value = reportData.customer_name || '';
        projectName.value = reportData.contract_name || '';
        foremanName.value = reportData.assignee_name || '';

        populateWeekOptions();
        renderItems(reportData.lineItems);

        loadingState.hidden = true;
        formState.hidden = false;
    } catch (err) {
        console.log(err.message);
        loadingState.hidden = true;
        errorState.hidden = false;
    }
}

submitBtn.addEventListener('click', async () => {
    const selectedOption = weekSelect.selectedOptions[0];
    const items = Array.from(itemsBody.querySelectorAll('tr'))
        .map((row) => {
            const input = row.querySelector('.fr-qty-input');
            return {
                bidItemId: parseInt(input.dataset.bidItemId),
                qtyThisWeek: parseFloat(input.value) || 0,
            };
        })
        .filter((item) => item.qtyThisWeek > 0);

    if (items.length === 0) {
        alert('Enter a quantity for at least one item before submitting.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const res = await fetch(`/api/field-reports/${token}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weekStart: selectedOption.value,
                weekEnd: selectedOption.dataset.weekEnd,
                foremanName: foremanName.value,
                crewNotes: crewNotes.value,
                items,
            }),
        });

        if (!res.ok) throw new Error('Failed to submit report');

        formState.hidden = true;
        confirmState.hidden = false;
    } catch (err) {
        console.log(err.message);
        alert('Failed to submit report. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit report';
    }
});

loadReport();
