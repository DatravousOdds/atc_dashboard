

const percentBarRender = (data, type = "default") => {
    const pct = parseFloat(data) || 0;
    let color;
    if (type === "workOrder") {
        if (pct > 0) color = '#E57373'
        if (pct > 50 && pct <= 75) color = '#F5B14A';
        if (pct >= 80) color = '#4DC9B0';
    } else {
        color = '#4DC9B0'
        if (pct > 75) color = '#E57373';
        if (pct > 90) color = '#EF5350';
    }

  return `
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="flex:1;background:#1f3b5a;border-radius:99px;height:8px;overflow:hidden;min-width:80px;">
        <div style="width:${Math.min(pct,100)}%;background:${color};height:100%;border-radius:99px;"></div>
      </div>
      <span style="font-size:12px;min-width:36px;text-align:right;color:${color};font-weight:500">${pct.toFixed(0)}%</span>
    </div>`;
};


const currencyFormatRender = data => {
    const c = parseFloat(data) || 0;
    return `$${c.toLocaleString('en-US', { minimumFractionDigits: 2 })} `;
};





const bidItemsTable = $('#bid-items-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/contracts/bidItems',
        type: 'GET',
        data: function(d) {
            // Add filter parameters from dropdowns
            const { dataRangeDropdown, monthDropdown, contractDropdown } = appState;
            const selectedDateRange = dataRangeDropdown ? dataRangeDropdown.value : 'all';
            const selectedMonth = monthDropdown ? monthDropdown.value : 'all';
            const selectedContract = contractDropdown ? contractDropdown.value : 'all';

            if (selectedDateRange && selectedDateRange !== 'all') {
                d.dateRange = selectedDateRange;
            }
            if (selectedMonth && selectedMonth !== 'all') {
                d.month = selectedMonth;
            }
            if (selectedContract && selectedContract !== 'all') {
                d.contractId = selectedContract;
            }
            // console.log('Sending to API:', d);
            return d;
        },
        dataSrc: function(json) {
            // console.log('API Response:', json);
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        },
        error: function(xhr, error, thrown) {
            console.error('Error loading bid items:', error);
        }
    },
    columns: [
        { 
            data: 'project', 
            title: 'Project',
            defaultContent: '-'
        },
        { 
            data: 'uom', 
            title: 'UOM',
            defaultContent: '-'
        },
        { 
            data: 'desc', 
            title: 'Desc',
            defaultContent: '-'
        },
        { 
            data: 'txdot_price', 
            title: 'TxDOT Price',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },
        { 
            data: 'quantity', 
            title: 'Quantity',
            defaultContent: '0'
        },
        { 
            data: 'competitor_price', 
            title: 'Competitor Price',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },
        { 
            data: 'our_price', 
            title: 'Our Price',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },    
        { 
            data: 'max_price', 
            title: 'Max Price',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },
        { 
            data: 'total', 
            title: 'Total',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        }
    ]
});

appState.bidItemsTable = bidItemsTable;

const profitabilityTable = $('#profitability-table').DataTable({
        processing: true,
        serverSide: false,
        pageLength: 10,
        deferRender: true,
        ajax: {
            url: '/api/contracts/winLoss',
            type: 'GET',
            dataSrc: function(json) {
                console.log('API Response contracts:', json);

                if(Array.isArray(json)) {
                    return json;
                }
                return json.data || [];
            }
        },
        columns: [
            { data: 'project', title: 'Project', defaultContent: '-' },
            { data: 'total_hours', title: 'Total Hours', defaultContent: '0', render: function(data) {
                if (!data) return '0';
                console.log("Total Hours: ", data)
                const totalWeeks = data / 60; // Hours per week
                const months = totalWeeks / 4.33 // Average week in a month
                return `${data} hrs (${Math.ceil(months)} months)`;
            } },
            { data: 'total_labor_cost', title: 'Labor Cost', defaultContent: '$0.00', render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            } },
            { data: 'revenue', title: 'Revenue', defaultContent: '$0.00', render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            } },
            { data: 'profit', title: 'Profit', defaultContent: '$0.00', render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            } },
            { 
                data: 'profit_margin_percent', 
                title: 'Profit Margin %', 
                defaultContent: '0%',
                render: (data, type) => {
                    if (!data) return '0%';
                    if (type === 'display') {
                        return `${data}%`;
                    }
                    return data;
                },
                createdCell: (td, cellData) => {
                    if (cellData > 0) {
                        console.log('Profit Margin Cell:',td, cellData);
                        $(td).addClass('is-positive');
                       
                    } else if (cellData < 0) {
                        $(td).addClass('is-negative');
                    }
                }
            }
        ]
});

