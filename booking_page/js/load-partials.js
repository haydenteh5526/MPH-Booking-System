// Load header and footer dynamically
document.addEventListener('DOMContentLoaded', () => {
    // Load header
    fetch('../partials/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Header fetch failed: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
            
            // Initialize profile dropdown after header is loaded
            if (window.initProfileDropdown) {
                window.initProfileDropdown();
            }
            
            // My Bookings button
            const myBookingsBtn = document.getElementById('myBookingsBtn');
            if (myBookingsBtn) {
                myBookingsBtn.addEventListener('click', () => {
                    window.location.href = 'my-bookings.html';
                });
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
        });
    
    // Load footer
    fetch('../partials/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Footer fetch failed: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('footer-placeholder').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
});
