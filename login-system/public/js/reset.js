const form = document.getElementById('form');
const msg = document.getElementById('msg');
const passwordInput = document.getElementById('password');
const submitBtn = form?.querySelector('button');

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_REQUIREMENTS = 'Password must include at least one uppercase letter, at least one number, and be 8+ characters long.';

function getToken() {
  const search = globalThis.location?.search || '';
  try {
    return new URLSearchParams(search).get('token') || '';
  } catch (err) {
    console.error('[reset] Failed to read URLSearchParams', err);
    const match = /[?&]token=([^&]+)/.exec(search);
    return match ? decodeURIComponent(match[1]) : '';
  }
}

function showError(message) {
  if (!msg) return;
  msg.className = 'err';
  msg.textContent = message;
}

if (!form || !msg || !passwordInput || !submitBtn) {
  console.error('[reset] Missing form elements on the page.');
} else {
  const token = getToken();

  if (!token) {
    form.style.display = 'none';
    showError('Missing or invalid reset token.');
  } else {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      msg.className = '';
      const newPassword = passwordInput.value;

      if (!PASSWORD_PATTERN.test(newPassword)) {
        showError(PASSWORD_REQUIREMENTS);
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const res = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        let data = {};
        try {
          data = await res.json();
        } catch (err) {
          console.error('[reset] parse error', err);
        }

        if (res.ok) {
          msg.className = 'ok';
          msg.innerHTML = 'Password reset ✅<br/>Redirecting to <a href="/login.html">sign in</a>...';
          setTimeout(() => { globalThis.location.href = '/login.html'; }, 2500);
        } else {
          showError(data?.error ?? `Error ${res.status}`);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        console.error('[reset] Network error', err);
        showError('Network error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
}
