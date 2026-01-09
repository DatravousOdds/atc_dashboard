



// ============================================
// HELPER FUNCTIONS
// ============================================

// =============== FORMULAS =================
// Win Rate Formula = (Number of Wins / Total Number of Bids)
// [(Current Proposal Revenue) - Total Proposal Revenue] * 100
// ==========================================

// Get 
    
async function getTotalContractValue(year, month, contractId) {
    const params = new URLSearchParams();   
    const { totalContractValue } = appState;

    if( year && year !=='all') params.append('year', year);
    if( month && month !=='all') params.append('month', month);
    if( contractId && contractId !=='all') params.append('contractId', contractId);

    console.log("Fetching total contract value with params:", params.toString());
    
    try {
        const res = await fetch(`/api/contracts/value?${params.toString()}`);
        if(!res.ok) {
            throw new Error("API Error:", res.status)
        }

        const data = await res.json();

        totalContractValue.textContent = formatCurrency(data.total_contract_value) || "$0.00";

    } catch(error) {
        console.log("Error fetching data!", error.message);
        totalContractValue.textContent = "Error loading data";
    }
    

}

function getTopBidItems(year, month, contractId) {
    const params = new URLSearchParams();   

    if( year && year !=='all') params.append('year', year);
    if( month && month !=='all') params.append('month', month);
    if( contractId && contractId !=='all') params.append('contractId', contractId);

    console.log("Fetching bid items for contract:", contractId);
    fetch(`/api/contracts/bidItems?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
        console.log("Bid Items",data);
        // reload data table
        if (appState.bidItemsTable) {
            appState.bidItemsTable.ajax.reload();
        }
    })
    .catch(err => {
        console.error(err)
    })
}

function getTotalActiveContracts(year, month, contractId) {
    const { activeContracts } = appState;
    const params = new URLSearchParams();

    if( year && year !=='all') params.append('year', year);
    if( month && month !=='all') params.append('month', month);
    if( contractId && contractId !=='all') params.append('contractId', contractId);

    fetch(`/api/contracts?status=completed&${params.toString()}`)
    .then(res => res.json())
    .then(data => {
        activeContracts.textContent = data.length || 0; 
    })
    .catch(error => {
        console.error("Error fetching active contracts:", error);
    })
}

function getAverageContractValue(year, month, contractId) {
    const { averageContractValue } = appState;
    
    const params = new URLSearchParams();

    if( year && year !=='all') params.append('year', year);
    if( month && month !=='all') params.append('month', month);
    if( contractId && contractId !=='all') params.append('contractId', contractId);

    try{
        // ask api
        fetch(`/api/contracts/average?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
        
            // display average to client
            averageContractValue.textContent = formatCurrency(data.average_contract_value) || "$0.00";
        })
        .catch(error => {
            console.error("Error fetching average:", error);
            averageContractValue.textContent = "Error";
        })

    } catch(error) {
        console.log("Error fetching average contract value!", error)
    }
        
    
}

