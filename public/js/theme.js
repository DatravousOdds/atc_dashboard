const themeToggle = document.getElementById('theme-toggle');

const getTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }

    
    return 'dark'; // default to dark
}

const currentTheme = getTheme();
document.body.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);    
    updateIcon(newTheme);
    localStorage.setItem('theme', newTheme);

    console.log('Theme changed to:', newTheme);
});

function updateIcon(theme) {
    if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}