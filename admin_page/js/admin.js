// Admin Dashboard JavaScript

let allBookings = [];
let allBlockedSlots = [];
let currentBlockId = null;
let bookingsSortColumn = null;
let bookingsSortDirection = 'asc';
let blockedSlotsSortColumn = null;
let blockedSlotsSortDirection = 'asc';

// Court configurations for each sport
const courtConfigs = {
    'Basketball': ['Half Court 1 (Courts 1-2)', 'Half Court 2 (Courts 3-4)', 'Full Court (Courts 1-4)'],
    'Volleyball': ['Court 1 (Courts 1-2)', 'Court 2 (Courts 3-4)'],
    'Badminton': ['Court 1', 'Court 2', 'Court 3', 'Court 4']
};

// Time slots
const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00'
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboardData();
    initializeEventListeners();
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/auth/check-admin', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '../landing_page/index.html';
            return;
        }
        
        const data = await response.json();
        if (!data.isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = '../landing_page/index.html';
        }
    } catch (error) {
        console.error('Admin auth check failed:', error);
        window.location.href = '../landing_page/index.html';
    }
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadBookings(),
        loadBlockedSlots(),
        loadStats()
    ]);
}

// Load all bookings
async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load bookings');
        
        const data = await response.json();
        allBookings = data.bookings || [];
        renderBookingsTable(allBookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsTableBody').innerHTML = 
            '<tr><td colspan="8" class="no-data">Failed to load bookings</td></tr>';
    }
}

