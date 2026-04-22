const percentBarRender = data => {
  const pct = parseFloat(data) || 0;
  let color = '#639922';
  if (pct > 75) color = '#BA7517';
  if (pct > 90) color = '#E24B4A';
  return `
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="flex:1;background:#e9ecef;border-radius:99px;height:8px;overflow:hidden;min-width:80px;">
        <div style="width:${Math.min(pct,100)}%;background:${color};height:100%;border-radius:99px;"></div>
      </div>
      <span style="font-size:12px;min-width:36px;text-align:right;color:${color};font-weight:500">${pct.toFixed(1)}%</span>
    </div>`;
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
                // console.log('API Response contracts:', json);

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
                const days = data / 24; // Convert hours to days
                const months = days / 25 // Convert days to months (assuming 25 working days per month)
                return `${data} hrs (${months.toFixed(1)} months)`;
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
        { data: 'revenue', title: 'Revenue', defaultContent: '$0' },
        { data: 'expense', title: 'Expense', defaultContent: '$0' },
        { data: 'net_profit', title: 'Net Profit', defaultContent: '$0' },
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
        { data: 'budget', title: 'Budget', defaultContent: '$0' },
        { data: 'actual_spend', title: 'Actual Spend', defaultContent: '$0' },
        { data: 'utilization', title: 'Utilization %', defaultContent: '0', render: percentBarRender }
    ]
});