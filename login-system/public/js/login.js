const form = document.getElementById('form');
const msg  = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';

  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const t0 = performance.now();
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const t1 = performance.now();

    let data = {};
    try { data = await res.json(); } catch {}

    if (res.ok) {
      msg.className = 'message message-success';
      msg.textContent = `Success! Redirecting...`;
      
      // Check if user is admin
      try {
        const adminCheck = await fetch('/auth/check-admin', {
          credentials: 'include'
        });
        const adminData = await adminCheck.json();
        
        if (adminCheck.ok && adminData.isAdmin) {
          setTimeout(() => location.href = '/admin_page/index.html', 600);
        } else {
          setTimeout(() => location.href = '/landing_page/index.html', 600);
        }
      } catch (err) {
        // If check fails, default to landing page
        setTimeout(() => location.href = '/landing_page/index.html', 600);
      }
    } else {
      msg.className = 'message message-error';
      if (data && typeof data.error === 'string' && data.error.toLowerCase().includes('not verified')) {
        // Redirect to resend verification, pre-filling the email
        const q = new URLSearchParams({ email }).toString();
        window.location.href = `/resend.html?${q}`;
      } else {
        msg.textContent = (data && data.error) || `Error ${res.status}`;
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
    msg.className = 'message message-error';
    msg.textContent = 'Network error. Is the server running on http://localhost:3000 ?';
  }
});
