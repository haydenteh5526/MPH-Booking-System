# MPH Booking System

A modern, student-friendly sports facility booking platform with a clean shadcn/ui-inspired design. Complete booking flow from search to payment to booking management.

## Features

### 🎨 Modern UI/UX
- **shadcn/ui-inspired design** - Clean, minimalistic interface with smooth animations
- **Premium aesthetic** - Professional look and feel with gold accents
- **Fully responsive** - Optimized for desktop, tablet, and mobile devices
- **Beautiful modals** - Confirmation, success, and cancellation modals with smooth animations

### 🔍 Smart Search Interface
- **Horizontal pill-shaped search bar** - Modern, intuitive design
- **Sport selection** - Visual dropdown with emojis (🏀 Basketball, 🏸 Badminton, 🏐 Volleyball)
- **Date picker** - Easy calendar selection
- **Time selection** - 12-hour format with AM/PM
- **Duration options** - Book 1-4 hours at a time
- **Real-time validation** - Search button activates when all fields complete

### 📅 Availability Table
- **Court × Time grid layout** - Clear visualization of all available slots
- **Color-coded slots**:
  - 🟢 Green - Available (clickable)
  - 🔴 Red - Booked (reserved)
  - ⚫ Gray - Blocked (conflicts)
- **Integrated legend** - Explains color coding at a glance
- **Dynamic pricing display** - Each court shows price per hour
- **Hover effects** - Interactive feedback on available slots

### 🏟️ Multiple Court Types
- **Basketball**: 2 Half Courts (€8/hr) + 1 Full Court (€15/hr)
- **Badminton**: 4 Courts (€5/hr each)
- **Volleyball**: 1 Full Court (€12/hr)
- **Intelligent conflict detection**:
  - Full basketball court blocks both halves + all badminton + volleyball
  - Each basketball half blocks 2 badminton courts on that side
  - Volleyball blocks the entire facility
  - Automatic conflict resolution on booking

### 💳 Complete Booking Flow
1. **Search & Select** - Choose sport, date, time, duration
2. **Availability View** - See all courts and time slots
3. **Confirmation Modal** - Review booking details
4. **Payment Page** - Secure credit card processing
5. **Success Confirmation** - Booking confirmed with receipt email
6. **My Bookings** - View and manage all reservations

### 💰 Student-Friendly Pricing (Euros)
- **Badminton**: €5/hour - Perfect for students!
- **Basketball Half Court**: €8/hour - Great for pickup games
- **Basketball Full Court**: €15/hour - Competitive matches
- **Volleyball**: €12/hour - Team sports
- **No hidden fees** - All prices shown upfront
- **Group splitting** - Split costs with friends easily

### 📱 My Bookings Page
- View all confirmed bookings
- Cancel bookings with refund policy
- Success banner notifications
- Empty state for new users
- Booking cards with full details

### ✨ Additional Features
- **Profile dropdown** - Access My Bookings, Profile, Logout
- **Centered navigation** - Clean header layout
- **LocalStorage persistence** - Data saved across sessions
- **Form validation** - Credit card, email, required fields
- **Loading states** - Spinners for async operations
- **Auto-formatting** - Card numbers, expiry dates
- **Refund policy** - 3-5 business days for cancellations

## File Structure

```
MPH-Booking-System/
├── landing_page/
│   ├── index.html                  # Landing page
│   ├── css/
│   │   └── styles.css              # Landing page styles
│   └── js/
│       └── main.js                 # Landing page scripts
├── booking_page/
│   ├── booking.html                # Main booking search & availability
│   ├── payment.html                # Payment processing page
│   ├── my-bookings.html            # View/cancel bookings page
│   ├── css/
│   │   └── styles.css              # Complete styling (~4000 lines)
│   └── js/
│       ├── calendar.js             # Booking logic & availability table
│       ├── payment.js              # Payment processing
│       ├── my-bookings.js          # Bookings management & cancellation
│       └── navigation.js           # Navigation helper for active states
├── about_page/
│   ├── index.html                  # About page
│   └── css/
│       └── styles.css              # About page styles
├── partials/
│   ├── header.html                 # Shared header with nav + profile
│   └── footer.html                 # Shared footer component
├── LICENSE
└── README.md
```

## Design System

