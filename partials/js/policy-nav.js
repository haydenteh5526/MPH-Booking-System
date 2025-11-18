// Policy page navigation - adapts based on user role (admin or regular user)
(async function() {
    try {
        const response = await fetch('/auth/check-admin', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.isAdmin) {
                // Update brand link to go to admin page
                const brandLink = document.querySelector('.brand-name');
                if (brandLink) {
                    brandLink.textContent = 'MPH Booking System - Admin';
                    brandLink.href = '../admin_page/index.html';
                }
                
                // Remove navigation links (admins don't need them)
                const navCenter = document.querySelector('.header-center');
                if (navCenter) {
                    navCenter.style.display = 'none';
                }
                
                // Update header container for admin layout
                const headerContainer = document.querySelector('.header-container');
                if (headerContainer) {
                    headerContainer.style.gridTemplateColumns = '1fr auto';
                }
                
                // Update dropdown - remove user-specific items
                const myBookingsLink = document.querySelector('a[href*="my-bookings"]');
                const profileLink = document.querySelector('a[href*="profile.html"]');
                if (myBookingsLink) myBookingsLink.remove();
                if (profileLink) profileLink.remove();
                
                // Update footer links to point back to admin
                document.querySelectorAll('a[href*="landing_page"], a[href*="booking_page"], a[href*="about_page"]').forEach(link => {
                    if (!link.href.includes('policy')) {
                        link.href = '../admin_page/index.html';
                    }
                });
            }
        }
    } catch (error) {
        // Not authenticated or error - keep default user navigation
        console.log('Using default user navigation');
    }
})();
