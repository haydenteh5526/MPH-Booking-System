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
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        banner.style.display = 'none'
      }, 5000)
    }
  }

  loadBookings() {
    const bookingsData = localStorage.getItem('userBookings')
    this.bookings = bookingsData ? JSON.parse(bookingsData) : []
  }

  displayBookings() {
    const container = document.getElementById('bookingsContainer')
    const emptyState = document.getElementById('emptyState')

    if (this.bookings.length === 0) {
      emptyState.style.display = 'flex'
      return
    }

    emptyState.style.display = 'none'

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

  confirmCancellation() {
    if (!this.pendingCancelBooking) return

    // Remove booking from array
    this.bookings = this.bookings.filter(b => b.id !== this.pendingCancelBooking.id)
    
    // Update localStorage
    localStorage.setItem('userBookings', JSON.stringify(this.bookings))
    
    // Close modal
    this.closeCancelModal()
    
    // Refresh display
    this.displayBookings()
    
    // Show success message
    this.showCancellationSuccess()
  }

  showCancellationSuccess() {
    // Create a temporary success banner
    const banner = document.createElement('div')
    banner.className = 'success-banner'
    banner.style.marginBottom = '2rem'
    banner.innerHTML = `
      <div class="success-banner-content">
        <svg class="success-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div>
          <h3 class="success-banner-title">Booking Cancelled</h3>
          <p class="success-banner-text">Your booking has been cancelled. Refund will be processed within 3-5 business days.</p>
        </div>
      </div>
    `
    
    const container = document.querySelector('.content-container')
    const pageHeader = container.querySelector('.page-header')
    container.insertBefore(banner, pageHeader.nextSibling)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      banner.remove()
    }, 5000)
  }
}

// Initialize bookings manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new BookingsManager()
})

