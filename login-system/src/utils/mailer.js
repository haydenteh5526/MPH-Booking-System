import "../config/env.js";
import nodemailer from "nodemailer";

let transporter = null;
let modeLogged = false;

function readEnv() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const portRaw = process.env.SMTP_PORT;
  const port = Number.parseInt(portRaw || "0", 10) || undefined;
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

async function deliverEmail(payload, { fallback } = {}) {
  try {
    return await sendEmail(payload);
  } catch (err) {
    console.error("[mail] Failed to send email:", err.message);
    if (typeof fallback === "function") {
      try { fallback(); } catch (fallbackErr) {
        console.error("[mail] Fallback logger failed:", fallbackErr.message);
      }
    }
    return null;
  }
}

export async function sendVerificationEmail(to, link) {
  return deliverEmail({
    to,
    subject: "Verify your email",
    text: `Welcome to MPH Booking!\n\nPlease verify your email by visiting:\n${link}\n\nIf you did not create an account, you can ignore this email.`
  }, {
    fallback: () => {
      console.log(`[mail:fallback][verify] ${to} -> ${link}`);
    }
  });
}

export async function sendLoginOtpEmail(to, code) {
  return deliverEmail({
    to,
    subject: "Your login verification code",
    text: `Your MPH Booking verification code is: ${code}\n\nThis code expires in 10 minutes.`
  }, {
    fallback: () => {
      console.log(`[mail:fallback][otp] ${to} -> code ${code}`);
    }
  });
}

export async function sendPasswordResetEmail(to, link) {
  return deliverEmail({
    to,
    subject: "Reset your password",
    text: `You requested a password reset. Click the link below to set a new password:\n${link}\n\nIf you did not request this, you can ignore this email.`
  }, {
    fallback: () => {
      console.log(`[mail:fallback][reset] ${to} -> ${link}`);
    }
  });
}
