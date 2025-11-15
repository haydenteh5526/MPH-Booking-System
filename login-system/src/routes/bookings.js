import { Router } from "express";
import { sendBookingReceipt, sendCancellationEmail } from "../utils/mailer.js";

const router = Router();

// POST /bookings/confirm - Confirm booking and send receipt
router.post("/confirm", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email, sport, courtName, dateFormatted, timeFormatted, duration, totalPrice } = req.body || {};

    if (!email || !sport || !courtName || !dateFormatted || !timeFormatted || !duration || !totalPrice) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

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

// POST /bookings/cancel - Cancel booking and send confirmation
router.post("/cancel", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

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

export default router;
