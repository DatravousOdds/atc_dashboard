
function initCharts() {
    initContractValueOverTime();
    initContractsPerMonth();
    initAverageContractValue();
    initMostQuotedVendors();
    initRevenueByCustomer();
    
}

// ====== TO DO =================
//  UPDATE LABELS & VALUE 
//  TO SHOW YEAR & REVENUE 
// ==============================
function initContractValueOverTime() {
    const ctx = document.getElementById("contractValueChart");
    // fetch api
    fetch('/api/contracts/revenue/customer')
    .then(res => res.json())
    .then(data => {
        const contracts = data.map(contract => contract.contract_name);
        const value = data.map(val => val.revenue)
        console.log("contract values",value)

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: contracts, // YEAR
                datasets: [{
                    label: 'Value Over Time',
                    data: value, // REVENUE PER YEAR
                    borderWidth:2,
                    borderColor: '#DC143C',
                    backgroundColor: '#DC143C',
                    pointStyle: 'line',
                    tension: 0.1,
                    hoverBackgroundColor: '#DC143C',

                    
                    
                }]
            },
            options: {
                resposive: true,
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
                    y: {min:0,
                        max:Math.max(value),
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
                labels: {
                    color: '#E8E8E8'
                },
                
            }
        }) 
    })
    .catch(err => {
        console.log(err)
    })



      
}

function initContractsPerMonth() {
    const ctx = document.getElementById("contractsPerMonthChart")

    // data
    fetch(`api/contracts/perMonth`)
    .then(res => res.json())
    .then(data => {
        console.log(data)
        const monthName = ['Jan','Feb','Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep','Oct', 'Nov','Dec'];
        const labels = data.map(item => monthName[item.month - 1]);
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
        resposive: true,
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
            y: {min:0,
                max:50,
                ticks: { 
                    
                    color: '#55687E'},
                    
                grid: {
                    color: '#334155'
                }
            }
        },
        labels: {
            color: '#E8E8E8'
        }
    }
        })
    })
    .catch(error => {
        console.error(error)
    })

    

}

function initRevenueByCustomer() {
    const ctx = document.getElementById("averageContractValueChart");
    // fetch api
    fetch(`api/contracts/revenue/customer`)
    .then(res => res.json())
    .then(data => {

        const customers = data.map(customer => customer.contract_name);
        const revenue = data.map(r => r.revenue)
        
        new Chart(ctx, {
        type: 'line',
        data: {
        labels: customers,
        datasets: [{
            label: 'Revenue By Customer',
            data: revenue,
            borderWidth:2,
            borderColor: '#DC143C',
            backgroundColor: '#e0424294',
            fill: 'origin',
            borderRadius:8,
            tension: 0.1,
            hoverBackgroundColor: '#DC143C'
            
            
            
            
        }]
            },
        options: {
            resposive: true,
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
                y: {min:0,
                    max:1000000,
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
            labels: {
                color: '#E8E8E8'
            }
        }
    })
    })
    .catch(err => {
        console.log("Fetching Error:", err);
    })

     
}

function initAverageContractValue() {

}

function initMostQuotedVendors() {
    const ctx = document.getElementById("mostQuotedVendors");
    // api fetch
    fetch('api/contracts/vendor/quote')
    .then(res => res.json())
    .then(data => {
        console.log("QUOTE DATA",data)
        const vendors = data.map(vendor => vendor.company_name);
        console.log("VENDORS",vendors)
        const prices = data.map(price => price.extended_price);
        console.log("PRICES",prices)

        // draw chart
        new Chart(ctx, {
    type: 'bar',
    data: {
        labels: vendors,
        datasets: [{
            label: 'Vendors By Value',
            data: prices,
            borderWidth:2,
            borderColor: '#DC143C',
            backgroundColor: '#e0424294',
            fill: 'origin',
            borderRadius:8,
            tension: 0.1,
            hoverBackgroundColor: '#DC143C'
            
            
            
        }]
    },
    options: {
        resposive: true,
        maintainAspectRatio: true,
        labels: {
            color: '#E8E8E8'
        }
    }
        }) 
    })
    
}



initCharts();





