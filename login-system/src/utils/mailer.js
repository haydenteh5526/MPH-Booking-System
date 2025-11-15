import "../config/env.js";
import nodemailer from "nodemailer";

let transporter = null;
let modeLogged = false;

function readEnv() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const portRaw = process.env.SMTP_PORT;
  const port = parseInt(portRaw || "0", 10) || undefined;
  const secureEnv = String(process.env.SMTP_SECURE || "").toLowerCase();
  const smtpSecure = secureEnv === "true" || secureEnv === "1" || (port === 465);
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "no-reply@mph.local";
  return { host, user, pass, port, smtpSecure, RESEND_API_KEY, from };
}

async function sendViaResend({ to, subject, text }) {
  const { RESEND_API_KEY, from } = readEnv();
  const apiKey = RESEND_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[mail:resend] send failed", res.status, body);
    throw new Error(`Resend API error ${res.status}`);
  }
  return await res.json();
}

async function getTransporter() {
  if (transporter) return transporter;
  const { host, user, pass, port, smtpSecure } = readEnv();
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: smtpSecure,
      auth: { user, pass }
    });
    if (!modeLogged) { console.log("[mail] Using SMTP transporter (", host, ")"); modeLogged = true; }
  } else {
    // Dev fallback: log emails to console
    transporter = {
      sendMail: async (opts) => {
        console.log("[dev-mail] To:", opts.to);
        console.log("[dev-mail] Subject:", opts.subject);
        console.log("[dev-mail] Text:\n", opts.text);
        return { messageId: "dev" };
      }
    };
    if (!modeLogged) { console.log("[mail] Using dev console mailer (no SMTP/Resend configured)"); modeLogged = true; }
  }
  return transporter;
}

async function sendEmail({ to, subject, text }) {
  const { RESEND_API_KEY, from } = readEnv();
  if (RESEND_API_KEY) {
    if (!modeLogged) { console.log("[mail] Using Resend API"); modeLogged = true; }
    return await sendViaResend({ to, subject, text });
  }
  const tx = await getTransporter();
  return await tx.sendMail({ to, from, subject, text });
}

export async function sendVerificationEmail(to, link) {
  return sendEmail({
    to,
    subject: "Verify your email",
    text: `Welcome to MPH Booking!\n\nPlease verify your email by visiting:\n${link}\n\nIf you did not create an account, you can ignore this email.`
  });
}

export async function sendLoginOtpEmail(to, code) {
  return sendEmail({
    to,
    subject: "Your login verification code",
    text: `Your MPH Booking verification code is: ${code}\n\nThis code expires in 10 minutes.`
  });
}

export async function sendPasswordResetEmail(to, link) {
  return sendEmail({
    to,
    subject: "Reset your password",
    text: `You requested a password reset. Click the link below to set a new password:\n${link}\n\nIf you did not request this, you can ignore this email.`
  });
}

export async function sendBookingReceipt(to, bookingDetails) {
  const { sport, courtName, dateFormatted, timeFormatted, duration, totalPrice, paymentDate, confirmationNumber } = bookingDetails;
  
  return sendEmail({
    to,
    subject: "Booking Confirmation - MPH Booking System",
    text: `Thank you for your booking!\n\nBOOKING CONFIRMATION\n${"=".repeat(50)}\n\nConfirmation Number: ${confirmationNumber}\n\nBooking Details:\n- Sport: ${sport}\n- Court: ${courtName}\n- Date: ${dateFormatted}\n- Time: ${timeFormatted}\n- Duration: ${duration} ${duration > 1 ? 'hours' : 'hour'}\n\nPayment Details:\n- Amount Paid: €${totalPrice}\n- Payment Date: ${paymentDate}\n- Payment Status: Confirmed\n\nIMPORTANT INFORMATION:\n- Please arrive 10 minutes before your booking time\n- Bring your student ID for verification\n- Cancellations must be made at least 24 hours in advance\n\nView your booking: ${process.env.APP_BASE_URL}/booking_page/my-bookings.html\n\nThank you for choosing MPH Booking System!\n\nIf you have any questions, please contact us at ${process.env.MAIL_FROM}`
  });
}

export async function sendCancellationEmail(to, bookingDetails) {
  const { sport, courtName, dateFormatted, timeFormatted, duration, totalPrice, confirmationNumber } = bookingDetails;
  
  return sendEmail({
    to,
    subject: "Booking Cancellation Confirmed - MPH Booking System",
    text: `Your booking has been cancelled.\n\nCANCELLATION CONFIRMATION\n${"=".repeat(50)}\n\nConfirmation Number: ${confirmationNumber}\n\nCancelled Booking Details:\n- Sport: ${sport}\n- Court: ${courtName}\n- Date: ${dateFormatted}\n- Time: ${timeFormatted}\n- Duration: ${duration} ${duration > 1 ? 'hours' : 'hour'}\n- Amount Refunded: €${totalPrice}\n\nYour refund will be processed within 5-7 business days and credited to your original payment method.\n\nWe're sorry to see this booking cancelled. We hope to see you back soon!\n\nMake a new booking: ${process.env.APP_BASE_URL}/booking_page/booking.html\n\nIf you have any questions about your cancellation or refund, please contact us at ${process.env.MAIL_FROM}\n\nThank you for using MPH Booking System!`
  });
}
