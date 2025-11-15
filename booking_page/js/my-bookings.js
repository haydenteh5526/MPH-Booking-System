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

    // Load bookings
    this.loadBookings()
    this.displayBookings()
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

  loadBookings() {
    const bookingsData = localStorage.getItem('userBookings')
    this.bookings = bookingsData ? JSON.parse(bookingsData) : []
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
    const statusClass = booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending'
    const statusText = booking.status === 'confirmed' ? 'Confirmed' : 'Pending'

    return `
      <div class="booking-card" data-booking-id="${booking.id}">
        <div class="booking-card-header">
          <div class="booking-sport">
            <span class="booking-sport-icon">${booking.sportEmoji}</span>
            <span class="booking-sport-name">${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}</span>
          </div>
          <span class="booking-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="booking-card-body">
          <div class="booking-info-row">
            <span class="booking-info-icon">🏟️</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Court</span>
              <span class="booking-info-value">${booking.courtName}</span>
            </div>
          </div>
          
          <div class="booking-info-row">
            <span class="booking-info-icon">📅</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Date</span>
              <span class="booking-info-value">${booking.dateFormatted}</span>
            </div>
          </div>
          
          <div class="booking-info-row">
            <span class="booking-info-icon">⏰</span>
            <div class="booking-info-content">
              <span class="booking-info-label">Time</span>
              <span class="booking-info-value">${booking.timeFormatted}</span>
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
          <button class="btn-cancel-booking" data-booking-id="${booking.id}">
            Cancel Booking
          </button>
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
  }

  cancelBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId)
    if (!booking) return

    // Store pending cancellation
    this.pendingCancelBooking = booking

    // Show cancel modal
    this.showCancelModal(booking)
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
    const cancelledBookingId = booking.id

    try {
      // Send cancellation email
      const response = await fetch('/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: booking.email,
          sport: booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1),
          courtName: booking.courtName,
          dateFormatted: booking.dateFormatted,
          timeFormatted: booking.timeFormatted,
          duration: booking.duration,
          totalPrice: booking.totalPrice,
          confirmationNumber: booking.confirmationNumber
        })
      })

      if (response.ok) {
        console.log('Cancellation email sent successfully')
      } else {
        console.warn('Failed to send cancellation email, but proceeding with cancellation')
      }
    } catch (error) {
      console.error('Error sending cancellation email:', error)
      // Continue with cancellation even if email fails
    }

    // Remove booking from array
    this.bookings = this.bookings.filter(b => b.id !== cancelledBookingId)
    
    // Update localStorage
    localStorage.setItem('userBookings', JSON.stringify(this.bookings))
    
    // Close modal
    this.closeCancelModal()
    
    // Remove the booking card from DOM with fade-out animation
    const bookingCard = document.querySelector(`[data-booking-id="${cancelledBookingId}"]`)
    if (bookingCard) {
      bookingCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      bookingCard.style.opacity = '0'
      bookingCard.style.transform = 'translateY(-10px)'
      setTimeout(() => {
        bookingCard.remove()
        // Refresh display after animation completes (will handle empty state if no bookings)
        this.displayBookings()
      }, 300)
    } else {
      // If card not found, refresh immediately
      this.displayBookings()
    }
    
    // Show success message
    this.showCancellationSuccess()
  }

  showCancellationSuccess() {
    // Remove any existing success banner first
    const existingBanner = document.querySelector('.cancellation-success-banner')
    if (existingBanner) {
      existingBanner.remove()
    }

    // Create a prominent success banner
    const banner = document.createElement('div')
    banner.className = 'success-banner cancellation-success-banner'
    banner.style.marginBottom = '2rem'
    banner.style.animation = 'slideDown 0.3s ease-out'
    banner.innerHTML = `
      <div class="success-banner-content">
        <svg class="success-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #10b981;">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
        <div>
          <h3 class="success-banner-title">Booking Cancelled Successfully</h3>
          <p class="success-banner-text">Your booking has been cancelled and removed. Refund will be processed within 3-5 business days.</p>
        </div>
      </div>
    `
    
    const container = document.querySelector('.content-container')
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

