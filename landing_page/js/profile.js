// Profile Page JavaScript

// Profile Dropdown is now handled by universal profile-dropdown.js script

// Load user profile data
async function loadUserProfile() {
  try {
    const response = await fetch('/auth/profile', {
      method: 'GET',
      credentials: 'include'
    });

    console.log('Profile response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = '/login.html';
        return;
      }
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Profile error:', errorData);
      throw new Error(errorData.error || 'Failed to load profile');
    }

    const user = await response.json();
    console.log('User data loaded:', user);
    
    // Update profile display
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileDisplayEmail = document.getElementById('profileDisplayEmail');
    
    if (profileDisplayName) profileDisplayName.textContent = user.fullName || 'User';
    if (profileDisplayEmail) profileDisplayEmail.textContent = user.email || '';
    
    // Update form fields - split full name into first and last
    const nameParts = (user.fullName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const studentIdInput = document.getElementById('studentId');
    
    if (firstNameInput) firstNameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phoneNumber || '';
    if (studentIdInput) studentIdInput.value = user.studentId || '';
    
    // Update member since date
    const memberSinceDate = document.getElementById('memberSinceDate');
    if (memberSinceDate && user.createdAt) {
      const date = new Date(user.createdAt);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      memberSinceDate.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showNotification('Failed to load profile data', 'error');
  }
}

// Load profile data when page loads
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Change Avatar Button
const changeAvatarBtn = document.getElementById('changeAvatarBtn')
if (changeAvatarBtn) {
  changeAvatarBtn.addEventListener('click', () => {
    // Create a hidden file input
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB')
          return
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file')
          return
        }
        
        // Read and display the image
        const reader = new FileReader()
        reader.onload = (event) => {
          // In a real app, you would upload to a server
          // For now, just show a success message
          showNotification('Avatar updated successfully!', 'success')
          
          // Optionally, you could store the image data URL in localStorage
          // localStorage.setItem('userAvatar', event.target.result)
        }
        reader.readAsDataURL(file)
      }
    })
    
    // Trigger the file input
    fileInput.click()
  })
}

// Personal Information Form
const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn')
const personalInfoForm = document.getElementById('personalInfoForm')
const personalInfoActions = document.getElementById('personalInfoActions')
const cancelPersonalInfoBtn = document.getElementById('cancelPersonalInfoBtn')

// Form fields
const firstNameInput = document.getElementById('firstName')
const lastNameInput = document.getElementById('lastName')
const emailInput = document.getElementById('email')
const phoneInput = document.getElementById('phone')
const studentIdInput = document.getElementById('studentId')

// Store original values
let originalPersonalInfo = {}

// Enable editing of personal information
if (editPersonalInfoBtn) {
  editPersonalInfoBtn.addEventListener('click', () => {
    // Store original values
    originalPersonalInfo = {
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
      phone: phoneInput.value
    }

    // Enable only name and phone inputs (email and student ID are not editable)
    firstNameInput.disabled = false
    lastNameInput.disabled = false
    phoneInput.disabled = false

    // Show action buttons
    personalInfoActions.classList.remove('hidden')
    editPersonalInfoBtn.style.display = 'none'
  })
}

// Cancel personal info editing
if (cancelPersonalInfoBtn) {
  cancelPersonalInfoBtn.addEventListener('click', () => {
    // Restore original values
    firstNameInput.value = originalPersonalInfo.firstName
    lastNameInput.value = originalPersonalInfo.lastName
    phoneInput.value = originalPersonalInfo.phone

    // Disable inputs
    firstNameInput.disabled = true
    lastNameInput.disabled = true
    phoneInput.disabled = true

    // Hide action buttons
    personalInfoActions.classList.add('hidden')
    editPersonalInfoBtn.style.display = 'inline-flex'
  })
}

