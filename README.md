# MPH Booking System

A modern, premium sports facility booking platform with a clean shadcn/ui-inspired design.

## Features

### 🎨 Modern UI/UX
- **shadcn/ui-inspired design** - Clean, minimalistic interface with smooth animations
- **Premium startup aesthetic** - Professional look and feel
- **Dark mode support** - Automatic dark mode based on system preferences
- **Fully responsive** - Optimized for desktop, tablet, and mobile devices

### 🏟️ Court Selection System
- **Visual court layout** - See the physical court configuration before booking
- **Multiple court types**:
  - **Basketball**: Full court or two half courts
  - **Badminton**: 4 individual courts (2 per half)
  - **Volleyball**: Full court (basketball court size)
- **Intelligent conflict detection**:
  - Full basketball court blocks both halves and all badminton courts
  - Each basketball half blocks 2 badminton courts on that end
  - Volleyball blocks the entire facility
  - Automatic blocking of conflicting courts upon booking
- **Visual feedback** - Selected courts are highlighted, blocked courts are grayed out
- **Price transparency** - Each court shows pricing before selection

### 📅 Booking Calendar
- **Week-based view** - Navigate through multiple weeks (up to 5 weeks ahead)
- **Starts with Monday** - Week begins on Monday for better planning
- **Hourly time slots** - 8 AM to 10 PM (15 slots per day)
- **Color-coded availability**:
  - 🟢 Green - Available slots
  - 🔴 Red - Booked slots
  - ⚫ Gray - Blocked slots (conflicts or maintenance)
- **Dynamic pricing** - Different rates for different courts
- **Real-time conflict checking** - Prevents double-booking and court conflicts
- **Real-time booking** - Instant slot booking with automatic conflict resolution

### 🏀 Multi-Sport Support
- Basketball courts (full or half)
- Badminton courts (4 courts available)
- Volleyball courts (full court size)

### ✨ Additional Features
- Sticky header with navigation
- Week navigation controls (previous/next week)
- "My Bookings" button for future booking management
- Today's date highlighting
- Smooth loading states
- Interactive hover effects

## File Structure

```
MPH-Booking-System/
├── booking_page/
│   ├── css/
│   │   └── styles.css          # Complete styling with modern design system
│   ├── js/
│   │   ├── calendar.js         # Calendar logic and booking functionality
│   │   └── navigation.js       # Navigation helper for active states
│   └── templates/
│       ├── home.html           # Home/landing page
│       ├── booking.html        # Main booking calendar page
│       ├── about.html          # About page
│       └── partials/
│           ├── header.html     # Shared header component
│           └── footer.html     # Shared footer component
├── LICENSE
└── README.md
```

## Design System

### Color Palette
- **Primary**: Gold (#A39461) - Brand color
- **Background**: Light gray (#F9F9F9) with white cards
- **Text**: Dark gray with semantic hierarchy
- **Slot Colors**:
  - Available: Green (#22C55E)
  - Booked: Red (#EF4444)
  - Blocked: Gray (#6B7280)

### Typography
- System font stack for native feel
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Responsive font sizing

### Components
- Cards with subtle shadows and hover effects
- Rounded corners (8px radius)
- Smooth transitions and animations
- Interactive states (hover, active, disabled)

## Court Configuration

### Physical Layout
The facility is based on a full basketball court that can be divided:

```
┌─────────────────────────────────────────┐
│  Badminton 1  │  Badminton 3           │
│  Badminton 2  │  Badminton 4           │
│               │                         │
│  Half Court 1 │  Half Court 2          │
│               │                         │
│         Full Basketball Court           │
│      (or Volleyball Court)              │
└─────────────────────────────────────────┘
```

### Conflict Rules
1. **Full Basketball Court** - Blocks everything (both halves, all badminton, volleyball)
2. **Half Basketball Court 1** - Blocks Badminton 1 & 2
3. **Half Basketball Court 2** - Blocks Badminton 3 & 4
4. **Badminton Courts 1-2** - Share space with Half Court 1
5. **Badminton Courts 3-4** - Share space with Half Court 2
6. **Volleyball Court** - Uses entire space, blocks all courts

### Pricing
- Full Basketball Court: $50/hour
- Half Basketball Court: $25/hour each
- Badminton Court: $15/hour each
- Volleyball Court: $45/hour

## How to Use

1. **Select a sport**
   - Click on Basketball, Badminton, or Volleyball card

2. **Choose your court**
   - Visual court layout will appear
   - Select your preferred court configuration
   - Courts are color-coded and show pricing

3. **Navigate weeks**
   - Use the ◀ ▶ arrows to view different weeks
   - Current week label shows "This Week"

4. **Book a slot**
   - Click on any green (available) slot
   - Confirm the booking details
   - Slot will turn red (booked)
   - Conflicting courts are automatically blocked

5. **Conflict prevention**
   - System automatically detects conflicts
   - Gray slots indicate conflicts with other bookings
   - Click on gray slots to see conflict reason

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technical Details

- **No build process required** - Pure HTML, CSS, JavaScript
- **No dependencies** - Vanilla JavaScript
- **Component-based** - Reusable header/footer partials
- **State management** - Class-based calendar with local state
- **Data generation** - Mock data for 8 weeks (demo purposes)

## Future Enhancements

- Backend API integration
- User authentication
- Payment processing
- Email confirmations
- Booking history
- User profiles
- Filter by court number
- Time range selection
- Recurring bookings

## Acceptance Criteria ✓

- ✅ AC-1: Calendar displays 7 days forward with hourly time slots (8 AM - 10 PM)
- ✅ AC-2: Users can filter by sport type (basketball, badminton, volleyball)
- ✅ AC-3: Available slots shown in green, booked slots in red, blocked slots in gray
- ✅ AC-4: Calendar loads within 3 seconds
- ✅ AC-5: Mobile responsive design for on-the-go viewing

## License

See LICENSE file for details.

---

Built with ❤️ for MPH Sports Facility
Campus Multi-Purpose Hall Booking System - Software Engineering  Group Project. Built with Node.js, Express, MongoDB. Supports booking for  basketball, badminton, and volleyball.
