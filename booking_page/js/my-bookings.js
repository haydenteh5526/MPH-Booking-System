// My Bookings page functionality
class BookingsManager {
  constructor() {
    this.bookings = []
    this.pendingCancelBooking = null
    this.init()
  }

  init() {
    // Check for success message from payment
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      this.showSuccessBanner()
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Load bookings (now async)
    this.loadBookings().then(() => {
      this.displayBookings()
    })
  }

  showSuccessBanner() {
    const banner = document.getElementById('successBanner')
    if (banner) {
      banner.style.display = 'flex'
      
      // Scroll to top to ensure banner is visible
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Auto hide after 8 seconds
      setTimeout(() => {
        banner.style.animation = 'slideUpOut 0.4s ease'
        setTimeout(() => {
          banner.style.display = 'none'
          banner.style.animation = ''
        }, 400)
      }, 8000)
    }
  }

  async loadBookings() {
    try {
      // Fetch bookings from server
      const response = await fetch('/bookings/my-bookings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }
      
      const data = await response.json();
      // Filter out cancelled bookings - only show active bookings
      this.bookings = (data.bookings || []).filter(booking => !booking.cancelled);
      
      // Also sync with localStorage for offline access
      localStorage.setItem('userBookings', JSON.stringify(this.bookings));
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback to localStorage if server fetch fails
      const bookingsData = localStorage.getItem('userBookings');
      this.bookings = bookingsData ? JSON.parse(bookingsData) : [];
      // Filter out cancelled bookings from localStorage too
      this.bookings = this.bookings.filter(booking => !booking.cancelled);
    }
  }

  displayBookings() {
    const container = document.getElementById('bookingsContainer')
    const emptyState = document.getElementById('emptyState')

    if (!container) return

    if (this.bookings.length === 0) {
      // Remove any existing booking grids
      const existingGrid = container.querySelector('.bookings-grid')
      if (existingGrid) {
        existingGrid.remove()
      }
      
      // Show empty state if it exists, otherwise create it
      let emptyStateElement = document.getElementById('emptyState')
      if (emptyStateElement) {
        emptyStateElement.style.display = 'flex'
      } else {
        // Recreate empty state if it was removed
        container.innerHTML = `
          <div class="bookings-empty" id="emptyState">
            <div class="empty-icon">📅</div>
            <h3>No Bookings Yet</h3>
            <p>You haven't made any reservations yet.</p>
            <a href="booking.html" class="btn-primary">Make a Booking</a>
          </div>
        `
        // Get fresh reference after creating
        emptyStateElement = document.getElementById('emptyState')
        if (emptyStateElement) {
          emptyStateElement.style.display = 'flex'
        }
      }
      return
    }

    // Hide empty state if it exists
    if (emptyState) {
      emptyState.style.display = 'none'
    }

    // Remove empty state from container if it exists
    if (emptyState && emptyState.parentNode === container) {
      emptyState.remove()
    }

    const bookingsHTML = `
      <div class="bookings-grid">
        ${this.bookings.map((booking, index) => this.createBookingCard(booking, index)).join('')}
      </div>
    `

    container.innerHTML = bookingsHTML

    // Attach event listeners to cancel buttons
    this.attachCancelHandlers()
  }

  createBookingCard(booking) {
    // Determine status based on cancelled field
    let statusClass, statusText
    if (booking.cancelled) {
      statusClass = 'status-cancelled'
      statusText = 'Cancelled'
    } else {
      statusClass = 'status-confirmed'
      statusText = 'Confirmed'
    }
    
    // Format sport name
    const sportName = booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)
    
    // Format time display
    let timeDisplay = booking.timeFormatted || booking.time
    if (typeof booking.time === 'string' || typeof booking.time === 'number') {
      const hour = parseInt(booking.time)
      if (!isNaN(hour)) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`
        const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`
        timeDisplay = `${startTime} - ${endTime}`
      }
    }
    
    // Format date
    const bookingDate = new Date(booking.date)
    const dateFormatted = booking.dateFormatted || bookingDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    // Get sport emoji
    const sportEmojis = {
      basketball: '🏀',
      badminton: '🏸',
      volleyball: '🏐'
    }
    const sportEmoji = booking.sportEmoji || sportEmojis[booking.sport.toLowerCase()] || '🏟️'

