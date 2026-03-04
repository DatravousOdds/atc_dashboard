
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
            data: 'spec', 
            title: 'Spec',
            defaultContent: '-'
        },
        { 
            data: 'desc', 
            title: 'Desc',
            defaultContent: '-'
        },
        { 
            data: 'unit_price', 
            title: 'Unit Price',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
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