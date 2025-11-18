// Check that the current user is a regular user (not admin)
async function checkUserAuth() {
    try {
        const response = await fetch('/auth/check-admin', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
                // Admin trying to access user pages - redirect to admin
                alert('Admins cannot access user pages. Redirecting to admin dashboard.');
                window.location.href = '/admin_page/index.html';
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        return true; // Allow access on error to prevent breaking the page
    }
}

// Run on page load
checkUserAuth();
