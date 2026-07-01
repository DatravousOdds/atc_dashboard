const workOrderDropdown = document.getElementById("wo-project-dropdown");
const searchBtn = document.getElementById("searchBtn");
const workOrderProjectDropdown = document.querySelector(".wo-project-dropdown");
const searchInput = document.getElementById("searchInput");
const projectSearch = document.querySelector(".project-search");
const projectSelectContainer = document.querySelector(".project-select-wrapper");
const projectNameDisplay = document.querySelector(".project-name");
const activeCount = document.getElementById("active-count");
const activeProjects = document.querySelectorAll(".wo-project-dropdown li");
const projectSearchDropdown = document.getElementById("projectSearchDropdown");
const newWorkOrderBtn = document.getElementById('newWorkOrderBtn');
const modal = document.querySelector('.modal-overlay');
const closeWorkOrderModal = document.getElementById('closeWorkOrderModal');
const addLineItem = document.getElementById('addLineItem');
const contracts = await getContracts();
const KPIs = await getWorkOrdersKPIs(contracts[0].id);
const fileUpload = document.getElementById('fileUpload');
const realFileUpload = document.querySelector('.file-upload');
const workOrderLocationInput = document.getElementById('workOrderLocation');
const workOrderLocationResults = document.getElementById('workOrderLocationResults');
const workOrderContractId = document.getElementById('workOrderContractId');
const workOrderCustomerInput = document.getElementById('workOrderCustomer');
const workOrderCustomerResults = document.getElementById('workOrderCustomerResults');
const workOrderClientId = document.getElementById('workOrderClientId');





const createWorkOrderBtn = document.getElementById('createWorkOrderBtn');
const cancelWorkOrderBtn = document.getElementById('cancelWorkOrderBtn');
const draftWorkOrderBtn = document.getElementById('draftWorkOrderBtn');
const workOrderForm = document.getElementById('workOrderForm');
const importBtn = document.getElementById('importBtn');

init();


newWorkOrderBtn.addEventListener('click', () => {
    modal.classList.add('active');
});

closeWorkOrderModal.addEventListener('click', () => {
    modal.classList.remove('active');
})

addLineItem.addEventListener('click', () => {
    console.log('Adding new line item row...');
    addAdditionalRow();
})

workOrderLocationInput.addEventListener('input', () => {
    const query = workOrderLocationInput.value.trim().toLowerCase();

    workOrderContractId.value = '';

    if (!query) {
        workOrderLocationResults.classList.remove('active');
        workOrderLocationResults.innerHTML = '';
        return;
    }

    const matches = contracts
        .filter(contract => contract.contract_name && contract.contract_name.toLowerCase().includes(query))
        .slice(0, 8);

    renderLocationResults(matches);
})

workOrderLocationInput.addEventListener('focus', () => {
    if (workOrderLocationInput.value.trim() && workOrderLocationResults.children.length) {
        workOrderLocationResults.classList.add('active');
    }
})

workOrderLocationResults.addEventListener('click', (e) => {
    const match = e.target.closest('li[data-id]');
    if (!match) return;

    workOrderLocationInput.value = match.textContent;
    workOrderContractId.value = match.dataset.id;
    workOrderLocationResults.classList.remove('active');
})

let customerSearchTimeout;

workOrderCustomerInput.addEventListener('input', () => {
    const query = workOrderCustomerInput.value.trim();

    workOrderClientId.value = '';
    clearTimeout(customerSearchTimeout);

    if (!query) {
        workOrderCustomerResults.classList.remove('active');
        workOrderCustomerResults.innerHTML = '';
        return;
    }

    customerSearchTimeout = setTimeout(async () => {
        const clients = await searchClients(query);
        renderCustomerResults(clients);
    }, 250);
})

workOrderCustomerInput.addEventListener('focus', () => {
    if (workOrderCustomerInput.value.trim() && workOrderCustomerResults.children.length) {
        workOrderCustomerResults.classList.add('active');
    }
})

