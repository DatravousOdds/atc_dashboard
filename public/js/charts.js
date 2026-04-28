const {
        contractDropdown,
        monthDropdown,
        dateRangeDropdown,
        searchInput,
        searchResults,
        searchResultsDropdown,
    } = appState;


let chartsInitialized = false;

function initCharts() {
    if (chartsInitialized) return;
    chartsInitialized = true;
    
    initRevenueVsExpenseChart();
    initContractsPerMonth();
    initAverageContractValue();
    initMostQuotedVendors();
    initRevenueByCustomer();
    initProjectPerformance();
    
}

// ====== TO DO =================
//  UPDATE LABELS & VALUE 
//  TO SHOW YEAR & REVENUE 
// ==============================

let revenueVsExpenseChart;
function initRevenueVsExpenseChart() {
    const ctx = document.getElementById("revenueVsExpenseChart");
    // filter
    const { dateRangeDropdown, monthDropdown, contractDropdown } = appState;
    const year = dateRangeDropdown.value;
    const month = monthDropdown.value;
    const contractId = contractDropdown.value;

    console.log("Filters - Year:", year, "Month:", month, "Contract ID:", contractId);
    // fetch api
    fetch(`/api/contracts/finance/revenue-vs-expense?year=${year}&month=${month}&contractId=${contractId}`)
    .then(res => res.json())
    .then(data => {
        
        
        const revenue = data.revenue;
        const expense = data.expense;
        const monthYearLabels = ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'];
        const labels = data.labels.map(item => {
            const [dataMonth, dataYear] = item.split('/');
            return `${monthYearLabels[parseInt(dataMonth) - 1]} ${dataYear}`;
        })
        
        console.log("Labels:", labels);

        if (revenueVsExpenseChart) {
            revenueVsExpenseChart.destroy();
        }
    
        revenueVsExpenseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,// replace with month
                datasets: 
                [
                    {
                    label: 'Revenue',
                    data: revenue, // revenue per month
                    borderWidth:2,
                    borderColor: '#DC143C',
                    backgroundColor: '#DC143C',
                    pointStyle: 'circle',
                    tension: 0.1,
                    hoverBackgroundColor: '#DC143C', 
                    },
                    {
                    label: 'Expense',
                    data: expense, // expense per month
                    borderWidth:2,
                    borderColor: '#92a6bd',
                    backgroundColor: '#92a6bd',
                    borderDash: [5, 5],
                    pointStyle: 'circle',
                    tension: 0.1,
                    hoverBackgroundColor: '#92a6bd', 
                    },
            ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: {
                            color: '#7c8a99'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    y: {beginAtZero: true,
                        ticks: { 
                            callback: function(value, index, ticks) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(value)
                            },
                            color: '#55687E'},
                            
                        grid: {
                            color: '#334155'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        }
                    }
                }
                
            }
        }) 
    })
    .catch(err => {
        console.log(err)
    })



      
}


let contractsPerMonthChart = null;

function initContractsPerMonth() {
    const ctx = document.getElementById("contractsPerMonthChart");
    const labels = ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'];
    
    
    
    // define the chart with no initial data
    contractsPerMonthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Contracts Per Month',
                    data: [],
                    borderWidth:2,
                    borderRadius: 8,
                    borderColor: '#DC143C',
                    backgroundColor: '#DC143C',
                    hoverBackgroundColor: '#ee244cff',
                    
                    
                    
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: {
                            color: '#7c8a99'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    y: {
                        beginAtZero: true,

                        ticks: { 
                            
                            color: '#55687E'},
                            
                        grid: {
                            color: '#334155'
                        }
                    }
                },
                labels: {
                    color: '#E8E8E8'
                },
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        }
                    }
                }
            }
    })

    // 1. call update function
    updateContractsPerMonth();
}

function initRevenueByCustomer() {
    let revenueByCustomerChart;
    const ctx = document.getElementById("averageContractValueChart");
    // fetch api
    fetch(`api/contracts/revenue/customer`)
    .then(res => res.json())
    .then(data => {

        console.log("Revenue by Customer Data:", data);
        const customers = data.map(customer => customer.name);
        const revenue = data.map(customer => parseFloat(customer.total_revenue));
        console.log("Customers:", customers);
        console.log("Revenue:", revenue)
        if (revenueByCustomerChart) {
            revenueByCustomerChart.destroy();
        }

        revenueByCustomerChart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: customers, // REPLACE WITH CUSTOMER NAMES
            datasets: [{
                label: 'Revenue', 
                data: revenue, // REPLACE WITH REVENUE VALUES
                borderWidth:2,
                borderColor: '#DC143C',
                backgroundColor: '#e0424294',
                fill: 'start',
                borderRadius: 8,
                tension: 0.4,
                hoverBackgroundColor: '#DC143C' 
            }]
                },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks:  {
                            color: '#7c8a99'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            callback: function(value) {
                            return new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumSignificantDigits: 3
                            }).format(value)
                        },        
                            color: '#55687E'},   
                        grid: {
                            color: '#334155'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#E8E8E8'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label; // Show customer name as title
                            } 
                        }
                    }
                },
                
            }
        })
        
        
    })
    .catch(err => {
        console.log("Fetching Error:", err);
    })

     
}

