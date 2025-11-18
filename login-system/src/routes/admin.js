import { Router } from "express";
import User from "../models/User.js";
import BlockedSlot from "../models/BlockedSlot.js";
import { connectToDatabase } from "../config/db.js";
import nodemailer from "nodemailer";
import "../config/env.js";
import { requireAdmin } from "../middleware/requireAuth.js";

const router = Router();

// Court overlap mapping - matches frontend logic
const getCourtId = (sport, court) => {
  const sportLower = sport.toLowerCase();
  if (sportLower === 'basketball') {
    if (court.includes('Half Court 1')) return 'basketball-half-1';
    if (court.includes('Half Court 2')) return 'basketball-half-2';
    if (court.includes('Full Court')) return 'basketball-full';
  } else if (sportLower === 'badminton') {
    if (court.includes('Court 1')) return 'badminton-1';
    if (court.includes('Court 2')) return 'badminton-2';
    if (court.includes('Court 3')) return 'badminton-3';
    if (court.includes('Court 4')) return 'badminton-4';
  } else if (sportLower === 'volleyball') {
    if (court.includes('Court 1')) return 'volleyball-half-1';
    if (court.includes('Court 2')) return 'volleyball-half-2';
  }
  return null;
};

const courtOverlapMap = {
  'basketball-full': [
    { sport: 'Basketball', court: 'Half Court 1 (Courts 1-2)' },
    { sport: 'Basketball', court: 'Half Court 2 (Courts 3-4)' },
    { sport: 'Badminton', court: 'Court 1' },
    { sport: 'Badminton', court: 'Court 2' },
    { sport: 'Badminton', court: 'Court 3' },
    { sport: 'Badminton', court: 'Court 4' },
    { sport: 'Volleyball', court: 'Court 1 (Courts 1-2)' },
    { sport: 'Volleyball', court: 'Court 2 (Courts 3-4)' }
  ],
  'basketball-half-1': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Badminton', court: 'Court 1' },
    { sport: 'Badminton', court: 'Court 2' },
    { sport: 'Volleyball', court: 'Court 1 (Courts 1-2)' }
  ],
  'basketball-half-2': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Badminton', court: 'Court 3' },
    { sport: 'Badminton', court: 'Court 4' },
    { sport: 'Volleyball', court: 'Court 2 (Courts 3-4)' }
  ],
  'badminton-1': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 1 (Courts 1-2)' },
    { sport: 'Volleyball', court: 'Court 1 (Courts 1-2)' }
  ],
  'badminton-2': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 1 (Courts 1-2)' },
    { sport: 'Volleyball', court: 'Court 1 (Courts 1-2)' }
  ],
  'badminton-3': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 2 (Courts 3-4)' },
    { sport: 'Volleyball', court: 'Court 2 (Courts 3-4)' }
  ],
  'badminton-4': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 2 (Courts 3-4)' },
    { sport: 'Volleyball', court: 'Court 2 (Courts 3-4)' }
  ],
  'volleyball-half-1': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 1 (Courts 1-2)' },
    { sport: 'Badminton', court: 'Court 1' },
    { sport: 'Badminton', court: 'Court 2' }
  ],
  'volleyball-half-2': [
    { sport: 'Basketball', court: 'Full Court (Courts 1-4)' },
    { sport: 'Basketball', court: 'Half Court 2 (Courts 3-4)' },
    { sport: 'Badminton', court: 'Court 3' },
    { sport: 'Badminton', court: 'Court 4' }
  ]
};

// Simple email sending function for admin
async function sendAdminEmail(to, subject, html) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
  const SMTP_SECURE = process.env.SMTP_SECURE === "true";
  const from = process.env.MAIL_FROM || "no-reply@mph.local";
  
  // Use SMTP (SendGrid/other) if configured
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    
    await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    
    console.log(`[admin-mail] Email sent to ${to}`);
    return { success: true };
  }
  
  // Fallback: Try Resend API if available
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html
      })
    });
    
    if (!res.ok) {
      throw new Error(`Email API error ${res.status}`);
    }
    console.log(`[admin-mail] Email sent via Resend to ${to}`);
    return await res.json();
  }
  
  // Fallback to console logging in dev (no email service configured)
  console.log(`[dev-mail] To: ${to}`);
  console.log(`[dev-mail] Subject: ${subject}`);
  console.log(`[dev-mail] HTML: ${html.substring(0, 200)}...`);
  return { messageId: "dev" };
}

