const form = document.getElementById('form');
const msg  = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';
  const email = document.getElementById('email').value.trim();
  try {
    const res = await fetch('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    let data = {}; try { data = await res.json(); } catch (err) { console.error('forgot: parse error', err); }
    if (res.ok) {
      msg.className = 'ok';
      msg.textContent = 'If the account exists, a reset link has been sent.';
    } else {
      msg.className = 'err';
      msg.textContent = data?.error ?? `Error ${res.status}`;
    }
  } catch (err) {
    console.error('forgot: network error', err);
    msg.className = 'err';
    msg.textContent = 'Network error.';
  }
});

