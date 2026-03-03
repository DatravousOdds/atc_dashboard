// ============================================
// SHARED APPLICATION STATE
// ============================================
// All DOM elements and shared variables accessible across modules

const appState = {
    // ===== FILTER DROPDOWNS =====
    contractDropdown: document.getElementById('contracts'),
    monthDropdown: document.getElementById('month'),
    dateRangeDropdown: document.getElementById('date-range'),
    
    // ===== SEARCH ELEMENTS =====
    searchInput: document.getElementById('search-bid-item'),
    searchResultsDropdown: document.querySelector('.searchDropdown'),
    searchResults: document.querySelector('.searchResults'),
    
    // ===== KPI/DISPLAY ELEMENTS =====
    activeContracts: document.getElementById('price-bid-growth'),
    averageContractValue: document.getElementById('average-contract-value'),
    totalContractValue: document.getElementById('total-contract-value'),
    winRate: document.getElementById('total-contracts'),
    
    // ===== DATA TABLES =====
    bidItemsTable: null,
    profitabilityTable: null,
    vendorPerformanceTable: null,
    winLossByContractorTable: null
};

// Make globally available to all scripts
window.appState = appState;

console.log('✅ App state initialized');