// Load blocked slots
async function loadBlockedSlots() {
    try {
        const response = await fetch('/api/admin/blocked-slots', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load blocked slots');
        
        const data = await response.json();
        allBlockedSlots = data.blockedSlots || [];
        renderBlockedSlotsTable(allBlockedSlots);
        updateBlockedSlotsCount(); // Update the count after loading
    } catch (error) {
        console.error('Error loading blocked slots:', error);
        document.getElementById('blockedSlotsTableBody').innerHTML = 
            '<tr><td colspan="8" class="no-data">Failed to load blocked slots</td></tr>';
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const data = await response.json();
        document.getElementById('totalBookings').textContent = data.totalBookings || 0;
        document.getElementById('todayBookings').textContent = data.todayBookings || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update blocked slots count in stats card
function updateBlockedSlotsCount() {
    const groupedCount = calculateGroupedBlockedSlotsCount(allBlockedSlots);
    document.getElementById('blockedSlots').textContent = groupedCount;
}

// Calculate grouped blocked slots count (count unique time ranges, not individual slots)
function calculateGroupedBlockedSlotsCount(slots) {
    if (!slots || slots.length === 0) return 0;
    
    // Group slots by date, sport, court, and reason
    const grouped = {};
    slots.forEach(slot => {
        const key = `${slot.sport}|${slot.court}|${formatDate(slot.date)}|${slot.reason}`;
        if (!grouped[key]) {
            grouped[key] = true;
        }
    });
    
    return Object.keys(grouped).length;
}

// Render bookings table
function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(booking => {
        // Capitalize sport name
        const sportName = booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1);
        
        // Format time (assuming booking.time is like "18" or "18:00", convert to "18:00 - 20:00")
        let timeDisplay = booking.time;
        if (typeof booking.time === 'string' || typeof booking.time === 'number') {
            const hour = parseInt(booking.time);
            if (!isNaN(hour)) {
                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
                timeDisplay = `${startTime} - ${endTime}`;
            }
        }
        
        return `
        <tr>
            <td>#${booking._id.substring(0, 8)}</td>
            <td>${booking.userEmail || 'N/A'}</td>
            <td>${sportName}</td>
            <td>${booking.court}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${timeDisplay}</td>
            <td>
                <span class="status-badge ${getStatusClass(booking)}">
                    ${getBookingStatus(booking)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    ${!booking.cancelled ? `
                        <button class="action-btn cancel-btn" data-booking-id="${booking._id}">
                            Cancel
                        </button>
                    ` : '<span style="color: var(--text-secondary);">Cancelled</span>'}
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    // Add event listeners to cancel buttons
    tbody.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openCancelBookingModal(this.getAttribute('data-booking-id'));
        });
    });
}

// Render blocked slots table
function renderBlockedSlotsTable(slots) {
    const tbody = document.getElementById('blockedSlotsTableBody');
    
    if (!slots || slots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No blocked slots found</td></tr>';
        return;
    }
    
    // Group slots by date, sport, court, and reason
    const grouped = {};
    slots.forEach(slot => {
        const key = `${slot.sport}|${slot.court}|${formatDate(slot.date)}|${slot.reason}`;
        if (!grouped[key]) {
            grouped[key] = {
                sport: slot.sport,
                court: slot.court,
                date: slot.date,
                reason: slot.reason,
                createdBy: slot.createdBy,
                times: [],
                ids: []
            };
        }
        grouped[key].times.push(slot.time);
        grouped[key].ids.push(slot._id);
    });
    
    // Convert to array and format time ranges
    const groupedArray = Object.values(grouped).map(group => {
        // Sort times
        group.times.sort();
        
        // Format as range if multiple times, otherwise single time
        if (group.times.length > 1) {
            const fromTime = group.times[0];
            const toTime = group.times[group.times.length - 1];
            // Calculate the end time (add 1 hour to last slot)
            const [hours, minutes] = toTime.split(':').map(Number);
            const endHour = (hours + 1).toString().padStart(2, '0');
            group.timeDisplay = `${fromTime} - ${endHour}:${minutes.toString().padStart(2, '0')}`;
        } else {
            group.timeDisplay = group.times[0];
        }
        
        return group;
    });
    
    tbody.innerHTML = groupedArray.map(group => `
        <tr>
            <td>#${group.ids[0].substring(0, 8)}</td>
            <td>${group.sport}</td>
            <td>${group.court}</td>
            <td>${formatDate(group.date)}</td>
            <td>${group.timeDisplay}</td>
            <td>${group.reason}</td>
            <td>${group.createdBy || 'Admin'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn unblock-btn" data-block-ids="${group.ids.join(',')}">
                        Unblock
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to unblock buttons
    tbody.querySelectorAll('.unblock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ids = this.getAttribute('data-block-ids').split(',');
            openUnblockModal(ids);
        });
    });
}

// Get booking status
function getBookingStatus(booking) {
    if (booking.cancelled) return 'Cancelled';
    
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) return 'Completed';
    return 'Active';
}

