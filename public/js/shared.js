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
    winLossByContractorTable: null,
    projectStatusTable: null,
    workOrdersTable: null,
    lineItemsTable: null,

    //======== WORK ORDERS ELEMENTS =====

    // TOTAL WORK ASSIGNMENTS COMPLETED
    totalWorkOrdersCompleted: document.getElementById("assigment-completed"),
    totalWorkOrdersAssigned: document.getElementById("total-assigned"),
    workOrdersCompletedPercent: document.querySelector(".kpi-assignment-complete-percent"),
    workOrderCompletedTrend: document.getElementById("kpi-trend-value"),
    // TOTAL ASSIGNED WORK ORDERS
    totalAssignedWorkOrders: document.getElementById("assigned-work-orders"),
    totalAssignedInProgress: document.getElementById("assigned-in-progress"),
    totalAssignedBehind: document.getElementById("assigned-behind"),
    totalAssignedTrend: document.getElementById("total-assigned-trend"),
    // AVG CYCLE TIME
    averageCycleTime: document.getElementById("average-cycle-time"),
    averageCycleTrend: document.getElementById("average-cycle-time-trend"),

     //======== PROJECT ELEMENTS =====
    completedProjects: document.querySelector(".completed-projects .kpi-value"),
    completedProjectsNote: document.querySelector(".completed-projects .kpi-note"),
    totalProjects: document.querySelector(".total-projects .kpi-value"),
    overdueProjects: document.querySelector("#overdueProjects .kpi-value"),
    overdueProjectsNote: document.querySelector("#overdueProjects .kpi-note")

    
};

// Make globally available to all scripts
window.appState = appState;

console.log('✅ App state initialized');