import "../config/env.js";
import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateToken, sha256Hex } from "../utils/tokens.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const router = Router();

const LOCKOUT_THRESHOLD = parseInt(process.env.LOCKOUT_THRESHOLD || "5", 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || "15", 10);
const idleSecs = parseInt(process.env.SESSION_IDLE_MINUTES || "30", 10) * 60;

const VERIFY_TOKEN_MINUTES = parseInt(process.env.VERIFY_TOKEN_MINUTES || "1440", 10);
const RESET_TOKEN_MINUTES = parseInt(process.env.RESET_TOKEN_MINUTES || "60", 10);
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "student.tus.ie").toLowerCase();

const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_REQUIREMENTS = "Password must be at least 8 characters and include at least one uppercase letter and one number.";
const PHONE_PATTERN = /^[+0-9 ()-]{7,20}$/;
const STUDENT_ID_PATTERN = /^[A-Za-z0-9]{5,20}$/;

// no cookies used beyond session for simplified flow

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phoneNumber, studentId } = req.body || {};
    if (!email || !password || !name || !phoneNumber || !studentId) {
      return res.status(400).json({ error: "Name, email, phone number, student ID, and password are required." });
    }
    const normEmail = String(email).trim().toLowerCase();
    const fullName = String(name).trim();
    const normPhone = String(phoneNumber).trim();
    const normStudentId = String(studentId).trim().toUpperCase();

    if (!normEmail.endsWith("@" + ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({ error: `Email must be @${ALLOWED_EMAIL_DOMAIN}` });
    }
    if (!PASSWORD_POLICY.test(password)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS });
    }
    if (fullName.length < 2) {
      return res.status(400).json({ error: "Please provide your full name." });
    }
    if (!PHONE_PATTERN.test(normPhone)) {
      return res.status(400).json({ error: "Phone number should be 7-20 digits and may include +, spaces, or dashes." });
    }
    if (!STUDENT_ID_PATTERN.test(normStudentId)) {
      return res.status(400).json({ error: "Student ID should be 5-20 letters/numbers." });
    }

    const existing = await User.findOne({ email: normEmail });
    if (existing) return res.status(409).json({ error: "Account already exists." });
    const studentIdInUse = await User.findOne({ studentId: normStudentId });
    if (studentIdInUse) return res.status(409).json({ error: "Student ID already registered." });

    const passwordHash = await bcrypt.hash(password, 10);
    const { token, hash, expiresAt } = generateToken(32, VERIFY_TOKEN_MINUTES);

    const user = await User.create({
      fullName,
      phoneNumber: normPhone,
      studentId: normStudentId,
      email: normEmail,
      passwordHash,
      emailVerified: false,
      emailVerifyTokenHash: hash,
      emailVerifyExpires: expiresAt
    });

    const link = `${APP_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail(normEmail, link);
    return res.status(200).json({ message: "Registration successful. Check your email to verify." });
  } catch (e) {
    console.error("[register]", e);
    if (e?.code === 11000) {
      if (e.keyPattern?.studentId) {
        return res.status(409).json({ error: "Student ID already registered." });
      }
      if (e.keyPattern?.email) {
        return res.status(409).json({ error: "Account already exists." });
      }
    }
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /auth/verify-email?token=...
router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.redirect("/verify.html?status=invalid");
    const hash = sha256Hex(token);
    const now = new Date();
    const user = await User.findOne({ emailVerifyTokenHash: hash, emailVerifyExpires: { $gt: now } });
    if (!user) return res.redirect("/verify.html?status=invalid");
    user.emailVerified = true;
    user.emailVerifyTokenHash = null;
    user.emailVerifyExpires = null;
    await user.save();
    return res.redirect("/verify.html?status=ok");
  } catch (e) {
    console.error("[verify-email]", e);
    return res.redirect("/verify.html?status=error");
  }
});

// POST /auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(200).json({ message: "If the account exists, an email has been sent." });
    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail }).lean(false);
    if (!user || user.emailVerified) {
      return res.status(200).json({ message: "If the account exists, an email has been sent." });
    }
    const { token, hash, expiresAt } = generateToken(32, VERIFY_TOKEN_MINUTES);
    user.emailVerifyTokenHash = hash;
    user.emailVerifyExpires = expiresAt;
    await user.save();
    const link = `${APP_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail(normEmail, link);
    return res.status(200).json({ message: "Verification email sent." });
  } catch (e) {
    console.error("[resend-verification]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const start = Date.now();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const normEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normEmail }).lean(false);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const now = new Date();
  if (user.lockedUntil && now < user.lockedUntil) {
    return res.status(423).json({ error: `Account locked. Try again at ${user.lockedUntil.toLocaleTimeString()}.`, retryAt: user.lockedUntil.toISOString() });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= LOCKOUT_THRESHOLD) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
    await user.save();
    if (user.lockedUntil) {
      return res.status(423).json({ error: `Account locked. Try again at ${user.lockedUntil.toLocaleTimeString()}.`, retryAt: user.lockedUntil.toISOString() });
    }
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ error: "Email not verified. Please verify before logging in." });
  }

  // Simplified: successful login sets session directly (no OTP/mfa)
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = now;
  await user.save();

  req.session.userId = user._id.toString();
  req.session.email = user.email;
  res.setHeader("X-Auth-Login-Duration", `${Date.now() - start}ms`);
  return res.status(200).json({ message: "Logged in", userId: req.session.userId, expiresIn: idleSecs });
});

// MFA removed in simplified flow

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(200).json({ message: "If the account exists, an email has been sent." });
    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail }).lean(false);
    if (user) {
      const { token, hash, expiresAt } = generateToken(32, RESET_TOKEN_MINUTES);
      user.passwordResetTokenHash = hash;
      user.passwordResetExpires = expiresAt;
      await user.save();
      const link = `${APP_BASE_URL}/reset.html?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(normEmail, link);
    }
    return res.status(200).json({ message: "If the account exists, an email has been sent." });
  } catch (e) {
    console.error("[forgot-password]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: "Token and newPassword are required." });
    if (!PASSWORD_POLICY.test(newPassword)) return res.status(400).json({ error: PASSWORD_REQUIREMENTS });
    const hash = sha256Hex(token);
    const now = new Date();
    const user = await User.findOne({ passwordResetTokenHash: hash, passwordResetExpires: { $gt: now } }).lean(false);
    if (!user) return res.status(400).json({ error: "Invalid or expired token." });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Consider reset as proof of mailbox ownership; mark verified
    user.emailVerified = true;
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    // Clear any previous trust markers if any existed
    await user.save();
    return res.status(200).json({ message: "Password reset successful." });
  } catch (e) {
    console.error("[reset-password]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie("sid");
    res.status(200).json({ message: "Logged out" });
  });
});

export default router;
