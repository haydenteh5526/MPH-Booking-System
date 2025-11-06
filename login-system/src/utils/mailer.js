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