appState.profitabilityTable = profitabilityTable;

const vendorPerformanceTable = $('#vendor-performance-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/contracts/vendor/performance',
        type: 'GET', 
        dataSrc: function(json) {
            // console.log("API Response vendors:", json)
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        }
    },
    columns : [
        { data: 'vendor_name', title: 'Vendor', defaultContent: '-'},
        { data: 'description', title: 'Item', defaultContent: '-' },
        { data: 'previous_price', title: 'Previous Price', defaultContent: '0', render: function(data) {
            if (!data) return '$0.00';
            return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
        }},
        { data: 'current_price', title: 'Current Price', defaultContent: '0', render: function(data) {
            if (!data) return '$0.00';
            return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
        }},
        { data: 'change_percent', title: 'Change %', defaultContent: '0%', render: function(data) {
            if (!data) return '0%';
            return parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '%';
        }}
    ]
})

appState.vendorPerformanceTable = vendorPerformanceTable;

const itemProfitabilityTable =  $('#item-profit-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/contracts/item-profit',
        type: 'GET',
        dataSrc: function(json) {
            console.log("API Response item profit:", json)
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        },
        data: function(data) {
            const { contractDropdown } = appState;
            const selectedContract = contractDropdown ? contractDropdown.value : 'all';
            if (selectedContract && selectedContract !== 'all') {
                data.contractId = selectedContract;
            }
            console.log('Sending to API for item profit:', data);
            return data;
        },
        

    },
    columns: [
            { data: 'item', title: 'Item', defaultContent: '_'},
            { data: 'time', title: 'Time', defaultContent: '_'},
            { data: 'cost', title: 'Cost', defaultContent: '0.00'},
            { data: 'project', title: 'Project', defaultContent: '_'},
            { data: 'qty', title: 'Qty', defaultContent: '0.00'},
        ]
});

appState.itemProfitabilityTable = itemProfitabilityTable;

const projectStatusTable = $('#projects-status-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/projects/status',
        type: 'GET',
        dataSrc: function(json) {
            console.log("API Response project status:", json)
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        }
    },
    columns: [
        { data: 'project', title: 'Project', defaultContent: '-' },
        { data: 'revenue', title: 'Revenue', defaultContent: '$0', render: currencyFormatRender },
        { data: 'expense', title: 'Expense', defaultContent: '$0', render: currencyFormatRender },
        { data: 'net_profit', title: 'Net Profit', defaultContent: '$0', render: currencyFormatRender },
        { data: 'progress_percent', title: 'Progress', defaultContent: '0', render: percentBarRender },
        { data: 'status', title: 'Status', defaultContent: '-' }
    ]
});

appState.projectStatusTable = projectStatusTable;

const projectBudgetUtilizationTable = $('#project-budget-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/projects/budget/utilization',
        type: 'GET',
        dataSrc: function(json) {
            console.log("API Response project budget utilization:", json)
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        }
    },
    columns: [
        { data: 'project', title: 'Project', defaultContent: '-' },
        { data: 'budget', title: 'Budget', defaultContent: '$0', render: currencyFormatRender },
        { data: 'actual_spend', title: 'Actual Spend', defaultContent: '$0', render: currencyFormatRender },
        { data: 'utilization', title: 'Utilization %', defaultContent: '0', render: percentBarRender }
    ]
});

appState.projectBudgetUtilizationTable = projectBudgetUtilizationTable;


const AVATAR_COLORS = ['#4DC9B0', '#F5B14A', '#7C93C9', '#E57373', '#9575CD', '#4FC3F7', '#81C784', '#F06292'];

function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

let workOrdersStatusFilter = 'all';

