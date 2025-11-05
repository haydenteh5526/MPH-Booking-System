// Navigation helper to set active nav link
function setActiveNav(currentPage) {
    // Wait for header to load
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            // Check if the href matches the current page
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }, 100);
}
