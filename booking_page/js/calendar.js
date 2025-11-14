// Calendar functionality for MPH Booking System - Horizontal Search Bar
class BookingCalendar {
  constructor() {
    this.selectedSport = null
    this.selectedSportEmoji = null
    this.selectedDate = null
    this.selectedTimeHour = null
    this.selectedPeriod = "AM" // Default to AM to match the HTML default
    this.selectedDuration = null
    this.currentWeekOffset = 0

    // Court availability by sport (Student-friendly pricing)
    this.sportCourts = {
      basketball: [
        { id: "basketball-half-1", name: "Half Court 1 (Courts 1-2)", price: 8 },
        { id: "basketball-half-2", name: "Half Court 2 (Courts 3-4)", price: 8 },
        { id: "basketball-full", name: "Full Court (Courts 1-4)", price: 15 },
      ],
      badminton: [
        { id: "badminton-1", name: "Court 1", price: 5 },
        { id: "badminton-2", name: "Court 2", price: 5 },
        { id: "badminton-3", name: "Court 3", price: 5 },
        { id: "badminton-4", name: "Court 4", price: 5 },
      ],
      volleyball: [
        { id: "volleyball-half-1", name: "Half Court 1 (Courts 1-2)", price: 10 },
        { id: "volleyball-half-2", name: "Half Court 2 (Courts 3-4)", price: 10 },
      ],
    }

    // Court conflict mapping based on MPH layout
    // Courts 1-2 on one side, Courts 3-4 on the other side
    this.courtConflicts = {
      // Basketball Full Court blocks everything
      "basketball-full": [
        "basketball-half-1",
        "basketball-half-2",
        "badminton-1",
        "badminton-2",
        "badminton-3",
        "badminton-4",
        "volleyball-half-1",
        "volleyball-half-2",
      ],
      // Basketball Half Court 1 (Courts 1-2) blocks courts 1-2
      "basketball-half-1": [
        "basketball-full",
        "badminton-1",
        "badminton-2",
        "volleyball-half-1",
      ],
      // Basketball Half Court 2 (Courts 3-4) blocks courts 3-4
      "basketball-half-2": [
        "basketball-full",
        "badminton-3",
        "badminton-4",
        "volleyball-half-2",
      ],
      // Badminton Court 1 conflicts with basketball/volleyball using courts 1-2
      "badminton-1": [
        "basketball-full",
        "basketball-half-1",
        "volleyball-half-1",
      ],
      // Badminton Court 2 conflicts with basketball/volleyball using courts 1-2
      "badminton-2": [
        "basketball-full",
        "basketball-half-1",
        "volleyball-half-1",
      ],
      // Badminton Court 3 conflicts with basketball/volleyball using courts 3-4
      "badminton-3": [
        "basketball-full",
        "basketball-half-2",
        "volleyball-half-2",
      ],
      // Badminton Court 4 conflicts with basketball/volleyball using courts 3-4
      "badminton-4": [
        "basketball-full",
        "basketball-half-2",
        "volleyball-half-2",
      ],
      // Volleyball Half Court 1 (Courts 1-2) blocks courts 1-2
      "volleyball-half-1": [
        "basketball-full",
        "basketball-half-1",
        "badminton-1",
        "badminton-2",
      ],
      // Volleyball Half Court 2 (Courts 3-4) blocks courts 3-4
      "volleyball-half-2": [
        "basketball-full",
        "basketball-half-2",
        "badminton-3",
        "badminton-4",
      ],
    }

    // Initialize hours and booking data
    this.hours = this.generateHours()
    this.bookingData = this.generateMockData()

    this.init()
  }

  init() {
    this.attachFormListeners()
    this.hideCalendar()
    this.setMinDate()
    this.setupClickOutside()
  }

  setMinDate() {
    const dateInput = document.getElementById("dateSelect")
    if (dateInput) {
      const today = new Date()
      const minDate = today.toISOString().split("T")[0]
      dateInput.setAttribute("min", minDate)
    }
  }

