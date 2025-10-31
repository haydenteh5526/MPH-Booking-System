import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || "0", 10) || undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const secureEnv = String(process.env.SMTP_SECURE || "").toLowerCase();
const smtpSecure = secureEnv === "true" || secureEnv === "1" || (port === 465);
const RESEND_API_KEY = process.env.RESEND_API_KEY;

let transporter = null;

async function sendViaResend({ to, subject, text }) {
  const apiKey = RESEND_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "no-reply@mph.local",
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
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: smtpSecure,
      auth: { user, pass }
    });
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
  }
  return transporter;
}

async function sendEmail({ to, subject, text }) {
  if (RESEND_API_KEY) {
    return await sendViaResend({ to, subject, text });
  }
  const tx = await getTransporter();
  return await tx.sendMail({ to, from: process.env.MAIL_FROM || "no-reply@mph.local", subject, text });
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