workOrderCustomerResults.addEventListener('click', (e) => {
    const match = e.target.closest('li[data-id]');
    if (!match) return;

    workOrderCustomerInput.value = match.dataset.name;
    workOrderClientId.value = match.dataset.id;
    workOrderCustomerResults.classList.remove('active');
})

projectSelectContainer.addEventListener("click", (e) => {
   workOrderProjectDropdown.classList.toggle("active");
});

fileUpload.addEventListener('click', () => {
    realFileUpload.click();
})

let f;

const IMPORT_HEADER_ROW_INDEX = 3;

// Columns the line items table accepts. Spreadsheet headers are matched against
// these aliases (case-insensitive) regardless of their order/position in the file.
const LINE_ITEM_COLUMNS = [
    { field: 'item', aliases: ['item'] },
    { field: 'description', aliases: ['description'] },
    { field: 'unit', aliases: ['unit'] },
    { field: 'quantity', aliases: ['qty', 'quantity'] },
    { field: 'mon', aliases: ['mon', 'monday'] },
    { field: 'tue', aliases: ['tue', 'tuesday'] },
    { field: 'wed', aliases: ['wed', 'wednesday'] },
    { field: 'thu', aliases: ['thu', 'thru', 'thursday'] },
    { field: 'fri', aliases: ['fri', 'friday'] },
    { field: 'material', aliases: ['material'] },
    { field: 'equipment', aliases: ['equipment'] },
];

// Columns that appear in imported work order spreadsheets but have no matching
// column in the line items table - skip them instead of treating them as unknown.
const IMPORT_SKIPPED_COLUMNS = ['labor', 'unit price', 'extension'];

const UNIT_SELECT_OPTIONS = [
    { value: 'ea', label: 'EA' },
    { value: 'lf', label: 'LF' },
    { value: 'sy', label: 'SY' },
    { value: 'sf', label: 'SF' },
    { value: 'ton', label: 'TON' },
    { value: 'cy', label: 'CY' },
    { value: 'ls', label: 'LS' },
    { value: 'mo', label: 'MO' },
    { value: 'wk', label: 'WK' },
];

const EQUIPMENT_SELECT_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'excavator', label: 'Excavator' },
    { value: 'bulldozer', label: 'Bulldozer' },
];

realFileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('spreadsheetml.sheet');

    if (!isExcelFile) {
        showImportMessage('Invalid format, only .xlsx files are accepted.', true);
        realFileUpload.value = '';
        f = undefined;
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showImportMessage('File is too large. Max size is 50MB.', true);
        realFileUpload.value = '';
        f = undefined;
        return;
    }

    f = file;
    document.querySelector('.selected-file-name').textContent = file.name;
    showImportMessage('', false);
})

importBtn.addEventListener('click', () => {
    if (!f) {
        showImportMessage('Please select a file to import.', true);
        return;
    }

    importBtn.style.display = 'none';
    const spinner = document.querySelector('.spinner');
    spinner.style.display = 'flex';

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workBook = XLSX.read(data, { type: 'array' });
            const sheetName = workBook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName], { header: 1 });

            if (sheetData.length <= IMPORT_HEADER_ROW_INDEX) {
                throw new Error('Spreadsheet is missing a header row.');
            }

            const columnMap = mapImportHeaders(sheetData[IMPORT_HEADER_ROW_INDEX]);
            const missingColumns = getMissingColumns(columnMap);

            if (missingColumns.length > 0) {
                throw new Error(`Spreadsheet is missing required column(s): ${missingColumns.join(', ')}`);
            }

            const lineItems = extractLineItems(sheetData, IMPORT_HEADER_ROW_INDEX, columnMap);

            if (lineItems.length === 0) {
                throw new Error('No line items were found in the spreadsheet.');
            }

            populateLineItemsTable(lineItems);
            showImportMessage(`Imported ${lineItems.length} line item${lineItems.length === 1 ? '' : 's'} from ${f.name}.`, false);
        } catch (err) {
            console.log(err.message);
            showImportMessage(err.message, true);
        } finally {
            resetImportControls();
        }
    };

    reader.onerror = () => {
        showImportMessage('Failed to read the file.', true);
        resetImportControls();
    };

    reader.readAsArrayBuffer(f);
})

