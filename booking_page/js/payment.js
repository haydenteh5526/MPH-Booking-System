// Payment page functionality
class PaymentHandler {
  constructor() {
    this.bookingData = null
    this.init()
  }

  init() {
    // Load booking data from localStorage
    const pendingBooking = localStorage.getItem('pendingBooking')
    
    if (!pendingBooking) {
      // No booking found, redirect to bookings page
      alert('No pending booking found. Please make a booking first.')
      window.location.href = 'booking.html'
      return
    }

    this.bookingData = JSON.parse(pendingBooking)
    this.displayBookingSummary()
    this.setupFormHandlers()
  }

  displayBookingSummary() {
    const { sportEmoji, sport, courtName, dateFormatted, timeFormatted, duration, totalPrice } = this.bookingData

    document.getElementById('summaryIcon').textContent = sportEmoji
    document.getElementById('summarySport').textContent = 
      sport.charAt(0).toUpperCase() + sport.slice(1)
    document.getElementById('summaryCourt').textContent = courtName
    document.getElementById('summaryDate').textContent = dateFormatted
    document.getElementById('summaryTime').textContent = timeFormatted
    document.getElementById('summaryDuration').textContent = 
      `${duration} ${duration > 1 ? 'hours' : 'hour'}`
    document.getElementById('summaryPrice').textContent = `€${totalPrice}`
    document.getElementById('payAmount').textContent = totalPrice
  }

  setupFormHandlers() {
    const form = document.getElementById('paymentForm')
    const cardNumberInput = document.getElementById('cardNumber')
    const expiryInput = document.getElementById('expiryDate')
    const cvvInput = document.getElementById('cvv')

    // Format card number with spaces
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s/g, '')
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value
      e.target.value = formattedValue
    })

    // Format expiry date
    expiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4)
      }
      e.target.value = value
    })

    // Only allow numbers for CVV
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '')
    })

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.processPayment()
    })
  }

  processPayment() {
    const payBtn = document.getElementById('payBtn')
    const btnText = payBtn.querySelector('span')
    const originalText = btnText.innerHTML

    // Show loading state
    payBtn.disabled = true
    btnText.textContent = 'Processing...'

    // Simulate payment processing
    setTimeout(() => {
      // Update booking status
      this.bookingData.status = 'confirmed'
      this.bookingData.paymentDate = new Date().toISOString()
      this.bookingData.email = document.getElementById('email').value

      // Save to user's bookings
      this.saveBooking()

      // Clear pending booking
      localStorage.removeItem('pendingBooking')

      // Redirect to success page
      window.location.href = 'my-bookings.html?success=true'
    }, 2000)
  }

  saveBooking() {
    // Get existing bookings from localStorage
    let bookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
    
    // Add new booking
    bookings.unshift(this.bookingData)
    
    // Save back to localStorage
    localStorage.setItem('userBookings', JSON.stringify(bookings))
  }
}

// Initialize payment handler when page loads
document.addEventListener('DOMContentLoaded', () => {
  new PaymentHandler()
})

