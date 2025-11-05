// Calendar functionality for MPH Booking System
class BookingCalendar {
  constructor() {
    this.currentSport = "basketball"
    this.selectedCourts = [] // Changed to array for multi-selection
    this.currentWeekOffset = 0

    // Court conflict mapping
    // Full basketball court conflicts with both halves and all badminton courts and volleyball
    // Half basketball courts conflict with 2 badminton courts each
    // Volleyball uses full court
    this.courtConflicts = {
      "full-court": [
        "half-court-1",
        "half-court-2",
        "badminton-1",
        "badminton-2",
        "badminton-3",
        "badminton-4",
        "volleyball-court",
      ],
      "half-court-1": ["full-court", "badminton-1", "badminton-2", "volleyball-court"],
      "half-court-2": ["full-court", "badminton-3", "badminton-4", "volleyball-court"],
      "badminton-1": ["full-court", "half-court-1", "volleyball-court"],
      "badminton-2": ["full-court", "half-court-1", "volleyball-court"],
      "badminton-3": ["full-court", "half-court-2", "volleyball-court"],
      "badminton-4": ["full-court", "half-court-2", "volleyball-court"],
      "volleyball-court": [
        "full-court",
        "half-court-1",
        "half-court-2",
        "badminton-1",
        "badminton-2",
        "badminton-3",
        "badminton-4",
      ],
    }

    this.courtPrices = {
      "full-court": 50,
      "half-court-1": 25,
      "half-court-2": 25,
      "badminton-1": 15,
      "badminton-2": 15,
      "badminton-3": 15,
      "badminton-4": 15,
      "volleyball-court": 45,
    }

    this.courtNames = {
      "full-court": "Full Basketball Court",
      "half-court-1": "Basketball Half Court 1",
      "half-court-2": "Basketball Half Court 2",
      "badminton-1": "Badminton Court 1",
      "badminton-2": "Badminton Court 2",
      "badminton-3": "Badminton Court 3",
      "badminton-4": "Badminton Court 4",
      "volleyball-court": "Volleyball Court",
    }

    // Initialize hours and booking data AFTER court configuration
    this.hours = this.generateHours()
    this.bookingData = this.generateMockData()

    this.init()
  }

  init() {
    this.attachSportListeners()
    this.attachCourtListeners()
    this.attachMyBookingsListener()
    this.attachCalendarGridListener()
    this.hideCalendar()

    // Don't auto-select - let user choose first
    // this.selectCourt('full-court');
  }

  attachCalendarGridListener() {
    // Attach click listener to calendar grid once (uses event delegation)
    const calendarContainer = document.getElementById("calendarContainer")
    if (calendarContainer) {
      calendarContainer.addEventListener("click", (e) => {
        const slot = e.target.closest(".time-slot")
        if (slot && slot.dataset.status === "available" && !slot.classList.contains("blocked")) {
          this.handleSlotClick(slot)
        } else if (slot && slot.dataset.conflictReason) {
          alert(slot.dataset.conflictReason)
        }
      })
    }
  }

  hideCalendar() {
    const calendarSection = document.querySelector(".calendar-section")
    if (calendarSection) {
      calendarSection.style.display = "none"
    }
  }

  showCalendar() {
    const calendarSection = document.querySelector(".calendar-section")
    if (calendarSection) {
      calendarSection.style.display = "block"
    }

    // Show loading and render calendar
    this.showLoading()
    setTimeout(() => {
      this.renderCalendar()
      this.hideLoading()
    }, 800)
  }

