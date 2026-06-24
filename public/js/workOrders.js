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




const createWorkOrderBtn = document.getElementById('createWorkOrderBtn');
const cancelWorkOrderBtn = document.getElementById('cancelWorkOrderBtn');
const draftWorkOrderBtn = document.getElementById('draftWorkOrderBtn');
const workOrderForm = document.getElementById('workOrderForm');

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

projectSelectContainer.addEventListener("click", (e) => {
   workOrderProjectDropdown.classList.toggle("active");
});

fileUpload.addEventListener('click', () => {
    realFileUpload.click();
})

realFileUpload.addEventListener('change', (e) => {
    console.log(e.target.files);
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

function addAdditionalRow() {
    const lineItemTable = document.querySelector('#lineItemsTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <input type="text" name="item" class="line-item-input">
        </td>
        <td>
            <input type="text" name="description" class="line-item-input">
        </td>
        <td>
            <select name="unit" class="line-item-select" id="unitSelect">
                <option value="ea">EA</option>
                <option value="lf">LF</option>
                <option value="sy">SY</option>
                <option value="sf">SF</option>
                <option value="ton">TON</option>
                <option value="cy">CY</option>
                <option value="ls">LS</option>
                <option value="mo">MO</option>
                <option value="wk">WK</option>
            </select>
        </td>
        <td>
            <input type="number" name="quantity" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="number" name="mon" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="number" name="tue" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="number" name="wed" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="number" name="thu" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="number" name="fri" placeholder="0" class="line-item-input">
        </td>
        <td>
            <input type="text" name="material" placeholder="Material..." class="line-item-input">
        </td>
        <td>
            <select name="equipment" class="line-item-select">
                <option value="none">None</option>
                <option value="excavator">Excavator</option>
                <option value="bulldozer">Bulldozer</option>
            </select>
        </td>
    `;
    lineItemTable.appendChild(tr);
}

function init() {
    setDefaultProject(contracts);
    setActiveContractsCount(contracts);
    displayContracts(contracts);
    displayWorkOrdersKPIs(KPIs); 
}






