const form = document.getElementById('form');
const msg  = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  if (password !== confirm) {
    msg.className = 'err';
    msg.textContent = 'Passwords do not match.';
    return;
  }
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    let data = {}; try { data = await res.json(); } catch {}
    if (res.ok) {
      msg.className = 'ok';
      msg.textContent = 'Check your email for a verification link.';
    } else {
      msg.className = 'err';
      msg.textContent = (data && data.error) || `Error ${res.status}`;
    }
  } catch (err) {
    msg.className = 'err';
    msg.textContent = 'Network error.';
  }
});