### Color Palette
- **Primary**: Gold (#A39461) - Buttons, accents, hovers
- **Success**: Green (#22C55E) - Available slots, confirmations
- **Warning**: Orange - Cancel modal, alerts
- **Danger**: Red (#EF4444) - Booked slots, destructive actions
- **Background**: Light gray (#F9F9F9) with white cards
- **Text**: Dark gray with semantic hierarchy

### Typography
- **Font**: Inter (system fallback)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Headings**: 1.5-2.5rem
- **Body**: 0.875-1rem
- **Responsive sizing** across devices

### Components
- **Cards**: Subtle shadows with hover lift effects
- **Modals**: Backdrop blur, slide-up animation, centered
- **Buttons**: Gradient backgrounds, hover lift, disabled states
- **Forms**: Floating labels, auto-formatting, validation feedback
- **Tables**: Sticky columns, color-coded cells, hover effects
- **Dropdowns**: Smooth open/close, click-outside to close
- **Rounded corners**: 8px standard, 12px for modals
- **Smooth transitions**: 0.2-0.3s ease

## Court Configuration

### Conflict Rules
1. **Full Basketball Court** - Blocks everything (both halves, all badminton, volleyball)
2. **Half Basketball Court 1** - Blocks Badminton 1 & 2
3. **Half Basketball Court 2** - Blocks Badminton 3 & 4
4. **Badminton Courts 1-2** - Share space with Half Court 1
5. **Badminton Courts 3-4** - Share space with Half Court 2
6. **Volleyball Court** - Uses entire space, blocks all courts

### Pricing (Student-Friendly in Euros)
- **Badminton Court**: €5/hour each (4 courts available)
- **Basketball Half Court**: €8/hour each (2 courts available)
- **Basketball Full Court**: €15/hour
- **Volleyball Court**: €12/hour

## How to Use

### Making a Booking

1. **Go to Bookings Page**
   - Navigate to the booking page from the header

2. **Use the Search Bar**
   - **Sport**: Click to open dropdown, select 🏀 Basketball, 🏸 Badminton, or 🏐 Volleyball
   - **When**: Click to open calendar and pick a date
   - **Time**: Select start time (12-hour format with AM/PM)
   - **Duration**: Choose 1-4 hours

3. **Search Availability**
   - Click the gold "Search" button
   - Availability table appears showing all courts

4. **Select a Time Slot**
   - Green slots are available (click to book)
   - Red slots are already booked
   - Gray slots are blocked due to conflicts
   - Each court shows price per hour

5. **Confirm Booking**
   - Review details in the confirmation modal
   - Check sport, court, date, time, duration, and total price
   - Click "Confirm Booking" to proceed

6. **Complete Payment**
   - Fill in credit card information
   - Card number auto-formats (XXXX XXXX XXXX XXXX)
   - Enter cardholder name, expiry (MM/YY), CVV
   - Provide email for receipt
   - Click "Pay €XX" button
   - Wait for processing (2 seconds)

7. **Booking Confirmed!**
   - Success banner appears
   - Redirected to My Bookings page
   - Booking saved and visible in your account

### Managing Bookings

1. **View Bookings**
   - Click profile icon → "My Bookings"
   - See all confirmed reservations
   - Each card shows full details and price

2. **Cancel a Booking**
   - Click "Cancel Booking" on any booking card
   - Review details in cancellation modal
   - Confirm cancellation
   - Refund processed within 3-5 business days

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technical Details

- **No build process required** - Pure HTML, CSS, JavaScript
- **No dependencies** - Vanilla JavaScript (no frameworks)
- **Component-based** - Reusable header/footer partials loaded via fetch
- **State management** - Class-based architecture with local state
- **Data persistence** - LocalStorage for bookings and pending transactions
- **Modular code** - Separate JS files for booking, payment, and booking management
- **Responsive CSS** - Media queries for desktop, tablet, mobile
- **Form validation** - HTML5 + custom JavaScript validation
- **Time handling** - Accurate 12-hour ↔ 24-hour conversion
- **Conflict resolution** - Automatic court blocking based on sport selection

## Current Features (Production Ready)

✅ Complete booking flow from search to confirmation
✅ Real-time availability checking
✅ Payment processing simulation
✅ Booking management and cancellation
✅ Price calculations and display
✅ Court conflict detection and blocking
✅ Form validation and auto-formatting
✅ Responsive design for all devices
✅ Beautiful UI with smooth animations
✅ LocalStorage data persistence
✅ Success and error handling
✅ Refund policy and notifications

## Future Enhancements

- Backend API integration
- User authentication system
- Real payment gateway (Stripe, PayPal)
- Email confirmations and receipts
- SMS notifications
- User profiles with history
- Recurring bookings
- Admin dashboard
- Analytics and reporting
- Multi-language support

## License

See LICENSE file for details.

---

**Built with ❤️ for MPH Students**

Campus Multi-Purpose Hall Booking System - Student-friendly sports facility booking with affordable pricing. Pure JavaScript implementation with modern UI/UX design. Supports basketball, badminton, and volleyball court bookings.
