



function initCharts() {
    initRevenueVsExpenseChart();
    initContractsPerMonth();
    initAverageContractValue();
    initMostQuotedVendors();
    initRevenueByCustomer();
    
}

// ====== TO DO =================
//  UPDATE LABELS & VALUE 
//  TO SHOW YEAR & REVENUE 
// ==============================
function initRevenueVsExpenseChart() {
    const ctx = document.getElementById("revenueVsExpenseChart");
    // fetch api
    fetch('/api/contracts/finance/revenue-vs-expense')
    .then(res => res.json())
    .then(data => {
        
        console.log("Revenue vs Expense Data:",data)
        console.log("Revenue:",data.revenue);
        const revenue = data.revenue;
        const expense = data.expense;
        // const labels = data.labels;
    
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'], // YEAR
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

function initContractsPerMonth() {
    const ctx = document.getElementById("contractsPerMonthChart");

    // data
    fetch(`api/contracts/perMonth`)
    .then(res => res.json())
    .then(data => {
        // console.log( "Contracts Per Month Data:",data)
        ;
        const labels = ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'];
        // console.log(labels)
        const contractCount = data.map(item => item.count);
        

        new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: 'Number of Contracts Per Month',
            data: contractCount,
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
            y: {beginAtZero: true,
                max: Math.max(...contractCount) + 5, // Add some padding to the max value
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
    })
    .catch(error => {
        console.error(error)
    })

    

}


function initRevenueByCustomer() {
    let revenueByCustomerChart;
    const ctx = document.getElementById("averageContractValueChart");
    // fetch api
    fetch(`api/contracts/revenue/customer`)
    .then(res => res.json())
    .then(data => {

        // console.log("Revenue by Customer Data:", data);
        const customers = data.map(customer => customer.customer_name);
        const revenue = data.map(customer => parseFloat(customer.revenue));
        // console.log("Customers:", customers);
        if (revenueByCustomerChart) {
            revenueByCustomerChart.destroy();
        }

        revenueByCustomerChart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: ['Customer1', 'Customer2', 'Customer3', 'Customer4'], // REPLACE WITH CUSTOMER NAMES
            datasets: [{
                label: 'Revenue', 
                data: ['12000', '15000', '8000', '22000', '18000'], // REPLACE WITH REVENUE VALUES
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
    // api fetch
    fetch('api/contracts/labor-vs-profit')
    .then(res => res.json())
    .then(data => {
        // console.log("Labor vs Profit Data:", data);
        const laborCost = data.map(item => parseFloat(item.labor_cost));
        const profit = data.map(item => parseFloat(item.profit));
        // console.log("Labor Cost:", laborCost);
        // console.log("Profit:", profit);
        // draw chart

        if (laborVsProfitChart) {
            laborVsProfitChart.destroy();
        }

        laborVsProfitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'], // REPLACE WITH MONTHS
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



initCharts();





