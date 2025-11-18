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
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #A39461, #c4b078); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">✓ Booking Confirmed</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="color: #333; font-size: 16px;">Dear Customer,</p>
        
        <p style="color: #28a745; font-size: 16px; font-weight: bold;">
          Your booking has been confirmed successfully!
        </p>
        
        <div style="background: white; border: 2px solid #A39461; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #A39461; margin-top: 0;">Booking Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Confirmation Number:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${confirmationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Sport:</td>
              <td style="padding: 8px 0; color: #333;">${sport}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Court:</td>
              <td style="padding: 8px 0; color: #333;">${courtName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0; color: #333;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0; color: #333;">${timeFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0; color: #333;">${duration} ${duration > 1 ? 'hours' : 'hour'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #28a745; margin-top: 0;">Payment Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount Paid:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">€${totalPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Payment Date:</td>
              <td style="padding: 8px 0; color: #333;">${paymentDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Payment Status:</td>
              <td style="padding: 8px 0; color: #28a745; font-weight: bold;">✓ Confirmed</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #0c5460; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #0c5460; margin-top: 0;">Important Information:</h3>
          <ul style="color: #0c5460; margin-bottom: 0; padding-left: 20px;">
            <li>Please arrive 10 minutes before your booking time</li>
            <li>Bring your student ID for verification</li>
            <li>Cancellations must be made at least 24 hours in advance</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.APP_BASE_URL}/booking_page/my-bookings.html" 
             style="background: #A39461; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; font-weight: bold;">
            View My Bookings
          </a>
        </div>
        
        <p style="color: #333; font-size: 14px; text-align: center;">
          If you have any questions, please contact us at 
          <a href="mailto:${process.env.MAIL_FROM}" style="color: #A39461;">${process.env.MAIL_FROM}</a>
        </p>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Thank you for choosing MPH Booking System!
        </p>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © ${new Date().getFullYear()} MPH Booking System. All rights reserved.
        </p>
        <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: "Booking Confirmation - MPH Booking System",
    html: emailHtml
  });
}

export async function sendCancellationEmail(to, bookingDetails) {
  const { sport, courtName, dateFormatted, timeFormatted, duration, totalPrice, confirmationNumber } = bookingDetails;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #A39461, #c4b078); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Booking Cancellation</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="color: #333; font-size: 16px;">Dear Customer,</p>
        
        <p style="color: #dc3545; font-size: 16px; font-weight: bold;">
          Your booking has been successfully cancelled.
        </p>
        
        <div style="background: white; border: 2px solid #A39461; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #A39461; margin-top: 0;">Cancelled Booking Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Confirmation Number:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${confirmationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Sport:</td>
              <td style="padding: 8px 0; color: #333;">${sport}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Court:</td>
              <td style="padding: 8px 0; color: #333;">${courtName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0; color: #333;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0; color: #333;">${timeFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0; color: #333;">${duration} ${duration > 1 ? 'hours' : 'hour'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #856404; margin-top: 0;">Refund Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #856404; font-weight: bold;">Refund Amount:</td>
              <td style="padding: 8px 0; color: #856404; font-weight: bold;">€${totalPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #856404; font-weight: bold;">Processing Time:</td>
              <td style="padding: 8px 0; color: #856404;">5-7 business days</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #856404; font-weight: bold;">Refund Method:</td>
              <td style="padding: 8px 0; color: #856404;">Original payment method</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #0c5460; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #0c5460; margin: 0; font-size: 14px;">
            Your refund will be processed automatically and credited to your original payment method within 5-7 business days.
          </p>
        </div>
        
        <p style="color: #333; font-size: 14px; text-align: center;">
          We're sorry to see this booking cancelled. We hope to see you back soon!
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.APP_BASE_URL}/booking_page/booking.html" 
             style="background: #A39461; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; font-weight: bold;">
            Make a New Booking
          </a>
        </div>
        
        <p style="color: #333; font-size: 14px; text-align: center;">
          If you have any questions about your cancellation or refund, please contact us at 
          <a href="mailto:${process.env.MAIL_FROM}" style="color: #A39461;">${process.env.MAIL_FROM}</a>
        </p>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © ${new Date().getFullYear()} MPH Booking System. All rights reserved.
        </p>
        <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: "Booking Cancellation Confirmed - MPH Booking System",
    html: emailHtml
  });
}