function getWinRatePercentage(year, month, contractId) {
    const { winRate } = appState;
    const params = new URLSearchParams();
    if( year && year !=='all') params.append('year', year);
    if( month && month !=='all') params.append('month', month);
    if( contractId && contractId !=='all') params.append('contractId', contractId);

    fetch(`/api/contracts/win-rate?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
        console.log("Win Rate Data:", data)
        winRate.textContent = data.win_rate ? `${data.win_rate}%` : "0%";
    })
    .catch(error => {
        console.error("Error fetching win rate:", error);
    })
}

// Load 

function loadContracts() {
    const { contractDropdown } = appState;
    const allOption = contractDropdown.options[0];
    // Load year dropdown
    fetch(`/api/contracts/dropdown`)
    .then(res => res.json())
    .then(data => {
        console.log(data)
        data.forEach(d => {
            const op = document.createElement('option');
            op.textContent = d.contract_name;
            op.value = d.id
            contractDropdown.insertBefore(op, allOption.nextSibling);
        })
    })
    .catch(error => {
        console.error('Search error:', error)
    })
}

function loadDateRange() {
    const { dateRangeDropdown } = appState;
    const allOption = dateRangeDropdown.options[0];
    // console.log(allOption);
    // Load year dropdown
    fetch(`/api/contracts/year/dropdown`)
    .then(res => res.json())
    .then(data => {
        // console.log(data)
        data.forEach(d => {
            const year = d.extract;
            const op = document.createElement('option');
            op.value = year;
            op.innerHTML = year;
            dateRangeDropdown.insertBefore(op, allOption.nextSibling)
            

        })
    })
    .catch(error => {
        console.error('Search error:', error)
    })
}

// Display 

function displayContracts(contracts) {   
    // console.log(contracts)
    const { contractDropdown} = appState; 

    if (contracts.length === 0) {
        console.log("No data found!")
    }

    while (contractDropdown.options.length > 1) {
        contractDropdown.remove(1)
    }

    contracts.forEach(contract => {
        const op = document.createElement('option');
        op.textContent = contract.contract_name;
        op.value = contract.id;  
        contractDropdown.appendChild(op)
    })
}

function displayResults(results) {
    const { searchResults, searchResultsDropdown, searchInput } = appState;
    // Clear previous results
    searchResults.innerHTML = ''
    searchResultsDropdown.classList.add('active')
    searchInput.classList.add('active')
    // Check if no results
    if (results.length == 0) {
        const theme = document.body.getAttribute('data-theme');
        // check theme and set color accordingly
        if (theme === 'dark') {
            searchResults.innerHTML = `<li style="color:white;">No results found!</li>`;
        } else {
            searchResults.innerHTML = `<li style="color:black;">No results found!</li>`;
        }

        searchResultsDropdown.classList.add('active')
        return;
    }
    // Populate results
    results.forEach(result => {
        const li = document.createElement('li');
        li.innerText = `${result.contract_name}`;
        li.className = 'result';

        li.addEventListener('click', () => selectContract(result));
        searchResults.appendChild(li);
        
    })

    

}

function displayWinRate(rate) {
    // console.log(rate)
    const winRate = document.getElementById('total-contracts');
    // console.log(winRate)
    
    if (!winRate) return null;

    winRate.innerText = '';

    rate.forEach(r => {
        const winRatePercent = r.win_rate_percent;
        winRate.textContent = `${winRatePercent}%`

    })
}

function applyFilters() {
    const { monthDropdown, dateRangeDropdown, contractDropdown } = appState;

    const month = monthDropdown.value;
    const year = dateRangeDropdown.value;
    const contractId = contractDropdown.value;
  
     console.log("Applying Filters - Year:", year, "Month:", month, "Contract:", contractId);

    // Fetch filtered contracts

    getTotalActiveContracts(year, month, contractId);
    getAverageContractValue(year, month, contractId);
    getTotalContractValue(year, month, contractId);
    getWinRatePercentage(year, month, contractId);
    getTopBidItems(year, month, contractId);
    


    if(appState.bidItemsTable) {
       console.log(appState.bidItemsTable.data());
    }
}

function selectContract(contract) {
    const { contractDropdown, searchInput, searchResultsDropdown } = appState;
    // Update UI
    contractDropdown.value = contract.id;
    searchInput.value = contract.contract_name;
    searchResultsDropdown.classList.remove('active');
    searchInput.classList.remove('active');
    // Fetch and display related data
    applyFilters();
    
    
        
    
}



// Actions
function formatCurrency(n) {
    const formattedCurrency = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(n)
    return formattedCurrency;
}

function performSearch(query) {
    const { searchResults } = appState;

    const searchTerm = `%${query}%`;
    
    fetch(`/api/contract/search?query=${encodeURIComponent(searchTerm)}`)
    .then(res => res.json())
    .then(data => {
        displayResults(data);
        console.log("Search: ",data)
    })
    .catch(error => {
        console.error('Search error:', error)
        searchResults.innerHTML = '<li>Error searching contracts</li>'

    })
}


// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================


$(document).ready(function () {
    const {
        contractDropdown,
        monthDropdown,
        dateRangeDropdown,
        searchInput,
        searchResults,
        searchResultsDropdown,
    } = appState;

    let searchTimeout;

    // Load initial data
    loadDateRange();
    loadContracts();
    applyFilters(); // initial load with default filters

    // Click outside to close search dropdown
    document.addEventListener('click', function(event) {
        if (!searchResultsDropdown.contains(event.target) && event.target !== searchInput) {
            searchResultsDropdown.classList.remove('active');
            searchInput.classList.remove('active');
        }
    });

    // Search input listener
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        
        clearTimeout(searchTimeout)

        if (!query || query == '') {
            searchResultsDropdown.classList.remove('active');
            searchInput.classList.remove('active')
            searchResults.innerHTML = '';
            return;
        }
        
        searchResultsDropdown.classList.add('active')

        // wait 30 second before search
        searchTimeout = setTimeout(() => {
            performSearch(query)
        }, 300);

    })

    // check for keydown event for escape key to close search dropdown
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchResultsDropdown.classList.remove('active');
            searchInput.classList.remove('active');
        }
        if (e.key === 'Enter') {
            const firstResult = searchResults.querySelector('.result');
            
            if (firstResult) {
                firstResult.click();
            }
        }

    })
    
    // Filter dropdown listeners
    contractDropdown.addEventListener('change', function() {
        if (this.value !='all') {
            dateRangeDropdown.value ='all';
            monthDropdown.value = 'all';
            searchInput.value = '';

        }
        applyFilters();
    })

    monthDropdown.addEventListener('change', async function() {
        
        contractDropdown.value = 'all'
        
        applyFilters();

        
    })

    dateRangeDropdown.addEventListener('change', async function() {
        contractDropdown.value = 'all';
        searchInput.value = '';

        applyFilters();
        
        
        
    })


})