const workOrdersTable = $('#workOrders-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 7,
    paging: false,
    ajax: function(data, callback, settings) {
        const { contractId } = appState;

        const id = contractId || 'all';

        $.getJSON(`/api/contracts/work-orders/${id}`, function(json) {
        const result = Array.isArray(json) ? json : (json.data || []);
        console.log("Results returned from work orders:", result)
        callback({ data: result });
        });
    },

    type: 'GET',
    columns: [
        {data: 'work_order_id', title: 'WO #', defaultContent: '-'},
        {data: 'title', title: 'TITLE', defaultContent: '-'},
        {data: 'assignee_name', title: 'ASSIGNEE',
            render: function(data) {
                if (!data) return '-';
                const initials = getInitials(data);
                const color = getAvatarColor(data);
                return `<span class="assignee" style="background-color: ${color};" title="${data}">${initials}</span>`
            },
        defaultContent: '-'},
        {data: 'status', title: 'STATUS',
            render: function(data) {
                if(!data) return '-';

                const statusMap = {
                    'completed': 'completed',
                    'pending': 'pending',
                    'behind': 'behind',
                    'in progress': 'progress'
                };

                const status = statusMap[data] || '';
                return `<span class='cap ${status}'>${data}</span>`;

            } , defaultContent: '-'},
        {data: 'total_items', title: 'ITEMS', defaultContent: '-'},
        {data: 'progress',
            render: (data) => percentBarRender(data, 'workOrder'),
            title: 'PROGRESS', defaultContent: '-'},
        {data: 'due_date',
            render: function(data, type, row) {
                const date = new Date(data);
                const formatted = Intl.DateTimeFormat("en-US", {month: 'long', day: 'numeric'}).format(date);
                const isOverdue = row.status === 'behind' || (row.status !== 'completed' && date < new Date());
                return isOverdue ? `<span class="due-overdue">${formatted}</span>` : formatted;
            }, title: 'DUE', defaultContent: '-'},
        {data: 'value',
            render: function(data) {
                if (data === null || data === undefined) return '-';
                return "$" + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            },

            title: 'VALUE', defaultContent: '-'},
    ],
    layout: {
        topStart: function() {
            const wrapper = document.createElement('div');
            wrapper.className = 'wo-table-title-group';

            const title = document.createElement('h2');
            title.innerText = 'Work Orders';

            const badge = document.createElement('span');
            badge.className = 'wo-count-badge';
            badge.id = 'wo-count-badge';
            badge.innerText = '0 in this project';

            wrapper.append(title, badge);
            return wrapper;
        },
        topEnd: function() {
            const wrapper = document.createElement('div');
            wrapper.className = 'wo-table-toolbar';

            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'wo-search-wrapper';

            const searchIcon = document.createElement('i');
            searchIcon.className = 'fa-solid fa-magnifying-glass';

            const searchInputEl = document.createElement('input');
            searchInputEl.type = 'search';
            searchInputEl.placeholder = 'Search WO #, item, assignee...';
            searchInputEl.addEventListener('input', () => {
                workOrdersTable.search(searchInputEl.value).draw();
            });

            searchWrapper.append(searchIcon, searchInputEl);

            const pillsWrapper = document.createElement('div');
            pillsWrapper.className = 'wo-status-pills';

            const pillDefs = [
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Behind', value: 'behind' },
                { label: 'Done', value: 'done' },
            ];

            pillDefs.forEach(def => {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className = 'wo-status-pill' + (def.value === 'all' ? ' active' : '');
                pill.innerText = def.label;
                pill.addEventListener('click', () => {
                    pillsWrapper.querySelectorAll('.wo-status-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    workOrdersStatusFilter = def.value;
                    workOrdersTable.draw();
                });
                pillsWrapper.append(pill);
            });

            const filtersBtn = document.createElement('button');
            filtersBtn.type = 'button';
            filtersBtn.innerText = 'Filters';
            filtersBtn.className = 'btn filter-btn';

            wrapper.append(searchWrapper, pillsWrapper, filtersBtn);
            return wrapper;
        }
    }
});

$.fn.dataTable.ext.search.push(function(settings, searchData, dataIndex) {
    if (settings.nTable.id !== 'workOrders-table') return true;
    if (workOrdersStatusFilter === 'all') return true;

    const row = workOrdersTable.row(dataIndex).data();
    if (!row) return true;

    if (workOrdersStatusFilter === 'active') {
        return row.status === 'in progress' || row.status === 'pending';
    }
    if (workOrdersStatusFilter === 'behind') {
        return row.status === 'behind';
    }
    if (workOrdersStatusFilter === 'done') {
        return row.status === 'completed';
    }
    return true;
});

function selectWorkOrderRow(tr) {
    $('#workOrders-table tbody tr').removeClass('row-selected');
    $(tr).addClass('row-selected');

    const rowData = workOrdersTable.row(tr).data();
    if (!rowData) return;

    appState.selectedWorkOrderId = rowData.id;
    appState.selectedWorkOrderData = rowData;

    const bannerLabel = document.getElementById('lineItemsBannerLabel');
    if (bannerLabel) {
        bannerLabel.innerText = `${rowData.work_order_id} — ${rowData.title}`;
    }

    if (appState.lineItemsTable) {
        appState.lineItemsTable.ajax.reload();
    }
}

workOrdersTable.on('draw', function() {
    const badge = document.getElementById('wo-count-badge');
    if (badge) {
        const count = workOrdersTable.rows({ search: 'applied' }).count();
        badge.innerText = `${count} in this project`;
    }

    if (appState.selectedWorkOrderId === undefined) {
        const firstRow = workOrdersTable.row(':eq(0)', { page: 'current' }).node();
        if (firstRow) selectWorkOrderRow(firstRow);
    }
});

