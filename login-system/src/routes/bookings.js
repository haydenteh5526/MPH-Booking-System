import { Router } from "express";
import { sendBookingReceipt, sendCancellationEmail } from "../utils/mailer.js";
import { connectToDatabase } from "../config/db.js";
import BlockedSlot from "../models/BlockedSlot.js";
import User from "../models/User.js";
import { requireRegularUser } from "../middleware/requireAuth.js";

const router = Router();

// POST /bookings/confirm - Confirm booking and send receipt (regular users only)
router.post("/confirm", requireRegularUser, async (req, res) => {
  try {

    const { email, sport, courtName, dateFormatted, timeFormatted, duration, totalPrice, date, time } = req.body || {};

    if (!email || !sport || !courtName || !dateFormatted || !timeFormatted || !duration || !totalPrice) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

    // Check if slot is blocked
    const bookingDate = new Date(date || dateFormatted);
    const bookingTime = time || timeFormatted.split(' - ')[0];
    
    const blockedSlot = await BlockedSlot.findOne({
      sport,
      court: courtName,
      date: bookingDate,
      time: bookingTime
    });
    
    if (blockedSlot) {
      return res.status(400).json({ error: "This time slot is no longer available" });
    }

    // Get user details
    const user = await User.findById(req.session.userId);
    
    // Generate confirmation number
    const confirmationNumber = `MPH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Format payment date
    const paymentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Save booking to database
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    const booking = {
      userId: req.session.userId,
      userEmail: email,
      userName: user ? user.fullName : 'Customer',
      sport,
      court: courtName,
      date: bookingDate,
      time: bookingTime,
      duration,
      totalPrice,
      confirmationNumber,
      paymentDate: new Date(),
      cancelled: false,
      createdAt: new Date()
    };
    
    await bookingsCollection.insertOne(booking);

    // Send receipt email
    await sendBookingReceipt(email, {
      sport,
      courtName,
      dateFormatted,
      timeFormatted,
      duration,
      totalPrice,
      paymentDate,
      confirmationNumber
    });

    return res.status(200).json({ 
      message: "Booking confirmed and receipt sent",
      confirmationNumber,
      paymentDate
    });
  } catch (e) {
    console.error("[booking confirm]", e);
    return res.status(500).json({ error: "Failed to send receipt" });
  }
});

// POST /bookings/cancel - Cancel booking and send confirmation (regular users only)
router.post("/cancel", requireRegularUser, async (req, res) => {
  try {

    const { email, sport, courtName, dateFormatted, timeFormatted, duration, totalPrice, confirmationNumber } = req.body || {};

    if (!email || !sport || !courtName || !dateFormatted || !timeFormatted || !duration || !totalPrice || !confirmationNumber) {
      return res.status(400).json({ error: "Missing required cancellation details" });
    }

    // Send cancellation email
    await sendCancellationEmail(email, {
      sport,
      courtName,
      dateFormatted,
      timeFormatted,
      duration,
      totalPrice,
      confirmationNumber
    });

    return res.status(200).json({ 
      message: "Cancellation confirmed and email sent"
    });
  } catch (e) {
    console.error("[booking cancel]", e);
    return res.status(500).json({ error: "Failed to send cancellation email" });
  }
});

// POST /bookings/user-cancel - User cancels their own booking (requires auth)
router.post("/user-cancel", requireRegularUser, async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }
    
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    const { ObjectId } = await import("mongodb");
    
    // Verify booking exists and belongs to current user
    const booking = await bookingsCollection.findOne({ 
      _id: new ObjectId(bookingId),
      userId: req.session.userId
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found or you don't have permission to cancel it" });
    }
    
    if (booking.cancelled) {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }
    
    // Update booking to cancelled
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          cancelled: true,
          cancelledAt: new Date(),
          cancelledBy: "User",
          cancellationReason: "Cancelled by user"
        } 
      }
    );
    
    // Format booking details for email
    const date = new Date(booking.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format time
    let timeDisplay = booking.time;
    if (typeof booking.time === 'string' || typeof booking.time === 'number') {
      const hour = parseInt(booking.time);
      if (!isNaN(hour)) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
        timeDisplay = `${startTime} - ${endTime}`;
      }
    }
    
    // Send cancellation confirmation email
    try {
      await sendCancellationEmail(booking.userEmail, {
        sport: booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1),
        courtName: booking.court,
        dateFormatted: formattedDate,
        timeFormatted: timeDisplay,
        duration: booking.duration || 2,
        totalPrice: booking.totalPrice,
        confirmationNumber: booking.confirmationNumber
      });
    } catch (emailError) {
      console.error("[user-cancel] Email error:", emailError);
      // Continue even if email fails
    }
    
    return res.status(200).json({ 
      message: "Booking cancelled successfully",
      booking
    });
  } catch (e) {
    console.error("[user-cancel]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/bookings/available-slots - Get available time slots (excluding blocked slots)
router.get("/available-slots", async (req, res) => {
  try {
    const { sport, court, date } = req.query;
    
    if (!sport || !court || !date) {
      return res.status(400).json({ error: "Sport, court, and date are required" });
    }
    
    const timeSlots = [
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00'
    ];
    
    // Get blocked slots for this sport/court/date
    const blockedSlots = await BlockedSlot.find({
      sport,
      court,
      date: new Date(date)
    });
    
    const blockedTimes = blockedSlots.map(slot => slot.time);
    
    // Filter out blocked times
    const availableSlots = timeSlots.filter(time => !blockedTimes.includes(time));
    
    return res.status(200).json({ availableSlots });
  } catch (e) {
    console.error("[available-slots]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /bookings/blocked-slots - Get all blocked slots (public endpoint for calendar display)
router.get("/blocked-slots", async (req, res) => {
  try {
    const blockedSlots = await BlockedSlot.find({})
      .sort({ date: 1, time: 1 })
      .limit(500);
    
    console.log(`[blocked-slots] Found ${blockedSlots.length} blocked slots`);
    
    return res.status(200).json({ blockedSlots });
  } catch (e) {
    console.error("[blocked-slots]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /bookings/my-bookings - Get current user's bookings (requires auth)
router.get("/my-bookings", requireRegularUser, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    const bookings = await bookingsCollection
      .find({ userId: req.session.userId })
      .sort({ date: -1, time: -1 })
      .toArray();
    
    console.log(`[my-bookings] Found ${bookings.length} bookings for user ${req.session.userId}`);
    
    return res.status(200).json({ bookings });
  } catch (e) {
    console.error("[my-bookings]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /bookings/all-bookings - Get all confirmed bookings (public for calendar display)
router.get("/all-bookings", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    // Get only non-cancelled bookings for calendar display
    const bookings = await bookingsCollection
      .find({ cancelled: false })
      .sort({ date: 1, time: 1 })
      .limit(1000)
      .toArray();
    
    console.log(`[all-bookings] Found ${bookings.length} active bookings`);
    
    return res.status(200).json({ bookings });
  } catch (e) {
    console.error("[all-bookings]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