// Get status class
function getStatusClass(booking) {
    const status = getBookingStatus(booking);
    if (status === 'Active') return 'status-active';
    if (status === 'Cancelled') return 'status-blocked';
    return 'status-completed';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Update active states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Block time slot button
    document.getElementById('blockTimeSlotBtn').addEventListener('click', openBlockTimeSlotModal);
    
    // Refresh data button
    document.getElementById('refreshDataBtn').addEventListener('click', function() {
        loadDashboardData();
        showNotification('Data refreshed successfully', 'success');
    });
    
    // Cleanup button
    document.getElementById('cleanupBtn').addEventListener('click', openCleanupModal);
    
    // Block time slot form
    document.getElementById('blockTimeSlotForm').addEventListener('submit', handleBlockTimeSlot);
    
    // Cancel booking form
    document.getElementById('cancelBookingForm').addEventListener('submit', handleCancelBooking);
    
    // Cleanup form
    document.getElementById('cleanupForm').addEventListener('submit', handleCleanup);
    
    // Sport selection for block modal
    document.getElementById('blockSport').addEventListener('change', function() {
        const sport = this.value;
        const courtSelect = document.getElementById('blockCourt');
        
        if (sport && courtConfigs[sport]) {
            courtSelect.innerHTML = '<option value="">Select Court</option>' +
                courtConfigs[sport].map(court => `<option value="${court}">${court}</option>`).join('');
        } else {
            courtSelect.innerHTML = '<option value="">Select Court</option>';
        }
    });
    
    // Date selection for block modal
    document.getElementById('blockDate').addEventListener('change', function() {
        const date = this.value;
        const sport = document.getElementById('blockSport').value;
        const court = document.getElementById('blockCourt').value;
        
        if (date && sport && court) {
            loadAvailableTimeSlots();
        }
    });
    
    // Court selection for block modal
    document.getElementById('blockCourt').addEventListener('change', function() {
        const date = document.getElementById('blockDate').value;
        const sport = document.getElementById('blockSport').value;
        const court = this.value;
        
        if (date && sport && court) {
            loadAvailableTimeSlots();
        }
    });
    
    // From time selection - update To time options
    document.getElementById('blockFromTime').addEventListener('change', function() {
        updateToTimeOptions();
    });
    
    // Modal close buttons
    document.getElementById('closeBlockModal').addEventListener('click', closeBlockTimeSlotModal);
    document.getElementById('cancelBlockBtn').addEventListener('click', closeBlockTimeSlotModal);
    document.getElementById('closeCancelModal').addEventListener('click', closeCancelBookingModal);
    document.getElementById('cancelCancelBtn').addEventListener('click', closeCancelBookingModal);
    document.getElementById('closeUnblockModal').addEventListener('click', closeUnblockModal);
    document.getElementById('cancelUnblockBtn').addEventListener('click', closeUnblockModal);
    document.getElementById('confirmUnblockBtn').addEventListener('click', handleUnblockSlot);
    
    // Search functionality
    document.getElementById('searchBookings').addEventListener('input', filterBookings);
    
    // Filter functionality
    document.getElementById('sportFilter').addEventListener('change', filterBookings);
    document.getElementById('dateFilter').addEventListener('change', filterBookings);
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('blockDate').min = today;
    
    // Footer quick links
    document.getElementById('footerViewBookings').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.tab-btn[data-tab="all-bookings"]').click();
        document.querySelector('.admin-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    document.getElementById('footerBlockedSlots').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.tab-btn[data-tab="blocked-slots"]').click();
        document.querySelector('.admin-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    document.getElementById('footerBlockTimeSlot').addEventListener('click', function(e) {
        e.preventDefault();
        openBlockTimeSlotModal();
        document.querySelector('.admin-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Load available time slots
async function loadAvailableTimeSlots() {
    const fromTimeSelect = document.getElementById('blockFromTime');
    const toTimeSelect = document.getElementById('blockToTime');
    
    // For admin, show all time slots (they can block any slot regardless of bookings)
    const timeOptions = timeSlots.map(time => `<option value="${time}">${time}</option>`).join('');
    fromTimeSelect.innerHTML = '<option value="">Select Time</option>' + timeOptions;
    toTimeSelect.innerHTML = '<option value="">Select Time</option>' + timeOptions;
}

// Update To Time options based on From Time selection
function updateToTimeOptions() {
    const fromTime = document.getElementById('blockFromTime').value;
    const toTimeSelect = document.getElementById('blockToTime');
    
    if (!fromTime) {
        toTimeSelect.innerHTML = '<option value="">Select Time</option>' +
            timeSlots.map(time => `<option value="${time}">${time}</option>`).join('');
        return;
    }
    
    const fromIndex = timeSlots.indexOf(fromTime);
    const availableToTimes = timeSlots.slice(fromIndex + 1);
    
    if (availableToTimes.length === 0) {
        toTimeSelect.innerHTML = '<option value="">No times available after ' + fromTime + '</option>';
    } else {
        toTimeSelect.innerHTML = '<option value="">Select Time</option>' +
            availableToTimes.map(time => `<option value="${time}">${time}</option>`).join('');
    }
}

// Open block time slot modal
function openBlockTimeSlotModal() {
    document.getElementById('blockTimeSlotModal').classList.add('active');
    document.getElementById('blockTimeSlotForm').reset();
}

// Close block time slot modal
function closeBlockTimeSlotModal() {
    document.getElementById('blockTimeSlotModal').classList.remove('active');
}

// Handle block time slot
async function handleBlockTimeSlot(e) {
    e.preventDefault();
    
    const sport = document.getElementById('blockSport').value;
    const court = document.getElementById('blockCourt').value;
    const date = document.getElementById('blockDate').value;
    const fromTime = document.getElementById('blockFromTime').value;
    const toTime = document.getElementById('blockToTime').value;
    const reason = document.getElementById('blockReason').value;
    
    // Validate time range
    const fromIndex = timeSlots.indexOf(fromTime);
    const toIndex = timeSlots.indexOf(toTime);
    
    if (fromIndex >= toIndex) {
        showNotification('To Time must be after From Time', 'error');
        return;
    }
    
    // Get all time slots in the range
    const slotsToBlock = timeSlots.slice(fromIndex, toIndex);
    
    try {
        let successCount = 0;
        let failCount = 0;
        let errors = [];
        
        // Block each time slot in the range
        for (const time of slotsToBlock) {
            try {
                const response = await fetch('/api/admin/block-slot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ sport, court, date, time, reason })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                    errors.push(`${time}: ${data.error || 'Failed'}`);
                }
            } catch (error) {
                failCount++;
                errors.push(`${time}: ${error.message}`);
            }
        }
        
        // Show summary notification
        if (successCount > 0 && failCount === 0) {
            showNotification(`Successfully blocked ${successCount} time slot(s)`, 'success');
            closeBlockTimeSlotModal();
            loadDashboardData();
        } else if (successCount > 0 && failCount > 0) {
            showNotification(`Blocked ${successCount} slot(s), ${failCount} failed: ${errors.join(', ')}`, 'warning');
            loadDashboardData();
        } else {
            showNotification(`Failed to block slots: ${errors.join(', ')}`, 'error');
        }
    } catch (error) {
        console.error('Error blocking time slots:', error);
        showNotification(error.message, 'error');
    }
}

// Open cancel booking modal
function openCancelBookingModal(bookingId) {
    const booking = allBookings.find(b => b._id === bookingId);
    if (!booking) return;
    
    document.getElementById('cancelBookingId').value = bookingId;
    
    // Format sport name (capitalize)
    const sportName = booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1);
    
    // Format time (convert to range)
    let timeDisplay = booking.time;
    if (typeof booking.time === 'string' || typeof booking.time === 'number') {
        const hour = parseInt(booking.time);
        if (!isNaN(hour)) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
            timeDisplay = `${startTime} - ${endTime}`;
        }
    }
    
    const detailsDiv = document.getElementById('cancelBookingDetails');
    detailsDiv.innerHTML = `
        <p><strong>User:</strong> <span>${booking.userEmail}</span></p>
        <p><strong>Sport:</strong> <span>${sportName}</span></p>
        <p><strong>Court:</strong> <span>${booking.court}</span></p>
        <p><strong>Date:</strong> <span>${formatDate(booking.date)}</span></p>
        <p><strong>Time:</strong> <span>${timeDisplay}</span></p>
    `;
    
    document.getElementById('cancelBookingModal').classList.add('active');
}

// Close cancel booking modal
function closeCancelBookingModal() {
    document.getElementById('cancelBookingModal').classList.remove('active');
    document.getElementById('cancelBookingForm').reset();
}

// Handle cancel booking
async function handleCancelBooking(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('cancelBookingId').value;
    const reason = document.getElementById('cancelReason').value;
    
    try {
        const response = await fetch('/api/admin/cancel-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ bookingId, reason })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel booking');
        }
        
        showNotification('Booking cancelled and user notified', 'success');
        closeCancelBookingModal();
        loadDashboardData();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification(error.message, 'error');
    }
}