const allProjects = document.querySelectorAll(".wo-project-dropdown li");

allProjects.forEach(project => {
    project.addEventListener("click", async (e) => {
        e.stopPropagation();

        const selectedProject = project.innerText;
        projectNameDisplay.innerText = selectedProject;

        workOrderProjectDropdown.classList.remove("active");

        const contract_id = parseInt(project.dataset.id);
        const kpiData = await getWorkOrdersKPIs(contract_id);
        displayWorkOrdersKPIs(kpiData);

        appState.contractId = contract_id;
        appState.workOrdersTable.ajax.reload();
            
    })
})

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!target.closest(".wo-project-dropdown") && !target.closest(".project-select-wrapper")) {
        workOrderProjectDropdown.classList.remove("active");
    }

    if (!projectSearch.contains(event.target)) {
        searchInput.classList.remove("active");
        projectSearch.classList.remove("active");
    }

    if (!projectSearchDropdown.contains(event.target) && !projectSearch.contains(event.target)) {
        projectSearchDropdown.classList.remove("active");
    };

    if (!workOrderLocationInput.contains(event.target) && !workOrderLocationResults.contains(event.target)) {
        workOrderLocationResults.classList.remove("active");
    }

    if (!workOrderCustomerInput.contains(event.target) && !workOrderCustomerResults.contains(event.target)) {
        workOrderCustomerResults.classList.remove("active");
    }
});

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    console.log("Search query:", query);

    if (query) {
        projectSearchDropdown.classList.add("active");
    };
    
});

searchBtn.addEventListener("click", () => {
    searchInput.classList.toggle("active");
    projectSearch.classList.toggle("active");
    searchInput.focus();
});

workOrderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const formProps = Object.fromEntries(formData);
    console.log("data collected:", formProps);

    const remainingProps = {
        startDate:  document.getElementById('scheduleStartValue').textContent,
        endDate: document.getElementById('scheduleEndValue').textContent,
        rows: Array.from(document.querySelectorAll('#lineItemsTable tbody tr'))
    }

    handleDataExtraction(remainingProps.rows);

    console.log("Here are the remaining props:", remainingProps);

    const finalPayload = { ...formProps, ...remainingProps};
    console.log("Final payload", finalPayload);


});




/* ===== ASYNC FUNCTION ====== */

async function getWorkOrdersKPIs(id) {

    if (!id) return null;

    try {
        const res = await fetch(`/api/contracts/work-orders/${id}/kpis`);

        if (!res.ok) {
            throw new Error(`HTTP status error: ${res.status}`)
        }

        const data = await res.json();
        console.log("KPI data: ", data);
        return data;

    } catch (err) {
        throw new Error(`Failed fetching from server ${err.message}`)
    }
};

async function getContracts() {
    try {
        const response = await fetch('/api/contracts')

        if (!response.ok) {
            throw new Error(`HTTPS status error: ${response.status}`);
        }

        const results = await response.json();
        console.log("contract data:",results)
        return results;
    } catch (err) {
        throw new Error(`Error fetching contracts... ${err.message}`)
    }
};

