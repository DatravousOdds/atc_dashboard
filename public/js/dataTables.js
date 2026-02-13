
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
            console.log('Sending to API:', d);
            return d;
        },
        dataSrc: function(json) {
            console.log('API Response:', json);
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
            data: 'contract_name', 
            title: 'Contract',
            defaultContent: '-'
        },
        { 
            data: 'bid_item_no', 
            title: 'Item #',
            defaultContent: '-'
        },
        { 
            data: 'description', 
            title: 'Description',
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
            data: 'bid_value', 
            title: 'Bid Value',
            defaultContent: '$0.00',
            render: function(data) {
                if (!data) return '$0.00';
                return '$' + parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        }
    ]
});

appState.bidItemsTable = bidItemsTable;

const contractsTable = $('#contracts-table').DataTable({
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
            { data: 'company_name', title: 'Contractor', defaultContent: '-' },
            { data: 'contracts_submitted', title: 'Bids Submitted', defaultContent: '0' },
            { data: 'bids_won', title: 'Bids Won', defaultContent: '0' },
            { data: 'win_rate', title: 'Win Rate', defaultContent: '0%' }
        ]
});

appState.contractsTable = contractsTable;

const vendorPerformanceTable = $('#vendor-performance-table').DataTable({
    processing: true,
    serverSide: false,
    pageLength: 10,
    ajax: {
        url: '/api/contracts/vendor/performance',
        type: 'GET', 
        dataSrc: function(json) {
            console.log("API Response vendors:", json)
            if(Array.isArray(json)) {
                return json;
            }
            return json.data || [];
        }
    },
    columns : [
        { data: 'company_name', title: 'Vendor', defaultContent: '-'},
        { data: 'description', title: 'Item', defaultContent: '-' },
        { data: 'order_qty', title: 'Qunatity', defaultContent: '0' },
        { data: 'unit_price', title: 'Unit Price', defaultContent: '0' },
        { data: 'extended_price', title: 'Extended Price', defaultContent: '0%' }
    ]
})


appState.vendorPerformanceTable = vendorPerformanceTable;