  attachSportListeners() {
    const sportCards = document.querySelectorAll(".sport-card")
    sportCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const sport = e.currentTarget.dataset.sport
        this.changeSport(sport)
      })
    })
  }

  attachCourtListeners() {
    const courtOptions = document.querySelectorAll(".court-option")
    courtOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        if (option.classList.contains("disabled")) return

        const courtId = e.currentTarget.dataset.court
        this.toggleCourtSelection(courtId)
      })
    })
  }

  toggleCourtSelection(courtId) {
    // For volleyball, it's single selection
    if (this.currentSport === "volleyball") {
      this.selectedCourts = [courtId]
      this.updateCourtSelectionUI()
      this.checkBasketballFullCourt()
      this.updateSelectedCourtInfo()
      this.showCalendar()
      return
    }

    // For basketball and badminton, allow multiple selection
    const index = this.selectedCourts.indexOf(courtId)

    if (index > -1) {
      // Deselect
      this.selectedCourts.splice(index, 1)
    } else {
      // Select
      if (this.currentSport === "basketball") {
        // Basketball: max 2 courts (both halves)
        if (this.selectedCourts.length < 2) {
          this.selectedCourts.push(courtId)
        }
      } else if (this.currentSport === "badminton") {
        // Badminton: max 4 courts
        if (this.selectedCourts.length < 4) {
          this.selectedCourts.push(courtId)
        }
      }
    }

    this.updateCourtSelectionUI()
    this.checkBasketballFullCourt()
    this.updateSelectedCourtInfo()

    // Only show calendar if at least one court is selected
    if (this.selectedCourts.length > 0) {
      this.showCalendar()
    } else {
      this.hideCalendar()
    }
  }

  updateCourtSelectionUI() {
    // Remove all selected classes
    document.querySelectorAll(".court-option").forEach((opt) => {
      opt.classList.remove("selected")
    })

    // Add selected class to selected courts
    this.selectedCourts.forEach((courtId) => {
      const option = document.querySelector(`[data-court="${courtId}"]`)
      if (option) {
        option.classList.add("selected")
      }
    })
  }

  checkBasketballFullCourt() {
    const indicator = document.getElementById("fullCourtIndicator")
    if (!indicator) return

    // Check if both basketball half courts are selected
    const hasBothHalves = this.selectedCourts.includes("half-court-1") && this.selectedCourts.includes("half-court-2")

    if (hasBothHalves && this.currentSport === "basketball") {
      indicator.classList.add("active")
    } else {
      indicator.classList.remove("active")
    }
  }

  selectCourt(courtId) {
    // Legacy method - redirect to toggle
    this.toggleCourtSelection(courtId)
  }

  attachMyBookingsListener() {
    const myBookingsBtn = document.getElementById("myBookingsBtn")
    if (myBookingsBtn) {
      myBookingsBtn.onclick = () => {
        alert("My Bookings feature coming soon!")
      }
    }
  }

  updateSelectedCourtInfo() {
    const infoSection = document.getElementById("selectedCourtInfo")
    const courtName = document.getElementById("selectedCourtName")
    const courtPrice = document.getElementById("selectedCourtPrice")

    if (this.selectedCourts.length > 0) {
      infoSection.style.display = "block"

      // Calculate total price and display court names
      let totalPrice = 0
      const courtNames = []

      // Check if both basketball halves are selected (full court)
      const hasBothHalves = this.selectedCourts.includes("half-court-1") && this.selectedCourts.includes("half-court-2")

      if (hasBothHalves && this.currentSport === "basketball") {
        courtNames.push("Full Basketball Court")
        totalPrice = 50
      } else {
        this.selectedCourts.forEach((courtId) => {
          courtNames.push(this.courtNames[courtId])
          totalPrice += this.courtPrices[courtId]
        })
      }

      courtName.textContent = courtNames.join(", ")
      courtPrice.textContent = `$${totalPrice}/hour`
    } else {
      infoSection.style.display = "none"
    }
  }

  changeSport(sport) {
    this.currentSport = sport

    // Reset selected courts when changing sport
    this.selectedCourts = []
    this.hideCalendar()

    // Update active card
    document.querySelectorAll(".sport-card").forEach((card) => {
      card.classList.remove("active")
      if (card.dataset.sport === sport) {
        card.classList.add("active")
      }
    })

    // Switch court layout
    document.querySelectorAll(".court-visual-layout").forEach((layout) => {
      layout.classList.remove("active")
      if (layout.dataset.sport === sport) {
        layout.classList.add("active")
      }
    })

    // Clear all selections
    this.updateCourtSelectionUI()
    this.updateSelectedCourtInfo()
    this.checkBasketballFullCourt()
  }

  checkCourtConflicts(date, hour, courtId) {
    // Get all conflicting courts
    const conflictingCourts = this.courtConflicts[courtId] || []

    // Check if any conflicting court is booked at this time
    for (const conflictCourt of conflictingCourts) {
      const booking = this.bookingData[date]?.[hour]?.[conflictCourt]
      if (booking && booking.status === "booked") {
        return {
          hasConflict: true,
          conflictingCourt: this.courtNames[conflictCourt],
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
        label: `${displayHour} ${period}`,
      })
    }
    return hours
  }

  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  generateDays(weekOffset = 0) {
    const days = []
    const today = new Date()
    const monday = this.getMonday(today)

    monday.setDate(monday.getDate() + weekOffset * 7)

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)

      const isToday = this.isSameDay(date, new Date())

      days.push({
        date: date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        month: months[date.getMonth()],
        fullDate: date.toISOString().split("T")[0],
        isToday: isToday,
      })
    }

    return days
  }

  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  getWeekLabel(weekOffset) {
    if (weekOffset === 0) return "This Week"
    if (weekOffset === 1) return "Next Week"
    if (weekOffset === -1) return "Last Week"

    const monday = this.getMonday(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return `${months[monday.getMonth()]} ${monday.getDate()} - ${months[sunday.getMonth()]} ${sunday.getDate()}`
  }

  generateMockData() {
    // Generate mock booking data with court-specific bookings
    const data = {}
    const allCourts = Object.keys(this.courtNames)

    // Generate data for 8 weeks
    for (let weekOffset = -2; weekOffset <= 5; weekOffset++) {
      const days = this.generateDays(weekOffset)

      days.forEach((day) => {
        data[day.fullDate] = {}

        this.hours.forEach((hour) => {
          data[day.fullDate][hour.value] = {}

          allCourts.forEach((courtId) => {
            // Randomly assign slot status
            const random = Math.random()
            let status

            // Peak hours have more bookings
            const isPeakHour = hour.value >= 18 && hour.value <= 21
            const threshold = isPeakHour ? 0.3 : 0.5

            if (random < threshold) {
              status = "available"
            } else if (random < (isPeakHour ? 0.75 : 0.85)) {
              status = "booked"
            } else {
              status = "blocked"
            }

            data[day.fullDate][hour.value][courtId] = {
              status: status,
              time: hour.label,
              price: this.courtPrices[courtId],
            }
          })
        })
      })
    }

    return data
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

  renderCalendar() {
    if (this.selectedCourts.length === 0) return

    const calendarGrid = document.getElementById("calendarGrid")
    if (!calendarGrid) return

    // Update week label
    const weekLabel = document.getElementById("weekLabel")
    if (weekLabel) {
      weekLabel.textContent = this.getWeekLabel(this.currentWeekOffset)
    }

    // Clear existing content
    calendarGrid.innerHTML = ""

    // Add time column
    calendarGrid.appendChild(this.createTimeColumn())

    // Add day columns
    const days = this.generateDays(this.currentWeekOffset)
    days.forEach((day) => {
      calendarGrid.appendChild(this.createDayColumn(day))
    })

    // Attach event listeners after rendering
    this.attachCalendarEventListeners()
  }

  createTimeColumn() {
    const column = document.createElement("div")
    column.className = "time-column"

    const header = document.createElement("div")
    header.className = "time-header"
    column.appendChild(header)

    this.hours.forEach((hour) => {
      const label = document.createElement("div")
      label.className = "time-slot-label"
      label.textContent = hour.label
      column.appendChild(label)
    })

    return column
  }

  createDayColumn(day) {
    const column = document.createElement("div")
    column.className = "day-column"

    const header = document.createElement("div")
    header.className = "day-header"
    if (day.isToday) {
      header.classList.add("today")
    }

    const dayName = document.createElement("div")
    dayName.className = "day-name"
    dayName.textContent = day.dayName

    const dayDate = document.createElement("div")
    dayDate.className = "day-date"
    dayDate.textContent = day.dayNumber

    const dayMonth = document.createElement("div")
    dayMonth.className = "day-month"
    dayMonth.textContent = day.month

    header.appendChild(dayName)
    header.appendChild(dayDate)
    header.appendChild(dayMonth)
    column.appendChild(header)

    this.hours.forEach((hour) => {
      const slot = this.createTimeSlot(day, hour)
      column.appendChild(slot)
    })

    return column
  }

  createTimeSlot(day, hour) {
    const slot = document.createElement("div")
    slot.className = "time-slot"

    // Check availability for ALL selected courts
    let allAvailable = true
    let anyBooked = false
    let anyBlocked = false
    let totalPrice = 0
    let conflictReason = null

    for (const courtId of this.selectedCourts) {
      const slotData = this.bookingData[day.fullDate]?.[hour.value]?.[courtId]

      if (!slotData) {
        anyBlocked = true
        allAvailable = false
        break
      }

      // Check for conflicts
      const conflictCheck = this.checkCourtConflicts(day.fullDate, hour.value, courtId)

      if (conflictCheck.hasConflict && slotData.status === "available") {
        anyBlocked = true
        allAvailable = false
        conflictReason = `Conflict: ${conflictCheck.conflictingCourt} is booked`
        break
      }

      if (slotData.status === "booked") {
        anyBooked = true
        allAvailable = false
      } else if (slotData.status === "blocked") {
        anyBlocked = true
        allAvailable = false
      }

      if (slotData.status === "available") {
        totalPrice += slotData.price
      }
    }

    // Determine final status
    if (anyBlocked || conflictReason) {
      slot.classList.add("blocked")
      if (conflictReason) {
        slot.dataset.conflictReason = conflictReason
      }
      slot.innerHTML = '<div class="time-slot-content"><span class="slot-icon">⊗</span></div>'
    } else if (anyBooked) {
      slot.classList.add("booked")
      slot.innerHTML = '<div class="time-slot-content"><span class="slot-icon">✕</span></div>'
      slot.dataset.status = "booked"
    } else if (allAvailable) {
      slot.classList.add("available")
      slot.dataset.status = "available"

      // Check if both basketball halves selected (full court price)
      const hasBothHalves = this.selectedCourts.includes("half-court-1") && this.selectedCourts.includes("half-court-2")
      if (hasBothHalves && this.currentSport === "basketball") {
        totalPrice = 50 // Full court price
      }

      slot.dataset.price = totalPrice

      const content = document.createElement("div")
      content.className = "time-slot-content"

      const icon = document.createElement("span")
      icon.className = "slot-icon"
      icon.textContent = "✓"

      const price = document.createElement("span")
      price.className = "slot-price"
      price.textContent = `$${totalPrice}`

      content.appendChild(icon)
      content.appendChild(price)
      slot.appendChild(content)
    } else {
      slot.classList.add("blocked")
      slot.innerHTML = '<div class="time-slot-content"><span class="slot-icon">⊗</span></div>'
    }

    // Add common data attributes
    slot.dataset.date = day.fullDate
    slot.dataset.hour = hour.value
    slot.dataset.courts = this.selectedCourts.join(",")

    return slot
  }

  attachCalendarEventListeners() {
    // Week navigation - use onclick to replace any existing handlers
    const prevWeekBtn = document.getElementById("prevWeekBtn")
    const nextWeekBtn = document.getElementById("nextWeekBtn")

    if (prevWeekBtn) {
      prevWeekBtn.onclick = () => this.navigateWeek(-1)
    }

    if (nextWeekBtn) {
      nextWeekBtn.onclick = () => this.navigateWeek(1)
    }
  }

  navigateWeek(direction) {
    this.currentWeekOffset += direction

    if (this.currentWeekOffset < -2) this.currentWeekOffset = -2
    if (this.currentWeekOffset > 5) this.currentWeekOffset = 5

    this.showLoading()
    setTimeout(() => {
      this.renderCalendar()
      this.hideLoading()
    }, 300)
  }

  handleSlotClick(slot) {
    const date = slot.dataset.date
    const hour = slot.dataset.hour
    const courtsString = slot.dataset.courts
    const price = slot.dataset.price

    const courts = courtsString.split(",")

    const slotDate = new Date(date)
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

    const hourInt = Number.parseInt(hour)
    const displayHour = hourInt > 12 ? hourInt - 12 : hourInt
    const period = hourInt >= 12 ? "PM" : "AM"

    // Build court names list
    const courtNamesList = courts.map((courtId) => this.courtNames[courtId]).join(", ")

    const confirmed = confirm(
      `Book this slot?\n\n` +
        `Court${courts.length > 1 ? "s" : ""}: ${courtNamesList}\n` +
        `Day: ${dayNames[slotDate.getDay()]}\n` +
        `Date: ${months[slotDate.getMonth()]} ${slotDate.getDate()}, ${slotDate.getFullYear()}\n` +
        `Time: ${displayHour === 0 ? 12 : displayHour}:00 ${period}\n` +
        `Total Price: $${price}`,
    )

    if (confirmed) {
      const allConflictingCourts = new Set()

      // Update booking status for all selected courts
      courts.forEach((courtId) => {
        this.bookingData[date][hourInt][courtId].status = "booked"

        // Collect all conflicting courts
        const conflictingCourts = this.courtConflicts[courtId] || []
        conflictingCourts.forEach((conflictCourt) => {
          allConflictingCourts.add(conflictCourt)
        })
      })

      // Block all conflicting courts
      allConflictingCourts.forEach((conflictCourt) => {
        if (this.bookingData[date][hourInt][conflictCourt]) {
          this.bookingData[date][hourInt][conflictCourt].status = "booked"
        }
      })

      // Re-render calendar to show updated status
      this.showLoading()
      setTimeout(() => {
        this.renderCalendar()
        this.hideLoading()

        const message =
          allConflictingCourts.size > 0
            ? "Booking confirmed! Conflicting courts have been automatically blocked."
            : "Booking confirmed!"
        alert(message)
      }, 300)
    }
  }
}

// Initialize calendar when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new BookingCalendar()
})