$('#workOrders-table tbody').on('click', 'tr', function() {
    selectWorkOrderRow(this);
});

appState.workOrdersTable = workOrdersTable;

let lineItemsStatusFilter = 'all';

const lineItemsTable = $('#lineItems-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 8,
    ajax: function(data, callback, settings) {
        const workOrderId = appState.selectedWorkOrderId;

        if (!workOrderId) {
            callback({ data: [] });
            return;
        }

        $.getJSON(`/api/contracts/work-orders/line-items/export?workOrderIds=${workOrderId}`, function(json) {
            const results = Array.isArray(json) ? json : (json.data || []);
            callback({ data: results })
        });
    },
    type: 'GET',
    columns: [
        {data: 'bid_item_no', title: 'ITEM', defaultContent: '-'},
        {data: 'description', title: 'DESCRIPTION', defaultContent: '-'},
        {data: 'unit_of_measure', title: 'UNIT', defaultContent: '-'},
        {data: 'quantity', title: 'QTY', defaultContent: '-', render:function(data) {
            if (data === null || data === undefined) return;
            const qty = parseInt(data);
            return `<span>${qty}</span>`
            
        }},
        {data: 'qty_completed', title: 'QTY COMPLETED', defaultContent: '-',
            render: function(data) {
                if (data === null || data === undefined) return '-';
                const value = parseFloat(data);
                const cls = value > 0 ? 'qty-completed-positive' : 'qty-completed-zero';
                return `<span class="${cls}">${value}</span>`
            }},
        {data: 'remaining_qty', title: 'REMAINING QTY', defaultContent: '-'},
        {data: 'progress', render: percentBarRender, title: 'PROGRESS', defaultContent: '-'}
    ],
    layout: {
        topStart: function() {
            const wrapper = document.createElement('div');
            wrapper.className = 'wo-table-title-group';

            const title = document.createElement('h2');
            title.innerText = 'Line Items';

            const badge = document.createElement('span');
            badge.className = 'wo-count-badge';
            badge.id = 'line-items-count-badge';
            badge.innerText = '0 items';

            wrapper.append(title, badge);
            return wrapper;
        },
        topEnd: function() {
            const wrapper = document.createElement('div');
            wrapper.className = 'wo-table-toolbar';

            const pillsWrapper = document.createElement('div');
            pillsWrapper.className = 'wo-status-pills';

            const pillDefs = [
                { label: 'All', value: 'all' },
                { label: 'Outstanding', value: 'outstanding' },
                { label: 'Closed', value: 'closed' },
            ];

            pillDefs.forEach(def => {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className = 'wo-status-pill' + (def.value === 'all' ? ' active' : '');
                pill.innerText = def.label;
                pill.addEventListener('click', () => {
                    pillsWrapper.querySelectorAll('.wo-status-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    lineItemsStatusFilter = def.value;
                    lineItemsTable.draw();
                });
                pillsWrapper.append(pill);
            });

            const addLineBtn = document.createElement('button');
            addLineBtn.type = 'button';
            addLineBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add line';
            addLineBtn.className = 'wo-secondary-btn';

            const groupBtn = document.createElement('button');
            groupBtn.type = 'button';
            groupBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Group';
            groupBtn.className = 'btn filter-btn';

            wrapper.append(pillsWrapper, addLineBtn, groupBtn);
            return wrapper;
        }
    }

})

$.fn.dataTable.ext.search.push(function(settings, searchData, dataIndex) {
    if (settings.nTable.id !== 'lineItems-table') return true;
    if (lineItemsStatusFilter === 'all') return true;

    const row = lineItemsTable.row(dataIndex).data();
    if (!row) return true;

    const remaining = parseFloat(row.remaining_qty);
    const isOutstanding = !Number.isNaN(remaining) && remaining > 0;

    if (lineItemsStatusFilter === 'outstanding') return isOutstanding;
    if (lineItemsStatusFilter === 'closed') return !isOutstanding;
    return true;
});

lineItemsTable.on('draw', function() {
    const badge = document.getElementById('line-items-count-badge');
    if (badge) {
        const count = lineItemsTable.rows({ search: 'applied' }).count();
        const woId = appState.selectedWorkOrderData?.work_order_id;
        badge.innerText = woId
            ? `${count} item${count === 1 ? '' : 's'} · ${woId}`
            : `${count} item${count === 1 ? '' : 's'}`;
    }
});

appState.lineItemsTable = lineItemsTable;