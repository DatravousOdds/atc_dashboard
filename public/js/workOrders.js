const workOrderDropdown = document.getElementById("wo-project-dropdown");


async function getContracts() {
    try {
        const response = await fetch('/api/contracts')

        if (!response.ok) {
            throw new Error(`HTTPS status error: ${response.status}`);
        }

        const results = await response.json();
        return results;
    } catch (err) {
        throw new Error(`Error fetching contracts... ${err.message}`)
    }
}

const contracts = await getContracts();

contracts.forEach(contract => {
    const li = document.createElement('li');
    li.innerText = contract.contract_name;
    workOrderDropdown.append(li)
})