// Open unblock modal
function openUnblockModal(blockIds) {
    // Handle both single ID and array of IDs
    const ids = Array.isArray(blockIds) ? blockIds : [blockIds];
    
    // Get all slots for these IDs
    const slots = allBlockedSlots.filter(s => ids.includes(s._id));
    if (slots.length === 0) return;
    
    // Store IDs for unblocking
    currentBlockId = ids;
    
    const firstSlot = slots[0];
    const detailsDiv = document.getElementById('unblockSlotDetails');
    
    // Format time display
    let timeDisplay;
    if (slots.length > 1) {
        const times = slots.map(s => s.time).sort();
        const fromTime = times[0];
        const toTime = times[times.length - 1];
        const [hours, minutes] = toTime.split(':').map(Number);
        const endHour = (hours + 1).toString().padStart(2, '0');
        timeDisplay = `${fromTime} - ${endHour}:${minutes.toString().padStart(2, '0')}`;
    } else {
        timeDisplay = firstSlot.time;
    }
    
    detailsDiv.innerHTML = `
        <p><strong>Sport:</strong> <span>${firstSlot.sport}</span></p>
        <p><strong>Court:</strong> <span>${firstSlot.court}</span></p>
        <p><strong>Date:</strong> <span>${formatDate(firstSlot.date)}</span></p>
        <p><strong>Time:</strong> <span>${timeDisplay}</span></p>
        <p><strong>Reason:</strong> <span>${firstSlot.reason}</span></p>
    `;
    
    document.getElementById('unblockSlotModal').classList.add('active');
}

