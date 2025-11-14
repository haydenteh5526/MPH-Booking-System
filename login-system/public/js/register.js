const form = document.getElementById('form');
const msg  = document.getElementById('msg');
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_PATTERN = /^[+0-9 ()-]{7,20}$/;
const STUDENT_ID_PATTERN = /^[A-Za-z0-9]{5,20}$/;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = ''; msg.className = '';
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phoneNumber = document.getElementById('phone').value.trim();
  const studentId = document.getElementById('studentId').value.trim().toUpperCase();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  if (!name) {
    msg.className = 'err';
    msg.textContent = 'Please enter your full name.';
    return;
  }
  if (!PHONE_PATTERN.test(phoneNumber)) {
    msg.className = 'err';
    msg.textContent = 'Enter a valid phone number (7-20 digits, + allowed).';
    return;
  }
  if (!STUDENT_ID_PATTERN.test(studentId)) {
    msg.className = 'err';
    msg.textContent = 'Student ID should be 5-20 letters/numbers.';
    return;
  }
  if (password !== confirm) {
    msg.className = 'err';
    msg.textContent = 'Passwords do not match.';
    return;
  }
  if (!PASSWORD_PATTERN.test(password)) {
    msg.className = 'err';
    msg.textContent = 'Password needs at least one uppercase letter, at least one number, and 8+ chars.';
    return;
  }
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phoneNumber, studentId, password })
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

