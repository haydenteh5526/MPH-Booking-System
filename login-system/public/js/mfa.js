const form = document.getElementById('form');
const msg  = document.getElementById('msg');

const email = sessionStorage.getItem('mfaEmail') || '';
const rememberMe = sessionStorage.getItem('mfaRemember') === '1';
if (!email) {
  msg.className = 'err';
  msg.textContent = 'Missing email context. Please start from login.';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';

  try {
    const code = document.getElementById('code').value.trim();
    const res = await fetch('/auth/mfa-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, rememberMe })
    });
    let data = {}; try { data = await res.json(); } catch {}
    if (res.ok) {
      sessionStorage.removeItem('mfaEmail');
      sessionStorage.removeItem('mfaRemember');
      window.location.href = '/dashboard';
    } else {
      msg.className = 'err';
      msg.textContent = (data && data.error) || `Error ${res.status}`;
    }
  } catch (err) {
    msg.className = 'err';
    msg.textContent = 'Network error.';
  }
});

