// Payment page functionality
class PaymentHandler {
  constructor() {
    this.bookingData = null
    this.formSubmitted = false
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
    const cancelBtn = document.getElementById('cancelBtn')

    // Prevent navigation away from page
    window.addEventListener('beforeunload', (e) => {
      if (!this.formSubmitted) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    })

    // Handle cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to cancel this payment? Your booking will not be confirmed.')
        if (confirmed) {
          this.formSubmitted = true
          localStorage.removeItem('pendingBooking')
          window.location.href = 'booking.html'
        }
      })
    }

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
    const email = document.getElementById('email').value

    // Show loading state
    payBtn.disabled = true
    btnText.textContent = 'Processing...'

    // Simulate payment processing and send receipt
    setTimeout(async () => {
      try {
        // Send booking confirmation and receipt email
        const response = await fetch('/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: email,
            sport: this.bookingData.sport,
            courtName: this.bookingData.courtName,
            dateFormatted: this.bookingData.dateFormatted,
            timeFormatted: this.bookingData.timeFormatted,
            duration: this.bookingData.duration,
            totalPrice: this.bookingData.totalPrice
          })
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Receipt error:', data)
          throw new Error(data.error || 'Failed to send receipt')
        }

        console.log('Receipt sent successfully:', data)

        // Update booking status
        this.bookingData.status = 'confirmed'
        this.bookingData.paymentDate = data.paymentDate
        this.bookingData.email = email
        this.bookingData.confirmationNumber = data.confirmationNumber

        // Save to user's bookings (only save once here)
        this.saveBooking()

        // Clear pending booking
        localStorage.removeItem('pendingBooking')

        // Mark as submitted to prevent navigation warning
        this.formSubmitted = true

        // Redirect to My Bookings page with success flag
        window.location.href = 'my-bookings.html?success=true'
      } catch (error) {
        console.error('Payment error:', error)
        
        // Show error but still complete the booking
        alert('Booking confirmed! However, the receipt email may not have been sent. Please check your email or contact support if needed.')
        
        // Update booking status
        this.bookingData.status = 'confirmed'
        this.bookingData.paymentDate = new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        this.bookingData.email = email
        this.bookingData.confirmationNumber = `MPH${Date.now().toString(36).toUpperCase()}`
        
        // Save booking
        this.saveBooking()
        localStorage.removeItem('pendingBooking')
        this.formSubmitted = true
        
        // Redirect to My Bookings page
        window.location.href = 'my-bookings.html?success=true'
      }
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

