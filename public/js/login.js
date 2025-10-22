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
      msg.className = 'ok';
      msg.textContent = `Success (${Math.round(t1 - t0)} ms). Redirecting…`;
      setTimeout(() => location.href = '/dashboard', 600);
    } else {
      msg.className = 'err';
      msg.textContent = data.error || `Error ${res.status}`;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    msg.className = 'err';
    msg.textContent = 'Network error. Is the server running on http://localhost:3000 ?';
  }
});
