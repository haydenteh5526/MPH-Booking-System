const form = document.getElementById('form');
const msg  = document.getElementById('msg');

// Pre-fill email if provided
try {
  const params = new URLSearchParams(globalThis.location.search);
  const email = params.get('email');
  if (email) document.getElementById('email').value = email;
} catch (err) {
  console.error('resend: unable to prefill email', err);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';
  const email = document.getElementById('email').value.trim();
  try {
    const res = await fetch('/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    let data = {}; try { data = await res.json(); } catch (err) { console.error('resend: parse error', err); }
    if (res.ok) {
      msg.className = 'ok';
      msg.textContent = 'If the account exists and is not verified, a new link has been sent.';
    } else {
      msg.className = 'err';
      msg.textContent = data?.error ?? `Error ${res.status}`;
    }
  } catch (err) {
    console.error('resend: network error', err);
    msg.className = 'err';
    msg.textContent = 'Network error.';
  }
});

