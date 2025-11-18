const form = document.getElementById('form');
const msg  = document.getElementById('msg');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

// Password visibility toggle
togglePasswordBtn.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  
  // Toggle icon between eye and eye-off
  if (type === 'text') {
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
    eyeIcon.setAttribute('stroke', '#ffffff');
  } else {
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
    eyeIcon.setAttribute('stroke', '#ffffff');
  }
});

let requiresTwoFactor = false;
let loginEmail = '';
let loginPassword = '';

const twoFactorGroup = document.getElementById('twoFactorGroup');
const twoFactorInput = document.getElementById('twoFactorCode');
const emailInput = document.getElementById('email');
const passwordGroup = document.querySelector('#password').closest('.form-group');
const rememberMeGroup = document.querySelector('.remember-me-group');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const twoFactorCode = twoFactorInput.value.trim();

    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password, 
        twoFactorCode: twoFactorCode || null,
        rememberMe 
      })
    });

    let data = {};
    try { data = await res.json(); } catch {}

    if (res.ok) {
      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        requiresTwoFactor = true;
        msg.className = 'message message-success';
        msg.textContent = data.message || 'A verification code has been sent to your email';
        
        // Show 2FA input field and hide password field
        twoFactorGroup.style.display = 'flex';
        passwordGroup.style.display = 'none';
        rememberMeGroup.style.display = 'none';
        emailInput.disabled = true;
        twoFactorInput.focus();
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Verify Code';
        
        return;
      }

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
      requiresTwoFactor = false;
      msg.className = 'message message-error';
      msg.textContent = (data && data.error) || `Error ${res.status}`;
      
      // Reset form if 2FA failed
      if (twoFactorGroup.style.display !== 'none') {
        twoFactorInput.value = '';
        twoFactorInput.focus();
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
    requiresTwoFactor = false;
    msg.className = 'message message-error';
    msg.textContent = 'Network error. Is the server running on http://localhost:3000 ?';
  }
});