// Close unblock modal
function closeUnblockModal() {
    document.getElementById('unblockSlotModal').classList.remove('active');
    currentBlockId = null;
}

// Handle unblock slot
async function handleUnblockSlot() {
    if (!currentBlockId) return;
    
    // Handle both single ID and array of IDs
    const ids = Array.isArray(currentBlockId) ? currentBlockId : [currentBlockId];
    
    try {
        let successCount = 0;
        let failCount = 0;
        
        for (const blockId of ids) {
            try {
                const response = await fetch('/api/admin/unblock-slot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ blockId })
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }
        
        if (successCount > 0 && failCount === 0) {
            showNotification(`Successfully unblocked ${successCount} time slot(s)`, 'success');
        } else if (successCount > 0 && failCount > 0) {
            showNotification(`Unblocked ${successCount} slot(s), ${failCount} failed`, 'warning');
        } else {
            showNotification('Failed to unblock time slot(s)', 'error');
        }
        
        closeUnblockModal();
        loadDashboardData();
    } catch (error) {
        console.error('Error unblocking slot:', error);
        showNotification(error.message, 'error');
    }
}

// Filter bookings
function filterBookings() {
    const searchTerm = document.getElementById('searchBookings').value.toLowerCase();
    const sportFilter = document.getElementById('sportFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filtered = [...allBookings];
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(booking => 
            booking.userEmail?.toLowerCase().includes(searchTerm) ||
            booking.sport.toLowerCase().includes(searchTerm) ||
            booking.court.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sport filter
    if (sportFilter) {
        filtered = filtered.filter(booking => booking.sport === sportFilter);
    }
    
    // Date filter
    if (dateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            
            switch(dateFilter) {
                case 'today':
                    return bookingDate.getTime() === today.getTime();
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return bookingDate.getTime() === tomorrow.getTime();
                case 'week':
                    const weekLater = new Date(today);
                    weekLater.setDate(weekLater.getDate() + 7);
                    return bookingDate >= today && bookingDate <= weekLater;
                case 'month':
                    const monthLater = new Date(today);
                    monthLater.setMonth(monthLater.getMonth() + 1);
                    return bookingDate >= today && bookingDate <= monthLater;
                default:
                    return true;
            }
        });
    }
    
    renderBookingsTable(filtered);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Sortable table functionality
function initializeSortableHeaders() {
    // Bookings table sorting
    const bookingsTable = document.querySelector('#all-bookings table');
    if (bookingsTable) {
        const headers = bookingsTable.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const sortKey = header.getAttribute('data-sort');
                sortBookings(sortKey);
            });
        });
    }
    
    // Blocked slots table sorting
    const blockedSlotsTable = document.querySelector('#blocked-slots table');
    if (blockedSlotsTable) {
        const headers = blockedSlotsTable.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const sortKey = header.getAttribute('data-sort');
                sortBlockedSlots(sortKey);
            });
        });
    }
}

