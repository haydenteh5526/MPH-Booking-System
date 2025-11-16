// Universal Profile Dropdown Handler
// Works across all pages with profile dropdown functionality

(function() {
    'use strict';
    
    function initProfileDropdown() {
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        const myBookingsBtn = document.getElementById('myBookingsBtn');
        const profileLinkBtn = document.getElementById('profileLinkBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!profileBtn || !profileDropdown) {
            console.warn('Profile dropdown elements not found');
            return;
        }

        // Check if already initialized to prevent duplicate listeners
        if (profileBtn.dataset.dropdownInitialized === 'true') {
            return;
        }
        profileBtn.dataset.dropdownInitialized = 'true';

        function openDropdown() {
            profileBtn.setAttribute('aria-expanded', 'true');
            profileDropdown.setAttribute('aria-hidden', 'false');
            profileDropdown.classList.add('show');
        }

        function closeDropdown() {
            profileBtn.setAttribute('aria-expanded', 'false');
            profileDropdown.setAttribute('aria-hidden', 'true');
            profileDropdown.classList.remove('show');
        }

        function toggleDropdown(e) {
            e.stopPropagation();
            const isExpanded = profileBtn.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                closeDropdown();
            } else {
                openDropdown();
            }
        }

        // Toggle dropdown on button click
        profileBtn.addEventListener('click', toggleDropdown);

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                closeDropdown();
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });

        // Close dropdown when navigation links are clicked
        if (myBookingsBtn) {
            myBookingsBtn.addEventListener('click', () => {
                closeDropdown();
            });
        }
        
        if (profileLinkBtn) {
            profileLinkBtn.addEventListener('click', () => {
                closeDropdown();
            });
        }
        
        // Handle logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                closeDropdown();
                
                try {
                    const response = await fetch('/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        window.location.href = '/login.html';
                    } else {
                        console.error('Logout failed');
                        window.location.href = '/login.html';
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = '/login.html';
                }
            });
        }

        // Start with dropdown closed
        closeDropdown();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileDropdown);
    } else {
        initProfileDropdown();
    }

    // Also expose as global function for pages that load header dynamically
    window.initProfileDropdown = initProfileDropdown;
})();