    return `
      <div class="booking-card ${booking.cancelled ? 'cancelled' : ''}" data-booking-id="${booking._id || booking.id}">
        <div class="booking-card-header">
          <div class="booking-sport">
            <span class="booking-sport-icon">${sportEmoji}</span>
            <span class="booking-sport-name">${sportName}</span>
          </div>
          <span class="booking-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="booking-card-body">
          <div class="booking-info-row">
            <span class="booking-info-icon">🏟️</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Court</span>
              <span class="booking-info-value">${booking.court || booking.courtName}</span>
            </div>
          </div>
          
          <div class="booking-info-row">
            <span class="booking-info-icon">📅</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Date</span>
              <span class="booking-info-value">${dateFormatted}</span>
            </div>
          </div>
          
          <div class="booking-info-row">
            <span class="booking-info-icon">⏰</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Time</span>
              <span class="booking-info-value">${timeDisplay}</span>
            </div>
          </div>
          
          <div class="booking-info-row">
            <span class="booking-info-icon">⏳</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Duration</span>
              <span class="booking-info-value">${booking.duration} ${booking.duration > 1 ? 'hours' : 'hour'}</span>
            </div>
          </div>
          
          <div class="booking-info-row booking-info-row-price">
            <span class="booking-info-icon">💰</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Total Price</span>
              <span class="booking-info-value booking-price">€${booking.totalPrice}</span>
            </div>
          </div>
        </div>
        
        <div class="booking-card-footer">
          ${booking.cancelled ? `
            <button class="btn-remove-booking" data-booking-id="${booking._id || booking.id}">
              Remove Booking
            </button>
          ` : `
            <button class="btn-cancel-booking" data-booking-id="${booking._id || booking.id}">
              Cancel Booking
            </button>
          `}
        </div>
      </div>
    `
  }

  attachCancelHandlers() {
    const cancelButtons = document.querySelectorAll('.btn-cancel-booking')
    cancelButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bookingId = e.target.dataset.bookingId
        this.cancelBooking(bookingId)
      })
    })
    
    const removeButtons = document.querySelectorAll('.btn-remove-booking')
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bookingId = e.target.dataset.bookingId
        this.removeBooking(bookingId)
      })
    })
  }

  cancelBooking(bookingId) {
    const booking = this.bookings.find(b => (b._id || b.id) === bookingId)
    if (!booking) return
    
    if (booking.cancelled) {
      alert('This booking has already been cancelled');
      return;
    }

    // Store pending cancellation
    this.pendingCancelBooking = booking

    // Show cancel modal
    this.showCancelModal(booking)
  }
  
  removeBooking(bookingId) {
    if (!confirm('Remove this cancelled booking from your list?')) return;
    
    // Remove booking from array
    this.bookings = this.bookings.filter(b => (b._id || b.id) !== bookingId)
    
    // Update localStorage
    localStorage.setItem('userBookings', JSON.stringify(this.bookings))
    
    // Remove the booking card from DOM with fade-out animation
    const bookingCard = document.querySelector(`[data-booking-id="${bookingId}"]`)
    if (bookingCard) {
      bookingCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      bookingCard.style.opacity = '0'
      bookingCard.style.transform = 'translateY(-10px)'
      setTimeout(() => {
        bookingCard.remove()
        this.displayBookings()
      }, 300)
    }
  }

  showCancelModal(booking) {
    const modal = document.getElementById('cancelModal')
    
    // Populate modal with booking details
    document.getElementById('cancelSportIcon').textContent = booking.sportEmoji
    document.getElementById('cancelSport').textContent = 
      booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)
    document.getElementById('cancelCourt').textContent = booking.courtName
    document.getElementById('cancelDate').textContent = booking.dateFormatted
    document.getElementById('cancelTime').textContent = booking.timeFormatted

    // Show modal
    modal.style.display = 'flex'
    document.body.style.overflow = 'hidden'

    // Setup button handlers
    const noBtn = document.getElementById('cancelModalNoBtn')
    const yesBtn = document.getElementById('cancelModalYesBtn')

    noBtn.onclick = () => this.closeCancelModal()
    yesBtn.onclick = () => this.confirmCancellation()
  }

  closeCancelModal() {
    const modal = document.getElementById('cancelModal')
    modal.style.display = 'none'
    document.body.style.overflow = ''
    this.pendingCancelBooking = null
  }

  async confirmCancellation() {
    if (!this.pendingCancelBooking) return

    const booking = this.pendingCancelBooking
    const bookingId = booking._id || booking.id

    try {
      // Cancel booking in database
      const response = await fetch('/bookings/user-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: bookingId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel booking')
      }
      
      const result = await response.json()
      console.log('Booking cancelled successfully:', result)
      
      // Close modal
      this.closeCancelModal()
      
      // Reload bookings from server (will automatically filter out cancelled)
      await this.loadBookings()
      this.displayBookings()
      
      // Show success banner
      this.showCancellationSuccess()
      
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking: ' + error.message)
      this.closeCancelModal()
    }
  }

  showCancellationSuccess() {
    // Remove any existing success banner first
    const existingBanner = document.querySelector('.cancellation-success-banner')
    if (existingBanner) {
      existingBanner.remove()
    }

    // Create a prominent success banner matching the payment success style
    const banner = document.createElement('div')
    banner.className = 'success-banner cancellation-success-banner'
    banner.style.cssText = 'display: flex; margin-bottom: 2rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, hsl(142, 76%, 96%), hsl(142, 76%, 98%)); border: 2px solid hsl(142, 76%, 40%); border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); animation: slideDown 0.3s ease-out;'
    banner.innerHTML = `
      <div class="success-banner-content" style="display: flex; align-items: center; gap: 1rem; width: 100%;">
        <svg class="success-banner-icon" viewBox="0 0 24 24" fill="none" stroke="hsl(142, 76%, 30%)" stroke-width="2" style="width: 2.5rem; height: 2.5rem; flex-shrink: 0;">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
        <div>
          <h3 class="success-banner-title" style="margin: 0 0 0.25rem 0; color: hsl(142, 76%, 30%); font-size: 1.125rem; font-weight: 600;">Booking Cancelled Successfully</h3>
          <p class="success-banner-text" style="margin: 0; color: hsl(142, 76%, 25%); font-size: 0.9375rem;">Your booking has been cancelled. Confirmation email sent.</p>
        </div>
      </div>
    `
    
    const bookingsContainer = document.getElementById('bookingsContainer')
    
    // Insert banner before bookings container
    if (bookingsContainer && bookingsContainer.parentNode) {
      bookingsContainer.parentNode.insertBefore(banner, bookingsContainer)
    } else if (container) {
      // Fallback: insert after page header
      const pageHeader = container.querySelector('.page-header')
      if (pageHeader) {
        container.insertBefore(banner, pageHeader.nextSibling)
      } else {
        container.insertBefore(banner, container.firstChild)
      }
    }
    
    // Auto remove after 6 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.animation = 'slideUpOut 0.3s ease-out'
        setTimeout(() => {
          banner.remove()
        }, 300)
      }
    }, 6000)
  }
}

// Initialize bookings manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new BookingsManager()
})