async function searchClients(query) {
    try {
        const res = await fetch(`/api/clients/search?query=${encodeURIComponent(query)}`);

        if (!res.ok) {
            throw new Error(`HTTP status error: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.log(err.message);
        return [];
    }
};

/* === HELPER FUNCTIONS === */

function setActiveContractsCount(data) {
    
    activeCount.textContent = `${data.length} active projects`;
};

function setDefaultProject(data) {
    projectNameDisplay.innerText = data[0].contract_name; 
}

function displayContracts(data) {
    data.forEach(contract => {
    const li = document.createElement('li');
    li.dataset.id = contract.id;
    li.innerText = contract.contract_name;
    workOrderDropdown.append(li)
})
}

function renderLocationResults(matches) {
    workOrderLocationResults.innerHTML = '';

    if (matches.length === 0) {
        const li = document.createElement('li');
        li.className = 'no-results';
        li.textContent = 'No matching projects';
        workOrderLocationResults.appendChild(li);
        workOrderLocationResults.classList.add('active');
        return;
    }

    matches.forEach(contract => {
        const li = document.createElement('li');
        li.textContent = contract.contract_name;
        li.dataset.id = contract.id;
        workOrderLocationResults.appendChild(li);
    });

    workOrderLocationResults.classList.add('active');
}

function renderCustomerResults(clients) {
    workOrderCustomerResults.innerHTML = '';

    if (clients.length === 0) {
        const li = document.createElement('li');
        li.className = 'no-results';
        li.textContent = 'No matching customers';
        workOrderCustomerResults.appendChild(li);
        workOrderCustomerResults.classList.add('active');
        return;
    }

    clients.forEach(client => {
        const li = document.createElement('li');
        li.textContent = client.city ? `${client.name} — ${client.city}` : client.name;
        li.dataset.id = client.id;
        li.dataset.name = client.name;
        workOrderCustomerResults.appendChild(li);
    });

    workOrderCustomerResults.classList.add('active');
}

function displayWorkOrdersKPIs(data) {
    const 
    {   totalAssignedWorkOrders,workOrdersCompletedPercent,
        totalAssignedInProgress, workOrderCompletedTrend,
        totalWorkOrdersCompleted,totalAssignedTrend,
        averageCycleTime,averageCycleTrend,
        totalWorkOrdersAssigned
    } = appState;

    const root = document.documentElement;
    root.style.setProperty('--total-completed-work_orders-percent', `${Math.floor(parseInt(data.completion_percent))}%`);
    root.style.setProperty('--total-assigned-work-orders-percent', `${Math.floor(parseInt(data.completion_percent))}%`);
    root.style.setProperty('--total-avg-cycle-time-percent', `${Math.floor(parseInt(data.completion_percent))}%`);
    
    totalWorkOrdersCompleted.innerText = data.total_completed;
    totalWorkOrdersAssigned.innerText = data.total_work_orders;
    workOrdersCompletedPercent.innerHTML = `<p>${data.completion_percent || 0 }% completed</p>`;
    workOrderCompletedTrend.innerHTML = `
    <i class"fa-solid fa-caret-${parseFloat(data.wow_completed_percent) > 0 ? "down" : "up"}></i>
    <p>${data.wow_completed_percent}% vs last week</p>
    `;

    totalAssignedWorkOrders.innerText = data.total_assigned;
    totalAssignedInProgress.innerHTML = `<p>${data.total_in_progress} in progress</p>`;
    totalAssignedTrend.innerHTML = 
    `<i class"fa-solid fa-caret-${parseInt(data.wow_assigned_count) > 0 ? "down" : "up"}></i>
    <p class="kpi-trend-value">${data.wow_assigned_count} this week</p>`
    

    averageCycleTime.innerHTML = `
        <span class="assigned-completed">${data.avg_cycle_time}</span>
        <span>days</span>
    `;    
}

function handleDataExtraction(rows) {
    rows.map(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {};
        cells.forEach(cell => {
            
            const attribute = cell.querySelector('input, select');

            const key = attribute.name;
            const value = attribute.value;

            rowData[key] = value;
            

        })

        console.log("data map:", rowData);
    })
}

function addAdditionalRow(data = {}) {
    const lineItemTable = document.querySelector('#lineItemsTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <input type="text" name="item" class="line-item-input" value="${escapeHtml(data.item)}">
        </td>
        <td>
            <input type="text" name="description" class="line-item-input" value="${escapeHtml(data.description)}">
        </td>
        <td>
            <select name="unit" class="line-item-select" id="unitSelect">
                ${buildSelectOptions(UNIT_SELECT_OPTIONS, data.unit || 'ea')}
            </select>
        </td>
        <td>
            <input type="number" name="quantity" placeholder="0" class="line-item-input" value="${escapeHtml(data.quantity)}">
        </td>
        <td>
            <input type="number" name="mon" placeholder="0" class="line-item-input" value="${escapeHtml(data.mon)}">
        </td>
        <td>
            <input type="number" name="tue" placeholder="0" class="line-item-input" value="${escapeHtml(data.tue)}">
        </td>
        <td>
            <input type="number" name="wed" placeholder="0" class="line-item-input" value="${escapeHtml(data.wed)}">
        </td>
        <td>
            <input type="number" name="thu" placeholder="0" class="line-item-input" value="${escapeHtml(data.thu)}">
        </td>
        <td>
            <input type="number" name="fri" placeholder="0" class="line-item-input" value="${escapeHtml(data.fri)}">
        </td>
        <td>
            <input type="text" name="material" placeholder="Material..." class="line-item-input" value="${escapeHtml(data.material)}">
        </td>
        <td>
            <select name="equipment" class="line-item-select">
                ${buildSelectOptions(EQUIPMENT_SELECT_OPTIONS, data.equipment || 'none')}
            </select>
        </td>
    `;
    lineItemTable.appendChild(tr);
}

/* === IMPORT HELPER FUNCTIONS === */

function mapImportHeaders(headerRow) {
    const columnMap = {};

    headerRow.forEach((rawHeader, index) => {
        const header = String(rawHeader || '').trim().toLowerCase();
        if (!header || IMPORT_SKIPPED_COLUMNS.includes(header)) return;

        const column = LINE_ITEM_COLUMNS.find(col => col.aliases.includes(header));
        if (column) columnMap[column.field] = index;
    });

    return columnMap;
}

function getMissingColumns(columnMap) {
    return LINE_ITEM_COLUMNS
        .map(col => col.field)
        .filter(field => !(field in columnMap));
}

function extractLineItems(sheetData, headerRowIndex, columnMap) {
    const items = [];

    sheetData.slice(headerRowIndex + 1).forEach(row => {
        if (!row || row.every(cell => cell === undefined || cell === '')) return;

        const item = {
            item: getCell(row, columnMap.item),
            description: getCell(row, columnMap.description),
            unit: normalizeOption(getCell(row, columnMap.unit), UNIT_SELECT_OPTIONS, 'ea'),
            quantity: getCell(row, columnMap.quantity),
            mon: getCell(row, columnMap.mon),
            tue: getCell(row, columnMap.tue),
            wed: getCell(row, columnMap.wed),
            thu: getCell(row, columnMap.thu),
            fri: getCell(row, columnMap.fri),
            material: getCell(row, columnMap.material),
            equipment: normalizeOption(getCell(row, columnMap.equipment), EQUIPMENT_SELECT_OPTIONS, 'none'),
        };

        if (item.item || item.description) items.push(item);
    });

    return items;
}

function getCell(row, index) {
    if (index === undefined) return '';
    const value = row[index];
    return value === undefined || value === null ? '' : String(value).trim();
}

function normalizeOption(value, options, fallback) {
    const normalized = String(value || '').trim().toLowerCase();
    return options.some(opt => opt.value === normalized) ? normalized : fallback;
}

function populateLineItemsTable(lineItems) {
    const tbody = document.querySelector('#lineItemsTable tbody');
    tbody.innerHTML = '';
    lineItems.forEach(item => addAdditionalRow(item));
}

function buildSelectOptions(options, selectedValue) {
    return options
        .map(opt => `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`)
        .join('');
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value === undefined || value === null ? '' : String(value);
    return div.innerHTML;
}

function showImportMessage(message, isError) {
    const statusEl = document.querySelector('.import-status');
    if (!statusEl) return;
    statusEl.style.display = "flex";
    statusEl.textContent = message;
    statusEl.classList.toggle('error', !!isError);
    statusEl.classList.toggle('success', !isError && !!message);
}

function resetImportControls() {
    importBtn.style.display = 'flex';
    document.querySelector('.spinner').style.display = 'none';
    f = undefined;
    realFileUpload.value = '';
}

function init() {
    setDefaultProject(contracts);
    setActiveContractsCount(contracts);
    displayContracts(contracts);
    displayWorkOrdersKPIs(KPIs); 
}






