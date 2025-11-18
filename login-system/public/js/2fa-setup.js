const msg = document.getElementById('msg');
const statusSection = document.getElementById('status-section');
const setupSection = document.getElementById('setup-section');
const backupSection = document.getElementById('backup-section');
const disableSection = document.getElementById('disable-section');

const currentStatus = document.getElementById('current-status');
const enableBtn = document.getElementById('enableBtn');
const disableBtn = document.getElementById('disableBtn');
const verifyForm = document.getElementById('verifyForm');
const disableForm = document.getElementById('disableForm');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDisableBtn = document.getElementById('cancelDisableBtn');
const finishBtn = document.getElementById('finishBtn');

let twoFactorEnabled = false;

// Check current 2FA status
async function checkStatus() {
  try {
    const res = await fetch('/auth/2fa/status', {
      credentials: 'include'
    });
    const data = await res.json();
    
    if (res.ok) {
      twoFactorEnabled = data.enabled;
      currentStatus.textContent = twoFactorEnabled 
        ? '✓ Two-Factor Authentication is currently enabled' 
        : '○ Two-Factor Authentication is currently disabled';
      currentStatus.style.color = twoFactorEnabled ? 'green' : '#666';
      enableBtn.style.display = twoFactorEnabled ? 'none' : 'inline-block';
      disableBtn.style.display = twoFactorEnabled ? 'inline-block' : 'none';
    }
  } catch (err) {
    showMessage('Failed to check 2FA status', 'error');
  }
}

// Show message
function showMessage(text, type = 'info') {
  msg.className = `message message-${type}`;
  msg.textContent = text;
  msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Enable 2FA - start setup
enableBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/auth/2fa/setup', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    
    if (res.ok) {
      document.getElementById('qrCodeImg').src = data.qrCode;
      document.getElementById('secretCode').textContent = data.secret;
      statusSection.classList.add('hidden');
      setupSection.classList.remove('hidden');
    } else {
      showMessage(data.error || 'Failed to start setup', 'error');
    }
  } catch (err) {
    showMessage('Network error', 'error');
  }
});

// Verify and enable
verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('verifyCode').value;
  
  try {
    const res = await fetch('/auth/2fa/verify-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    
    if (res.ok) {
      // Show backup codes
      const backupCodesList = document.getElementById('backupCodesList');
      backupCodesList.innerHTML = data.backupCodes
        .map(code => `<div>${code}</div>`)
        .join('');
      
      setupSection.classList.add('hidden');
      backupSection.classList.remove('hidden');
      showMessage('2FA enabled successfully!', 'success');
    } else {
      showMessage(data.error || 'Invalid code', 'error');
    }
  } catch (err) {
    showMessage('Network error', 'error');
  }
});

// Cancel setup
cancelBtn.addEventListener('click', () => {
  setupSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
  document.getElementById('verifyCode').value = '';
});

// Finish - go back to status
finishBtn.addEventListener('click', () => {
  backupSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
  checkStatus();
});

// Disable 2FA
disableBtn.addEventListener('click', () => {
  statusSection.classList.add('hidden');
  disableSection.classList.remove('hidden');
});

// Confirm disable
disableForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('disablePassword').value;
  
  try {
    const res = await fetch('/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    
    if (res.ok) {
      showMessage('2FA disabled successfully', 'success');
      disableSection.classList.add('hidden');
      statusSection.classList.remove('hidden');
      document.getElementById('disablePassword').value = '';
      checkStatus();
    } else {
      showMessage(data.error || 'Failed to disable 2FA', 'error');
    }
  } catch (err) {
    showMessage('Network error', 'error');
  }
});

// Cancel disable
cancelDisableBtn.addEventListener('click', () => {
  disableSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
  document.getElementById('disablePassword').value = '';
});

// Initial status check
checkStatus();
