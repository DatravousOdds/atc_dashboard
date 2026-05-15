const workOrderDropdown = document.getElementById("wo-project-dropdown");
const searchBtn = document.getElementById("searchBtn");
const workOrderProjectDropdown = document.querySelector(".wo-project-dropdown");
const searchInput = document.querySelector(".search-input");
const projectSearch = document.querySelector(".project-search");
const projectSelectContainer = document.querySelector(".project-select-wrapper");
const projectNameDisplay = document.querySelector(".project-name");
const activeCount = document.getElementById("active-count");



projectSelectContainer.addEventListener("click", (e) => {
   workOrderProjectDropdown.classList.toggle("active");

   if (workOrderProjectDropdown.classList.contains("active")) {
       const allProjects = document.querySelectorAll(".wo-project-dropdown li");
       allProjects.forEach(project => {
           project.addEventListener("click", () => {
               const selectedProject = project.innerText;
               projectNameDisplay.innerText = selectedProject;
               workOrderProjectDropdown.classList.remove("active");
           })
       })
   }

})

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!target.closest(".wo-project-dropdown") && !target.closest(".project-select-wrapper")) {
        workOrderProjectDropdown.classList.remove("active");
    }

    if (!projectSearch.contains(event.target)) {
        searchInput.classList.remove("active");
        projectSearch.classList.remove("active");
    }

});





searchBtn.addEventListener("click", () => {
    searchInput.classList.toggle("active");
    projectSearch.classList.toggle("active");
    searchInput.focus();
});


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