// GET /api/admin/stats - Get dashboard statistics
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [totalBookings, todayBookings, blockedSlots, totalUsers] = await Promise.all([
      bookingsCollection.countDocuments({ cancelled: { $ne: true } }),
      bookingsCollection.countDocuments({ 
        date: { $gte: today, $lt: tomorrow },
        cancelled: { $ne: true }
      }),
      BlockedSlot.countDocuments(),
      User.countDocuments()
    ]);
    
    return res.status(200).json({
      totalBookings,
      todayBookings,
      blockedSlots,
      totalUsers
    });
  } catch (e) {
    console.error("[admin/stats]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/bookings - Get all bookings
router.get("/bookings", requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    const bookings = await bookingsCollection
      .find({})
      .sort({ date: -1, time: -1 })
      .limit(500)
      .toArray();
    
    return res.status(200).json({ bookings });
  } catch (e) {
    console.error("[admin/bookings]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/blocked-slots - Get all blocked slots
router.get("/blocked-slots", requireAdmin, async (req, res) => {
  try {
    const blockedSlots = await BlockedSlot.find({})
      .sort({ date: -1, time: -1 })
      .limit(200);
    
    return res.status(200).json({ blockedSlots });
  } catch (e) {
    console.error("[admin/blocked-slots]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/block-slot - Block a time slot with overlap logic
router.post("/block-slot", requireAdmin, async (req, res) => {
  try {
    const { sport, court, date, time, reason } = req.body || {};
    
    if (!sport || !court || !date || !time || !reason) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Check if slot is already blocked
    const existing = await BlockedSlot.findOne({ sport, court, date: new Date(date), time });
    if (existing) {
      return res.status(400).json({ error: "This time slot is already blocked" });
    }
    
    // Check if there's an existing booking for this slot
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    const existingBooking = await bookingsCollection.findOne({
      sport,
      court,
      date: new Date(date),
      time,
      cancelled: { $ne: true }
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        error: "Cannot block: there's an active booking for this slot. Cancel the booking first." 
      });
    }
    
    // Create main blocked slot
    const blockedSlot = new BlockedSlot({
      sport,
      court,
      date: new Date(date),
      time,
      reason,
      createdBy: req.adminUser.fullName,
      adminEmail: req.adminUser.email
    });
    
    await blockedSlot.save();
    
    // Get court ID and block overlapping courts
    const courtId = getCourtId(sport, court);
    const overlappingSlots = [];
    
    if (courtId && courtOverlapMap[courtId]) {
      const overlaps = courtOverlapMap[courtId];
      
      for (const overlap of overlaps) {
        // Check if overlap slot already exists
        const existingOverlap = await BlockedSlot.findOne({
          sport: overlap.sport,
          court: overlap.court,
          date: new Date(date),
          time
        });
        
        if (!existingOverlap) {
          // Check for existing bookings on overlap courts
          const overlapBooking = await bookingsCollection.findOne({
            sport: overlap.sport,
            court: overlap.court,
            date: new Date(date),
            time,
            cancelled: { $ne: true }
          });
          
          if (!overlapBooking) {
            const overlapSlot = new BlockedSlot({
              sport: overlap.sport,
              court: overlap.court,
              date: new Date(date),
              time,
              reason: `Auto-blocked (overlaps with ${sport} ${court})`,
              createdBy: req.adminUser.fullName,
              adminEmail: req.adminUser.email,
              autoBlocked: true,
              parentBlockId: blockedSlot._id
            });
            
            await overlapSlot.save();
            overlappingSlots.push(overlapSlot);
          }
        }
      }
    }
    
    return res.status(201).json({ 
      message: "Time slot blocked successfully",
      blockedSlot,
      overlappingBlocks: overlappingSlots.length,
      details: overlappingSlots.length > 0 
        ? `Also blocked ${overlappingSlots.length} overlapping court(s)`
        : undefined
    });
  } catch (e) {
    console.error("[admin/block-slot]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/unblock-slot - Unblock a time slot and its overlaps
router.post("/unblock-slot", requireAdmin, async (req, res) => {
  try {
    const { blockId } = req.body || {};
    
    if (!blockId) {
      return res.status(400).json({ error: "Block ID is required" });
    }
    
    const blockedSlot = await BlockedSlot.findById(blockId);
    if (!blockedSlot) {
      return res.status(404).json({ error: "Blocked slot not found" });
    }
    
    // Delete the main blocked slot
    await BlockedSlot.findByIdAndDelete(blockId);
    
    // Also delete any auto-blocked overlapping slots that were created with this block
    const overlapResult = await BlockedSlot.deleteMany({
      parentBlockId: blockId,
      autoBlocked: true
    });
    
    return res.status(200).json({ 
      message: "Time slot unblocked successfully",
      overlapsRemoved: overlapResult.deletedCount
    });
  } catch (e) {
    console.error("[admin/unblock-slot]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/cancel-booking - Cancel a user's booking
router.post("/cancel-booking", requireAdmin, async (req, res) => {
  try {
    const { bookingId, reason } = req.body || {};
    
    if (!bookingId || !reason) {
      return res.status(400).json({ error: "Booking ID and reason are required" });
    }
    
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    const { ObjectId } = await import("mongodb");
    
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
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
          cancelledBy: "Admin",
          cancellationReason: reason
        } 
      }
    );
    
    // Send cancellation email to user
    const date = new Date(booking.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
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
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #A39461, #c4b078); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="color: #333; font-size: 16px;">Dear ${booking.userName || 'Customer'},</p>
          
          <p style="color: #dc3545; font-size: 16px; font-weight: bold;">
            Your booking has been cancelled by our admin team.
          </p>
          
          <div style="background: white; border: 2px solid #A39461; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #A39461; margin-top: 0;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Sport:</td>
                <td style="padding: 8px 0; color: #333;">${sportName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Court:</td>
                <td style="padding: 8px 0; color: #333;">${booking.court}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${timeDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Booking ID:</td>
                <td style="padding: 8px 0; color: #333;">#${booking._id.toString().substring(0, 8)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">Cancellation Reason:</h3>
            <p style="color: #856404; margin-bottom: 0;">${reason}</p>
          </div>
          
          <p style="color: #333; font-size: 14px;">
            If you have any questions or concerns about this cancellation, please contact us at 
            <a href="mailto:bookings@mph.ie" style="color: #A39461;">bookings@mph.ie</a>
          </p>
          
          <p style="color: #333; font-size: 14px;">
            We apologize for any inconvenience this may cause.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            MPH Booking System | TUS Athlone Campus
          </p>
        </div>
      </div>
    `;
    
    try {
      await sendAdminEmail(
        booking.userEmail,
        "Booking Cancelled - MPH Booking System",
        emailHtml
      );
    } catch (emailError) {
      console.error("[admin/cancel-booking] Email error:", emailError);
      // Continue even if email fails
    }
    
    return res.status(200).json({ 
      message: "Booking cancelled and user notified",
      booking
    });
  } catch (e) {
    console.error("[admin/cancel-booking]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/cleanup-old-bookings - Remove old cancelled bookings
router.delete("/cleanup-old-bookings", requireAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    const db = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    
    // Calculate cutoff date (default 30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
    
    // Delete cancelled bookings older than cutoff date
    const result = await bookingsCollection.deleteMany({
      cancelled: true,
      updatedAt: { $lt: cutoffDate }
    });
    
    return res.status(200).json({
      message: `Cleaned up ${result.deletedCount} old cancelled booking(s)`,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (e) {
    console.error("[admin/cleanup-old-bookings]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/cleanup-old-blocked-slots - Remove old blocked slots
router.delete("/cleanup-old-blocked-slots", requireAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    // Calculate cutoff date (default 30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
    
    // Delete blocked slots with dates older than cutoff
    const result = await BlockedSlot.deleteMany({
      date: { $lt: cutoffDate }
    });
    
    return res.status(200).json({
      message: `Cleaned up ${result.deletedCount} old blocked slot(s)`,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (e) {
    console.error("[admin/cleanup-old-blocked-slots]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