function sortBookings(column) {
    // Toggle direction if same column, otherwise reset to ascending
    if (bookingsSortColumn === column) {
        bookingsSortDirection = bookingsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        bookingsSortColumn = column;
        bookingsSortDirection = 'asc';
    }
    
    // Sort the bookings
    allBookings.sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'user':
                aVal = (a.userEmail || '').toLowerCase();
                bVal = (b.userEmail || '').toLowerCase();
                break;
            case 'sport':
                aVal = (a.sport || '').toLowerCase();
                bVal = (b.sport || '').toLowerCase();
                break;
            case 'court':
                aVal = (a.court || '').toLowerCase();
                bVal = (b.court || '').toLowerCase();
                break;
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            case 'time':
                aVal = parseInt(a.time) || 0;
                bVal = parseInt(b.time) || 0;
                break;
            case 'status':
                aVal = a.cancelled ? 'cancelled' : 'active';
                bVal = b.cancelled ? 'cancelled' : 'active';
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return bookingsSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return bookingsSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update sort icons
    updateSortIcons('#all-bookings table', column, bookingsSortDirection);
    
    // Re-render table
    renderBookingsTable(allBookings);
}

function sortBlockedSlots(column) {
    // Toggle direction if same column, otherwise reset to ascending
    if (blockedSlotsSortColumn === column) {
        blockedSlotsSortDirection = blockedSlotsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        blockedSlotsSortColumn = column;
        blockedSlotsSortDirection = 'asc';
    }
    
    // Get grouped slots
    const grouped = {};
    allBlockedSlots.forEach(slot => {
        const key = `${slot.sport}|${slot.court}|${formatDate(slot.date)}|${slot.reason}`;
        if (!grouped[key]) {
            grouped[key] = {
                sport: slot.sport,
                court: slot.court,
                date: slot.date,
                reason: slot.reason,
                createdBy: slot.createdBy,
                slots: []
            };
        }
        grouped[key].slots.push(slot);
    });
    
    // Convert to array and sort
    let groupedArray = Object.values(grouped);
    
    groupedArray.sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'sport':
                aVal = (a.sport || '').toLowerCase();
                bVal = (b.sport || '').toLowerCase();
                break;
            case 'court':
                aVal = (a.court || '').toLowerCase();
                bVal = (b.court || '').toLowerCase();
                break;
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return blockedSlotsSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return blockedSlotsSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update sort icons
    updateSortIcons('#blocked-slots table', column, blockedSlotsSortDirection);
    
    // Re-render table with sorted groups
    renderBlockedSlotsTableFromGroups(groupedArray);
}

function updateSortIcons(tableSelector, activeColumn, direction) {
    const table = document.querySelector(tableSelector);
    if (!table) return;
    
    const headers = table.querySelectorAll('th.sortable');
    headers.forEach(header => {
        const sortIcon = header.querySelector('.sort-icon');
        const column = header.getAttribute('data-sort');
        
        if (column === activeColumn) {
            sortIcon.textContent = direction === 'asc' ? '↑' : '↓';
            header.style.color = 'var(--brand-gold)';
        } else {
            sortIcon.textContent = '↕';
            header.style.color = '';
        }
    });
}