function initAverageContractValue() {

}

let laborVsProfitChart;
function initMostQuotedVendors() {
    const ctx = document.getElementById("laborVsProfitChart");
    // Get filters
    const contractId = contractDropdown.value;
    // api fetch
    fetch(`api/contracts/labor-vs-profit?contractId=${contractId}`)
    .then(res => res.json())
    .then(data => {
        const laborCost = data.map(item => parseFloat(item.labor_cost));
        const profit = data.map(item => parseFloat(item.profit));
        const labels = data.map(item => item.project);
        
        // draw chart

        if (laborVsProfitChart) {
            laborVsProfitChart.destroy();
        }

        laborVsProfitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: 
                [
                    {
                    label: 'Labor Cost',
                    data: laborCost,
                    borderWidth:2,
                    borderColor: '#DC143C',
                    backgroundColor: '#e0424294',
                    borderRadius:8,
                    hoverBackgroundColor: '#DC143C',
                    yAxisID: 'yMoney'
                    },

                    {
                    label: 'Profit',
                    data: profit,
                    borderWidth:2,
                    borderColor: '#ffffff55',
                    backgroundColor: '#ffffff22',
                    borderRadius:8,
                    tension: 0.1,
                    hoverBackgroundColor: '#ffffff99',
                    yAxisID: 'yMoney' 
                    },

                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: {
                            color: '#7c8a99'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    yMoney: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        ticks: { 
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumSignificantDigits: 3
                                }).format(value)
                            },        
                            color: '#55687E'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                },

                plugins: {
                    legend: {
                        labels: {
                            color: '#E8E8E8'
                        }
                    },
                    tooltip: {
                        
                    }
                }
            }
        }) 
    })
    
}


 async function updateContractsPerMonth() {
    // get the year
    const month = monthDropdown.value;
    const year = dateRangeDropdown.value;
    console.log("Current year:",year)
    // fetch data with params
    const request =  await fetch(`api/contracts/perMonth?month=${month}&year=${year}`);

    if (!request.ok) {
        console.log(request.status);
    }

    const result = await request.json();
    console.log("API results for CPM",result);
    // update table 
    let contractCount = new Array(12).fill(0);
    // console.log(contractCount);
    
    result.map(item => {
        const monthIndex = parseInt(item.month - 1);
        if (monthIndex > -1) {
           contractCount[monthIndex] = item.count; 
        }
        
    })


    contractsPerMonthChart.data.datasets[0].data = contractCount;
    contractsPerMonthChart.options.scales.y.max = Math.max(...contractCount) + 5;
    contractsPerMonthChart.update();

    console.log("dataset", contractsPerMonthChart.data.datasets);
    
    
}

let projectPerformanceChart;
function initProjectPerformance() {
    const ctx = document.getElementById("projectPerformanceChart");
    // fetch data project completion per month
    fetch(`/api/projects/performance`)
    .then(res => res.json())
    .then(data => {
        console.log("Project Performance Data:", data);
    })


    
    projectPerformanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // REPLACE WITH PROJECT NAMES
            datasets: [{
                label: 'Performance',
                data: [], // REPLACE WITH PERFORMANCE VALUES
                borderWidth:2,
                borderColor: '#DC143C',
                backgroundColor: '#DC143C',
                pointStyle: 'circle',
                tension: 0.1,
                hoverBackgroundColor: '#DC143C',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    ticks: {
                        color: '#7c8a99'
                    },
                    grid: {
                        color: '#334155'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#55687E'},
                        
                    grid: {
                        color: '#334155'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                    }
                }
            }
        }
    })
}



dateRangeDropdown.addEventListener('change', () => {
    updateContractsPerMonth();
    initRevenueVsExpenseChart();
})

monthDropdown.addEventListener('change', () => {
    updateContractsPerMonth();
    initRevenueVsExpenseChart();
})

contractDropdown.addEventListener('change', () => {
    initMostQuotedVendors();
    initRevenueByCustomer();
    initRevenueVsExpenseChart();
    // initLaborVsProfit();
})