  attachFormListeners() {
    // Sport Section
    const sportSection = document.getElementById("sportSection")
    const sportDropdown = document.getElementById("sportDropdown")
    const sportOptions = document.querySelectorAll(".sport-option")

    if (sportSection) {
      sportSection.addEventListener("click", (e) => {
        e.stopPropagation()
        if (!e.target.closest(".clear-btn")) {
          this.toggleDropdown("sport")
        }
      })
    }

    // Prevent sport dropdown from closing when clicking inside it
    if (sportDropdown) {
      sportDropdown.addEventListener("click", (e) => {
        e.stopPropagation()
      })
    }

    sportOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation()
        const sport = option.dataset.sport
        const emoji = option.dataset.emoji
        this.selectSport(sport, emoji)
      })
    })

    // When Section
    const whenSection = document.getElementById("whenSection")
    const whenDropdown = document.getElementById("whenDropdown")
    
    if (whenSection) {
      whenSection.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleDropdown("when")
      })
    }

    // Prevent when dropdown from closing when clicking inside it
    if (whenDropdown) {
      whenDropdown.addEventListener("click", (e) => {
        e.stopPropagation()
      })
    }

    // Form inputs
    const dateSelect = document.getElementById("dateSelect")
    const timeHourSelect = document.getElementById("timeHourSelect")
    const periodSelect = document.getElementById("periodSelect")
    const durationSelect = document.getElementById("durationSelect")
    const searchBtn = document.getElementById("searchBtn")

    if (dateSelect) {
      // Make entire input field clickable to open calendar
      dateSelect.addEventListener("click", (e) => {
        e.stopPropagation()
        // Focus the input to ensure calendar opens
        dateSelect.focus()
        // Trigger showPicker if available (for better browser support)
        if (dateSelect.showPicker) {
          try {
            dateSelect.showPicker()
          } catch (err) {
            // Fallback: just focus, browser will handle it
            dateSelect.focus()
          }
        }
      })
      
      dateSelect.addEventListener("change", (e) => {
        this.selectedDate = e.target.value
        this.updateWhenDisplay()
        this.checkFormValidity()
      })
    }

    if (timeHourSelect) {
      timeHourSelect.addEventListener("change", (e) => {
        this.selectedTimeHour = e.target.value
        this.updateWhenDisplay()
        this.checkFormValidity()
      })
  }

    if (periodSelect) {
      periodSelect.addEventListener("change", (e) => {
        this.selectedPeriod = e.target.value
        this.updateWhenDisplay()
        this.checkFormValidity()
      })
    }

    if (durationSelect) {
      durationSelect.addEventListener("change", (e) => {
        this.selectedDuration = e.target.value
        this.updateWhenDisplay()
        this.checkFormValidity()
      })
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        this.performSearch()
      })
    }
  }

  setupClickOutside() {
    document.addEventListener("click", (e) => {
      const sportDropdown = document.getElementById("sportDropdown")
      const whenDropdown = document.getElementById("whenDropdown")

      // Close dropdowns when clicking outside (stopPropagation handles inside clicks)
      if (sportDropdown && sportDropdown.style.display === "block") {
        sportDropdown.style.display = "none"
      }

      if (whenDropdown && whenDropdown.style.display === "block") {
        whenDropdown.style.display = "none"
      }
    })
  }

  toggleDropdown(type) {
    const sportDropdown = document.getElementById("sportDropdown")
    const whenDropdown = document.getElementById("whenDropdown")

    if (type === "sport") {
      const isVisible = sportDropdown.style.display === "block"
      sportDropdown.style.display = isVisible ? "none" : "block"
      whenDropdown.style.display = "none"
    } else if (type === "when") {
      const isVisible = whenDropdown.style.display === "block"
      whenDropdown.style.display = isVisible ? "none" : "block"
      sportDropdown.style.display = "none"
    }
  }

  selectSport(sport, emoji) {
    this.selectedSport = sport
    this.selectedSportEmoji = emoji

    const sportValue = document.getElementById("sportValue")
    const sportDropdown = document.getElementById("sportDropdown")

    const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)

    sportValue.innerHTML = `
      <div class="sport-selected">
        <span>${emoji} ${sportName}</span>
        <button class="clear-btn" onclick="bookingCalendar.clearSport(event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `

    sportDropdown.style.display = "none"
    this.checkFormValidity()
  }

  clearSport(event) {
    event.stopPropagation()
    this.selectedSport = null
    this.selectedSportEmoji = null

    const sportValue = document.getElementById("sportValue")
    sportValue.innerHTML = '<span class="placeholder">Select a sport</span>'

    // Reset all selections
    this.selectedDate = null
    this.selectedTimeHour = null
    this.selectedPeriod = "AM" // Reset to AM (default)
    this.selectedDuration = null

    // Reset form
    const dateSelect = document.getElementById("dateSelect")
    const timeHourSelect = document.getElementById("timeHourSelect")
    const periodSelect = document.getElementById("periodSelect")
    const durationSelect = document.getElementById("durationSelect")
    
    if (dateSelect) dateSelect.value = ""
    if (timeHourSelect) timeHourSelect.value = ""
    if (periodSelect) periodSelect.value = "AM"
    if (durationSelect) durationSelect.value = ""

    // Reset when display
    const whenValue = document.getElementById("whenValue")
    if (whenValue) {
      whenValue.innerHTML = '<span class="placeholder">Pick a date</span>'
    }

    // Hide calendar and show featured courts
    this.hideCalendar()

    this.checkFormValidity()
  }

  updateWhenDisplay() {
    const whenValue = document.getElementById("whenValue")

    if (this.selectedDate) {
      const dateObj = new Date(this.selectedDate + "T00:00:00")
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      let displayText = formattedDate

      if (this.selectedTimeHour && this.selectedPeriod && this.selectedDuration) {
        const timeHour = Number.parseInt(this.selectedTimeHour)
        displayText += ` • ${timeHour}:00 ${this.selectedPeriod} • ${this.selectedDuration}h`
      }

      whenValue.innerHTML = `<span>${displayText}</span>`
    } else {
      whenValue.innerHTML = '<span class="placeholder">Pick a date</span>'
    }
  }

  checkFormValidity() {
    const searchBtn = document.getElementById("searchBtn")
    const isValid =
      this.selectedSport &&
      this.selectedDate &&
      this.selectedTimeHour &&
      this.selectedPeriod &&
      this.selectedDuration

    if (searchBtn) {
      searchBtn.disabled = !isValid
    }
  }

  get24HourTime() {
    if (!this.selectedTimeHour || !this.selectedPeriod) return null

    let hour = Number.parseInt(this.selectedTimeHour)

    // Convert to 24-hour format
    if (this.selectedPeriod === "PM" && hour !== 12) {
      hour += 12
    } else if (this.selectedPeriod === "AM" && hour === 12) {
      hour = 0
    }

    return hour
  }

  performSearch() {
    const hour24 = this.get24HourTime()
    if (!this.selectedSport || !this.selectedDate || hour24 === null || !this.selectedDuration) {
      return
    }

    // Close dropdowns
    const whenDropdown = document.getElementById("whenDropdown")
    if (whenDropdown) {
      whenDropdown.style.display = "none"
    }

    // Hide Featured Courts section when showing results
    const featuredSection = document.querySelector(".featured-courts-section")
    if (featuredSection) {
      featuredSection.style.display = "none"
    }

    // Hide the new sections (Booking Tips, Why Book, CTA) when showing results
    const bookingTipsSection = document.querySelector(".booking-tips-section")
    if (bookingTipsSection) {
      bookingTipsSection.style.display = "none"
    }

    const whyBookSection = document.querySelector(".why-book-section")
    if (whyBookSection) {
      whyBookSection.style.display = "none"
    }

    const bookingCtaSection = document.querySelector(".booking-cta-section")
    if (bookingCtaSection) {
      bookingCtaSection.style.display = "none"
    }

    this.showCalendar()
    this.renderAvailableCourts()
  }

  renderAvailableCourts() {
    const calendarContainer = document.getElementById("calendarContainer")
    if (!calendarContainer) return

    this.showLoading()

    setTimeout(() => {
      const availabilityData = this.getCourtAvailability()
      this.displayAvailableCourts(availabilityData)
      this.hideLoading()
    }, 500)
  }

  getCourtAvailability() {
    const courts = this.sportCourts[this.selectedSport] || []
    const startHour = this.get24HourTime()
    const duration = Number.parseInt(this.selectedDuration)
    
    // Generate time slots for display (show a range around selected time)
    const timeSlots = []
    const startDisplay = Math.max(8, startHour - 2) // Show 2 hours before
    const endDisplay = Math.min(22, startHour + duration + 2) // Show 2 hours after
    
    for (let hour = startDisplay; hour <= endDisplay; hour++) {
      timeSlots.push(hour)
    }

    // For each court, check availability for each time slot
    const courtAvailability = courts.map((court) => {
      const slots = timeSlots.map((hour) => {
        const slotData = this.bookingData[this.selectedDate]?.[hour]?.[court.id]
        
        if (!slotData) {
          return { hour, status: "blocked", price: 0 }
      }

        // Check for conflicts
        const conflictCheck = this.checkCourtConflicts(this.selectedDate, hour, court.id)
        
        if (conflictCheck.hasConflict && slotData.status === "available") {
          return { hour, status: "blocked", price: 0 }
        }

        return { 
          hour, 
          status: slotData.status,
          price: slotData.price 
        }
      })

      return {
        ...court,
        slots: slots
      }
    })

    return { courts: courtAvailability, timeSlots }
  }

  displayAvailableCourts(availabilityData) {
    const calendarGrid = document.getElementById("calendarGrid")
    if (!calendarGrid) return

    const { courts, timeSlots } = availabilityData

    if (!courts || courts.length === 0) {
      calendarGrid.innerHTML = `
        <div class="empty-state">
          <p>No courts available for the selected sport.</p>
          <p>Please try a different sport or time.</p>
        </div>
      `
      return
    }

    // Build table HTML
    let tableHTML = `
      <div class="available-courts-section">
        <div class="results-header">
          <h2 class="results-title">Availability</h2>
          <p class="results-subtitle">Select a time slot to complete your booking</p>
        </div>
        
        <div class="availability-table-wrapper">
          <table class="availability-table">
            <thead>
              <tr class="legend-row">
                <th colspan="100%" class="legend-header">
                  <div class="legend">
                    <div class="legend-item">
                      <span class="legend-color legend-available"></span>
                      <span>Available</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color legend-booked"></span>
                      <span>Booked</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color legend-blocked"></span>
                      <span>Blocked</span>
                    </div>
                  </div>
                </th>
              </tr>
              <tr>
                <th class="court-header">Court</th>
    `

    // Add time slot headers
    timeSlots.forEach(hour => {
      const timeStr = this.getTimeLabel(hour)
      tableHTML += `<th class="time-header">${timeStr}</th>`
    })

    tableHTML += `
              </tr>
            </thead>
            <tbody>
    `

    // Add court rows
    courts.forEach(court => {
      tableHTML += `
              <tr class="court-row" data-court-id="${court.id}">
                <td class="court-name-cell">
                  <div class="court-name">${court.name}</div>
                  <div class="court-price">€${court.price}/hr</div>
                </td>
      `

      // Add slot cells
      court.slots.forEach(slot => {
        const statusClass = `slot-${slot.status}`
        const isClickable = slot.status === 'available'
        const clickableClass = isClickable ? 'slot-clickable' : ''
        
        tableHTML += `
                <td class="time-slot ${statusClass} ${clickableClass}" 
                    data-court-id="${court.id}"
                    data-court-name="${court.name}"
                    data-hour="${slot.hour}"
                    data-price="${slot.price}"
                    data-status="${slot.status}">
                  <div class="slot-indicator"></div>
                </td>
        `
      })

      tableHTML += `
              </tr>
      `
    })

    tableHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `

    calendarGrid.innerHTML = tableHTML

    // Attach click listeners to available slots
    const availableSlots = calendarGrid.querySelectorAll('.time-slot.slot-available')
    availableSlots.forEach(slot => {
      slot.addEventListener('click', (e) => {
        const courtId = e.currentTarget.dataset.courtId
        const courtName = e.currentTarget.dataset.courtName
        const hour = Number.parseInt(e.currentTarget.dataset.hour)
        const price = Number.parseFloat(e.currentTarget.dataset.price)
        this.handleSlotBooking(courtId, courtName, hour, price)
      })
    })
  }

  getSportEmoji(sport) {
    const emojis = {
      basketball: "🏀",
      badminton: "🏸",
      volleyball: "🏐",
    }
    return emojis[sport] || "⚽"
  }

  getTimeLabel(hourValue) {
    const hour = Number.parseInt(hourValue)
    const displayHour = hour > 12 ? hour - 12 : hour
    const period = hour >= 12 ? "PM" : "AM"
    return `${displayHour === 0 ? 12 : displayHour}:00 ${period}`
  }

  formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00")
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return `${dayNames[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  handleSlotBooking(courtId, courtName, hour, price) {
    const duration = Number.parseInt(this.selectedDuration)
    const totalPrice = price * duration

    // Store booking data for confirmation
    this.pendingBooking = {
      courtId,
      courtName,
      hour,
      price,
      duration,
      totalPrice
    }

    // Show confirmation modal
    this.showBookingModal()
  }

  showBookingModal() {
    const modal = document.getElementById('bookingModal')
    const { courtName, hour, duration, totalPrice } = this.pendingBooking

    // Populate modal with booking details
    document.getElementById('modalSportIcon').textContent = this.selectedSportEmoji || this.getSportEmoji(this.selectedSport)
    document.getElementById('modalSport').textContent = 
      this.selectedSport.charAt(0).toUpperCase() + this.selectedSport.slice(1)
    document.getElementById('modalCourt').textContent = courtName
    document.getElementById('modalDate').textContent = this.formatDate(this.selectedDate)
    document.getElementById('modalTime').textContent = this.getTimeLabel(hour)
    document.getElementById('modalDuration').textContent = 
      `${duration} ${duration > 1 ? 'hours' : 'hour'}`
    document.getElementById('modalPrice').textContent = `€${totalPrice}`

    // Show modal
    modal.style.display = 'flex'
    document.body.style.overflow = 'hidden' // Prevent background scrolling

    // Setup button handlers
    const cancelBtn = document.getElementById('modalCancelBtn')
    const confirmBtn = document.getElementById('modalConfirmBtn')

    cancelBtn.onclick = () => this.closeBookingModal()
    confirmBtn.onclick = () => this.proceedToPayment()
  }

  closeBookingModal() {
    const modal = document.getElementById('bookingModal')
    modal.style.display = 'none'
    document.body.style.overflow = '' // Restore scrolling
    this.pendingBooking = null
  }

  proceedToPayment() {
    const { courtId, courtName, hour, duration, totalPrice } = this.pendingBooking

    // Create booking object
    const booking = {
      id: Date.now().toString(),
      sport: this.selectedSport,
      sportEmoji: this.selectedSportEmoji || this.getSportEmoji(this.selectedSport),
      courtId: courtId,
      courtName: courtName,
      date: this.selectedDate,
      dateFormatted: this.formatDate(this.selectedDate),
      time: hour,
      timeFormatted: this.getTimeLabel(hour),
      duration: duration,
      totalPrice: totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Store booking in localStorage for payment page
    localStorage.setItem('pendingBooking', JSON.stringify(booking))

    // Also update the availability data
    const startHour = hour
    for (let i = 0; i < duration; i++) {
      const bookingHour = startHour + i
      if (this.bookingData[this.selectedDate]?.[bookingHour]?.[courtId]) {
        this.bookingData[this.selectedDate][bookingHour][courtId].status = "booked"
        this.bookingData[this.selectedDate][bookingHour][courtId].bookedBySport = this.selectedSport
        this.bookingData[this.selectedDate][bookingHour][courtId].bookedCourtId = courtId

        const conflictingCourts = this.courtConflicts[courtId] || []
        conflictingCourts.forEach((conflictCourt) => {
          if (this.bookingData[this.selectedDate]?.[bookingHour]?.[conflictCourt]) {
            this.bookingData[this.selectedDate][bookingHour][conflictCourt].status = "booked"
            this.bookingData[this.selectedDate][bookingHour][conflictCourt].bookedBySport = this.selectedSport
            this.bookingData[this.selectedDate][bookingHour][conflictCourt].bookedCourtId = courtId
          }
        })
      }
    }

    // Redirect to payment page
    window.location.href = 'payment.html'
  }

  showSuccessModal() {
    const modal = document.getElementById('successModal')
    modal.style.display = 'flex'
    document.body.style.overflow = 'hidden'

    const okBtn = document.getElementById('successOkBtn')
    okBtn.onclick = () => {
      modal.style.display = 'none'
      document.body.style.overflow = ''
    }

    // Auto close after 3 seconds
    setTimeout(() => {
      if (modal.style.display === 'flex') {
        modal.style.display = 'none'
        document.body.style.overflow = ''
    }
    }, 3000)
  }

  bookCourt(courtId, totalPrice) {
    const court = this.sportCourts[this.selectedSport].find((c) => c.id === courtId)

    if (!court) return

    const hour24 = this.get24HourTime()

    const confirmed = confirm(
      `Confirm booking?\n\n` +
        `Court: ${court.name}\n` +
        `Sport: ${this.selectedSport.charAt(0).toUpperCase() + this.selectedSport.slice(1)}\n` +
        `Date: ${this.formatDate(this.selectedDate)}\n` +
        `Time: ${this.getTimeLabel(hour24)}\n` +
        `Duration: ${this.selectedDuration} ${this.selectedDuration > 1 ? "hours" : "hour"}\n` +
        `Total Price: €${totalPrice}`,
    )

    if (confirmed) {
      const startHour = hour24
      const duration = Number.parseInt(this.selectedDuration)

      for (let i = 0; i < duration; i++) {
        const hour = startHour + i
        if (this.bookingData[this.selectedDate]?.[hour]?.[courtId]) {
          this.bookingData[this.selectedDate][hour][courtId].status = "booked"

          const conflictingCourts = this.courtConflicts[courtId] || []
          conflictingCourts.forEach((conflictCourt) => {
            if (this.bookingData[this.selectedDate]?.[hour]?.[conflictCourt]) {
              this.bookingData[this.selectedDate][hour][conflictCourt].status = "booked"
      }
    })
        }
      }

      alert("Booking confirmed! Check 'My Bookings' to view your reservations.")
      this.performSearch()
    }
  }

  checkCourtConflicts(date, hour, courtId) {
    const conflictingCourts = this.courtConflicts[courtId] || []

    for (const conflictCourt of conflictingCourts) {
      const booking = this.bookingData[date]?.[hour]?.[conflictCourt]
      if (booking && booking.status === "booked") {
        // Check if the booked court would actually conflict with the current court
        // A court is only blocked if the ORIGINAL booked court conflicts with it
        const originalBookedCourt = booking.bookedCourtId || conflictCourt
        
        // Check if the original booked court conflicts with the current court we're checking
        const originalCourtConflicts = this.courtConflicts[originalBookedCourt] || []
        if (originalCourtConflicts.includes(courtId) || originalBookedCourt === courtId) {
          return {
            hasConflict: true,
            conflictingCourt: conflictCourt,
          }
        }
      }
    }

    return { hasConflict: false }
  }

  generateHours() {
    const hours = []
    for (let i = 8; i <= 22; i++) {
      const hour = i > 12 ? i - 12 : i
      const period = i >= 12 ? "PM" : "AM"
      const displayHour = i === 12 ? 12 : hour
      hours.push({
        value: i,
        label: `${displayHour}:00 ${period}`,
      })
    }
    return hours
  }

  generateMockData() {
    const data = {}
    const allCourts = []

    Object.values(this.sportCourts).forEach((courts) => {
      courts.forEach((court) => allCourts.push(court.id))
    })

    const today = new Date()
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date(today)
      date.setDate(today.getDate() + dayOffset)
      const dateString = date.toISOString().split("T")[0]

      data[dateString] = {}

        this.hours.forEach((hour) => {
        data[dateString][hour.value] = {}

          allCourts.forEach((courtId) => {
            // Set all slots to available (green) by default
            let status = "available"

          let price = 0
          Object.values(this.sportCourts).forEach((courts) => {
            const court = courts.find((c) => c.id === courtId)
            if (court) price = court.price
          })

          data[dateString][hour.value][courtId] = {
              status: status,
              time: hour.label,
            price: price,
            }
        })
      })
    }

    // Load user bookings from localStorage and mark those slots as booked (red)
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
    userBookings.forEach(booking => {
      if (booking.status === 'confirmed') {
        const bookingDate = booking.date
        const startHour = booking.time
        const duration = booking.duration
        const courtId = booking.courtId
        const bookingSport = booking.sport

        // Mark the booked slots as "booked" for the duration
        for (let i = 0; i < duration; i++) {
          const hour = startHour + i
          if (data[bookingDate]?.[hour]?.[courtId]) {
            data[bookingDate][hour][courtId].status = "booked"
            data[bookingDate][hour][courtId].bookedBySport = bookingSport
            data[bookingDate][hour][courtId].bookedCourtId = courtId

            // Also mark conflicting courts as booked
            const conflictingCourts = this.courtConflicts[courtId] || []
            conflictingCourts.forEach(conflictCourt => {
              if (data[bookingDate]?.[hour]?.[conflictCourt]) {
                data[bookingDate][hour][conflictCourt].status = "booked"
                data[bookingDate][hour][conflictCourt].bookedBySport = bookingSport
                data[bookingDate][hour][conflictCourt].bookedCourtId = courtId
              }
            })
          }
        }
      }
    })

    return data
  }

  hideCalendar() {
    const calendarResultsSection = document.querySelector(".calendar-results-section")
    const calendarSection = document.querySelector(".calendar-section")
    
    if (calendarResultsSection) {
      calendarResultsSection.style.display = "none"
    }
    
    if (calendarSection) {
      calendarSection.style.display = "none"
    }
    
    // Show featured courts when hiding calendar
    const featuredSection = document.querySelector(".featured-courts-section")
    if (featuredSection) {
      featuredSection.style.display = "block"
    }

    // Show the new sections again when hiding calendar
    const bookingTipsSection = document.querySelector(".booking-tips-section")
    if (bookingTipsSection) {
      bookingTipsSection.style.display = "block"
    }

    const whyBookSection = document.querySelector(".why-book-section")
    if (whyBookSection) {
      whyBookSection.style.display = "block"
    }

    const bookingCtaSection = document.querySelector(".booking-cta-section")
    if (bookingCtaSection) {
      bookingCtaSection.style.display = "block"
    }
  }

  showCalendar() {
    const calendarResultsSection = document.querySelector(".calendar-results-section")
    const calendarSection = document.querySelector(".calendar-section")
    
    if (calendarResultsSection) {
      calendarResultsSection.style.display = "block"
    }
    
    if (calendarSection) {
      calendarSection.style.display = "block"
    }
    
    // Scroll to calendar section smoothly
    if (calendarResultsSection) {
      setTimeout(() => {
        calendarResultsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }

  showLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator")
    const calendarContainer = document.getElementById("calendarContainer")

    if (loadingIndicator) loadingIndicator.style.display = "block"
    if (calendarContainer) calendarContainer.style.display = "none"
  }

  hideLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator")
    const calendarContainer = document.getElementById("calendarContainer")

    if (loadingIndicator) loadingIndicator.style.display = "none"
    if (calendarContainer) calendarContainer.style.display = "block"
  }
}

// Initialize calendar when DOM is loaded
let bookingCalendar
document.addEventListener("DOMContentLoaded", () => {
  bookingCalendar = new BookingCalendar()
})