function renderBlockedSlotsTableFromGroups(groups) {
    const tbody = document.getElementById('blockedSlotsTableBody');
    
    if (!groups || groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No blocked slots found</td></tr>';
        return;
    }
    
    tbody.innerHTML = groups.map(group => {
        // Sort slots by time
        group.slots.sort((a, b) => {
            const timeA = parseInt(a.time.split(':')[0]);
            const timeB = parseInt(b.time.split(':')[0]);
            return timeA - timeB;
        });
        
        const firstSlot = group.slots[0];
        const lastSlot = group.slots[group.slots.length - 1];
        
        // Get start and end times
        const startHour = parseInt(firstSlot.time.split(':')[0]);
        const lastHour = parseInt(lastSlot.time.split(':')[0]);
        const endHour = lastHour + 1; // Add 1 hour to get end time
        
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        const timeRange = group.slots.length === 1 ? startTime : `${startTime} - ${endTime}`;
        
        const slotIds = group.slots.map(s => s._id);
        
        return `
            <tr>
                <td>#${firstSlot._id.substring(0, 8)}</td>
                <td>${group.sport}</td>
                <td>${group.court}</td>
                <td>${formatDate(group.date)}</td>
                <td>${timeRange}</td>
                <td>${group.reason}</td>
                <td>${group.createdBy || 'Admin'}</td>
                <td>
                    <button class="action-btn unblock-btn" data-block-ids='${JSON.stringify(slotIds)}'>
                        Unblock
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Re-attach event listeners
    tbody.querySelectorAll('.unblock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const blockIds = JSON.parse(this.getAttribute('data-block-ids'));
            openUnblockModal(blockIds);
        });
    });
}

// Cleanup Modal Functions
function openCleanupModal() {
    document.getElementById('cleanupModal').classList.add('active');
}

function closeCleanupModal() {
    document.getElementById('cleanupModal').classList.remove('active');
    document.getElementById('cleanupForm').reset();
}

document.getElementById('closeCleanupModal').addEventListener('click', closeCleanupModal);
document.getElementById('cancelCleanupBtn').addEventListener('click', closeCleanupModal);

async function handleCleanup(e) {
    e.preventDefault();
    
    const cleanBookings = document.getElementById('cleanupBookings').checked;
    const cleanBlockedSlots = document.getElementById('cleanupBlockedSlots').checked;
    const daysOld = document.getElementById('cleanupDays').value;
    
    if (!cleanBookings && !cleanBlockedSlots) {
        showNotification('Please select at least one data type to clean', 'error');
        return;
    }
    
    if (daysOld < 7) {
        showNotification('Minimum cleanup period is 7 days', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete data older than ${daysOld} days? This action cannot be undone.`)) {
        return;
    }
    
    try {
        let totalDeleted = 0;
        let messages = [];
        
        // Cleanup cancelled bookings
        if (cleanBookings) {
            const response = await fetch(`/api/admin/cleanup-old-bookings?daysOld=${daysOld}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                totalDeleted += data.deletedCount;
                messages.push(`${data.deletedCount} cancelled booking(s)`);
            } else {
                throw new Error(data.error || 'Failed to cleanup bookings');
            }
        }
        
        // Cleanup old blocked slots
        if (cleanBlockedSlots) {
            const response = await fetch(`/api/admin/cleanup-old-blocked-slots?daysOld=${daysOld}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                totalDeleted += data.deletedCount;
                messages.push(`${data.deletedCount} blocked slot(s)`);
            } else {
                throw new Error(data.error || 'Failed to cleanup blocked slots');
            }
        }
        
        closeCleanupModal();
        showNotification(`Successfully cleaned up ${messages.join(' and ')}`, 'success');
        loadDashboardData();
    } catch (error) {
        console.error('Error during cleanup:', error);
        showNotification(error.message, 'error');
    }
}

// Call initialization after page loads
setTimeout(initializeSortableHeaders, 500);