// Save personal information
if (personalInfoForm) {
  personalInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) {
      showNotification('First name and last name are required', 'error')
      return
    }

    if (!phoneInput.value.trim()) {
      showNotification('Phone number is required', 'error')
      return
    }

    // Combine first and last name
    const fullName = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`
    
    try {
      const response = await fetch('/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: fullName,
          phoneNumber: phoneInput.value.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update display name
      const profileDisplayName = document.getElementById('profileDisplayName')
      if (profileDisplayName) profileDisplayName.textContent = fullName

      // Disable inputs
      firstNameInput.disabled = true
      lastNameInput.disabled = true
      emailInput.disabled = true
      phoneInput.disabled = true
      studentIdInput.disabled = true

      // Hide action buttons
      personalInfoActions.classList.add('hidden')
      editPersonalInfoBtn.style.display = 'inline-flex'

      // Show success message
      showNotification('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification(error.message || 'Failed to update profile', 'error')
    }
  })
}

// Password Change Form
const editPasswordBtn = document.getElementById('editPasswordBtn')
const passwordForm = document.getElementById('passwordForm')
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn')

if (editPasswordBtn) {
  editPasswordBtn.addEventListener('click', () => {
    passwordForm.classList.remove('hidden')
    editPasswordBtn.style.display = 'none'
  })
}

if (cancelPasswordBtn) {
  cancelPasswordBtn.addEventListener('click', () => {
    passwordForm.classList.add('hidden')
    passwordForm.reset()
    editPasswordBtn.style.display = 'inline-flex'
  })
}

if (passwordForm) {
  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const currentPassword = document.getElementById('currentPassword').value
    const newPassword = document.getElementById('newPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('All password fields are required.')
      return
    }

    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }

    // In a real app, this would be an API call
    // For now, just simulate success
    showNotification('Password updated successfully!', 'success')

    // Reset form
    passwordForm.reset()
    passwordForm.classList.add('hidden')
    editPasswordBtn.style.display = 'inline-flex'
  })
}

// Notification Settings
const emailNotificationsToggle = document.getElementById('emailNotifications')
const smsNotificationsToggle = document.getElementById('smsNotifications')
const marketingEmailsToggle = document.getElementById('marketingEmails')

// Save notification settings when changed
const saveNotificationSettings = () => {
  const settings = {
    emailNotifications: emailNotificationsToggle.checked,
    smsNotifications: smsNotificationsToggle.checked,
    marketingEmails: marketingEmailsToggle.checked
  }
  localStorage.setItem('notificationSettings', JSON.stringify(settings))
}

if (emailNotificationsToggle) {
  emailNotificationsToggle.addEventListener('change', saveNotificationSettings)
}

if (smsNotificationsToggle) {
  smsNotificationsToggle.addEventListener('change', saveNotificationSettings)
}

if (marketingEmailsToggle) {
  marketingEmailsToggle.addEventListener('change', saveNotificationSettings)
}

// Delete Account Modal
const deleteAccountBtn = document.getElementById('deleteAccountBtn')
const deleteAccountModal = document.getElementById('deleteAccountModal')
const closeDeleteModal = document.getElementById('closeDeleteModal')
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn')
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')
const confirmDeleteInput = document.getElementById('confirmDeleteInput')

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', () => {
    deleteAccountModal.classList.remove('hidden')
    confirmDeleteInput.value = ''
    confirmDeleteBtn.disabled = true
  })
}

if (closeDeleteModal) {
  closeDeleteModal.addEventListener('click', () => {
    deleteAccountModal.classList.add('hidden')
  })
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', () => {
    deleteAccountModal.classList.add('hidden')
  })
}

// Enable delete button only when "DELETE" is typed
if (confirmDeleteInput) {
  confirmDeleteInput.addEventListener('input', (e) => {
    confirmDeleteBtn.disabled = e.target.value !== 'DELETE'
  })
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    // In a real app, this would be an API call
    alert('Account deletion would be processed here. For demo purposes, we will not delete the account.')
    deleteAccountModal.classList.add('hidden')
    
    // Optionally redirect to home page
    // localStorage.clear()
    // window.location.href = '../landing_page/index.html'
  })
}

// Close modal when clicking outside
if (deleteAccountModal) {
  deleteAccountModal.addEventListener('click', (e) => {
    if (e.target === deleteAccountModal) {
      deleteAccountModal.classList.add('hidden')
    }
  })
}

// Initialize Page Data
const initializeProfileData = () => {
  // Load user profile from localStorage
  const savedProfile = localStorage.getItem('userProfile')
  if (savedProfile) {
    const profile = JSON.parse(savedProfile)
    firstNameInput.value = profile.firstName
    lastNameInput.value = profile.lastName
    emailInput.value = profile.email
    phoneInput.value = profile.phone || ''
    studentIdInput.value = profile.studentId || ''
  }

  // Load notification settings
  const savedSettings = localStorage.getItem('notificationSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    emailNotificationsToggle.checked = settings.emailNotifications !== false
    smsNotificationsToggle.checked = settings.smsNotifications || false
    marketingEmailsToggle.checked = settings.marketingEmails || false
  }

  // Update display name and email
  updateDisplayName()

  // Load booking stats
  loadBookingStats()
}

// Update display name in profile card
const updateDisplayName = () => {
  const profileDisplayName = document.getElementById('profileDisplayName')
  const profileDisplayEmail = document.getElementById('profileDisplayEmail')

  const firstName = firstNameInput.value.trim()
  const lastName = lastNameInput.value.trim()
  const email = emailInput.value.trim()

  if (profileDisplayName) {
    profileDisplayName.textContent = `${firstName} ${lastName}`
  }

  if (profileDisplayEmail) {
    profileDisplayEmail.textContent = email
  }
}

// Load booking statistics
const loadBookingStats = () => {
  const totalBookingsCount = document.getElementById('totalBookingsCount')
  const memberSinceDate = document.getElementById('memberSinceDate')

  // Get bookings from localStorage
  const bookings = JSON.parse(localStorage.getItem('bookings') || '[]')
  
  if (totalBookingsCount) {
    totalBookingsCount.textContent = bookings.length
  }

  // Set member since date (in a real app, this would come from the backend)
  if (memberSinceDate) {
    const joinDate = localStorage.getItem('memberSince') || 'Jan 2025'
    memberSinceDate.textContent = joinDate
  }
}

// Utility Functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const showNotification = (message, type = 'success') => {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    top: 5rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 1001;
    animation: slideIn 0.3s ease;
  `

  // Add to document
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Add CSS for notification animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfileData)
