


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
    initRevenueByCustomer();
    initProjectPerformance();
    initBondCapacityChart();

}

// Draws the "X% used" headline in the doughnut's cutout. Chart.js has no
// built-in center-text support, so this is a small custom plugin scoped to
// just the bond capacity chart via canvas id.
const bondCapacityCenterTextPlugin = {
    id: 'bondCapacityCenterText',
    afterDraw(chart) {
        if (chart.canvas.id !== 'bondCapacityChart' || !chart.$centerLabel) return;
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillStyle = chart.$centerLabel.color;
        ctx.fillText(chart.$centerLabel.value, centerX, centerY - 10);

        ctx.font = '500 11px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillStyle = '#7c8a99';
        ctx.fillText(chart.$centerLabel.sublabel, centerX, centerY + 14);
        ctx.restore();
    }
};
Chart.register(bondCapacityCenterTextPlugin);

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

    // console.log("Filters - Year:", year, "Month:", month, "Contract ID:", contractId);
    // fetch api
    fetch(`/api/contracts/finance/revenue-vs-expense?year=${year}&month=${month}&contractId=${contractId}`)
    .then(res => res.json())
    .then(data => {
        
        const revenueByMonth = new Array(12).fill(0);
        const expenseByMonth = new Array(12).fill(0);
        const monthYearLabels = ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'];
        
        data.month.forEach((m, i)=> {
            const monthIndex = m - 1;
            revenueByMonth[monthIndex] = data.revenue[i];
            expenseByMonth[monthIndex] = data.expense[i];
        })
    
        if (revenueVsExpenseChart) {
            revenueVsExpenseChart.destroy();
        }
    
        revenueVsExpenseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthYearLabels,// replace with month
                datasets: 
                [
                    {
                    label: 'Revenue',
                    data: revenueByMonth, // revenue per month
                    borderWidth:2,
                    borderColor: '#DC143C',
                    backgroundColor: '#DC143C',
                    pointStyle: 'circle',
                    tension: 0.1,
                    hoverBackgroundColor: '#DC143C', 
                    },
                    {
                    label: 'Expense',
                    data: expenseByMonth, // expense per month
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

        // console.log("Revenue by Customer Data:", data);
        const customers = data.map(customer => customer.name);
        const revenue = data.map(customer => parseFloat(customer.total_revenue));
        // console.log("Customers:", customers);
        // console.log("Revenue:", revenue)
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


// Bond capacity: company-wide bonding ceiling vs. how much of it is tied up in
// active contracts right now, broken out per project. total_bid_amount stands
// in for each project's bond usage since there's no separate bond amount
// tracked per contract.
let bondCapacityChart;
const BOND_PROJECT_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];
const BOND_OTHER_COLOR = '#9085e9';
const BOND_AVAILABLE_COLOR = '#55687E';
const BOND_OVER_COLOR = '#E42022';
const BOND_TOP_N = 5;

function initBondCapacityChart() {
    const ctx = document.getElementById('bondCapacityChart');
    if (!ctx) return;

    fetch('api/contracts/bond-capacity')
        .then(res => res.json())
        .then(data => {
            const totalCapacity = parseFloat(data.totalCapacity) || 0;
            const usedCapacity = parseFloat(data.usedCapacity) || 0;
            const percentUsed = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

            const byProject = (data.byProject || []).filter(p => p.amount > 0);
            const topProjects = byProject.slice(0, BOND_TOP_N);
            const otherAmount = byProject.slice(BOND_TOP_N).reduce((sum, p) => sum + p.amount, 0);

            const labels = topProjects.map(p => p.project);
            const values = topProjects.map(p => p.amount);
            const colors = topProjects.map((_, i) => BOND_PROJECT_COLORS[i]);

            if (otherAmount > 0) {
                labels.push('Other Active Projects');
                values.push(otherAmount);
                colors.push(BOND_OTHER_COLOR);
            }

            let centerLabel, centerSub, centerColor;

            if (totalCapacity <= 0) {
                labels.push('No Capacity Set');
                values.push(1);
                colors.push(BOND_AVAILABLE_COLOR);
                centerLabel = '—';
                centerSub = 'Set capacity in Settings';
                centerColor = '#7c8a99';
            } else if (usedCapacity >= totalCapacity) {
                centerLabel = `${Math.round(percentUsed)}%`;
                centerSub = 'Over Bond Capacity';
                centerColor = BOND_OVER_COLOR;
            } else {
                labels.push('Available');
                values.push(totalCapacity - usedCapacity);
                colors.push(BOND_AVAILABLE_COLOR);
                centerLabel = `${Math.round(percentUsed)}%`;
                centerSub = 'Bond Capacity Used';
                centerColor = '#E8E8E8';
            }

            if (bondCapacityChart) {
                bondCapacityChart.destroy();
            }

            bondCapacityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderColor: '#11263D',
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.8,
                    cutout: '72%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#E8E8E8',
                                boxWidth: 12,
                                padding: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const formatted = new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0
                                    }).format(context.parsed);
                                    return `${context.label}: ${formatted}`;
                                }
                            }
                        }
                    }
                }
            });

            bondCapacityChart.$centerLabel = {
                value: centerLabel,
                sublabel: centerSub,
                color: centerColor
            };
            bondCapacityChart.update();
        })
        .catch(err => {
            console.log('Fetching Error:', err);
        });
}


 async function updateContractsPerMonth() {
    // get the year
    const month = monthDropdown.value;
    const year = dateRangeDropdown.value;
    // console.log("Current year:",year)
    // fetch data with params
    const request =  await fetch(`api/contracts/perMonth?month=${month}&year=${year}`);

    if (!request.ok) {
        console.log(request.status);
    }

    const result = await request.json();
    // console.log("API results for CPM",result);
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

    // console.log("dataset", contractsPerMonthChart.data.datasets);
    
    
}

let projectPerformanceChart;
function initProjectPerformance() {
    const ctx = document.getElementById("projectPerformanceChart");
    // fetch data project completion per month
    fetch(`/api/projects/performance`)
    .then(res => res.json())
    .then(data => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        const completedProjects = new Array(12).fill(0);

        data.forEach(d => {
            let monthIndex = new Date(d.month).getMonth();
            completedProjects[monthIndex] = d.completed_projects;
        })
        
        projectPerformanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,// REPLACE WITH PROJECT NAMES
            datasets: [{
                label: 'Completed Projects',
                data: completedProjects, // REPLACE WITH PERFORMANCE VALUES
                borderWidth:2,
                borderColor: '#DC143C',
                backgroundColor: 'rgba(220, 20, 60, 0.1)',
                pointStyle: 'circle',
                tension: 0.1,
                hoverBackgroundColor: '#DC143C',
                fill: 'origin'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#7c8a99'
                    },
                    
                    grid: {
                        color: '#334155'
                    }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 10,
                    beginAtZero: true,
                    ticks: { 
                        color: '#55687E'},
                        
                    grid: {
                        color: '#334155'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Project completions per month',
                    color: '#898989ff'
                },
                legend: {
                    labels: {
                        usePointStyle: true,
                    }
                }
            }
        }
    })

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
    initRevenueByCustomer();
    initRevenueVsExpenseChart();
})

