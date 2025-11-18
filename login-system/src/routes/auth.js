import "../config/env.js";
import { Router } from "express";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
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

// POST /auth/login
router.post("/login", async (req, res) => {
  const start = Date.now();
  const { email, password, twoFactorCode, rememberMe } = req.body || {};
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

  // Check if 2FA code is provided (for second step of login)
  if (twoFactorCode) {
    // Verify the 2FA code from email
    if (!user.twoFactorCodeHash || !user.twoFactorCodeExpires) {
      return res.status(401).json({ error: "No 2FA code was sent. Please try logging in again." });
    }

    if (new Date() > user.twoFactorCodeExpires) {
      return res.status(401).json({ error: "2FA code has expired. Please request a new one." });
    }

    const codeMatches = await bcrypt.compare(twoFactorCode, user.twoFactorCodeHash);
    if (!codeMatches) {
      return res.status(401).json({ error: "Invalid 2FA code." });
    }

    // Clear the used 2FA code
    user.twoFactorCodeHash = null;
    user.twoFactorCodeExpires = null;
  } else {
    // First step: password is correct, send 2FA code via email
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.twoFactorCodeHash = codeHash;
    user.twoFactorCodeExpires = expiresAt;
    await user.save();

    // Send 2FA code email
    try {
      const { sendTwoFactorEmail } = await import("../utils/mailer.js");
      await sendTwoFactorEmail(normEmail, code);
    } catch (emailErr) {
      console.error("[2FA email]", emailErr);
      return res.status(500).json({ error: "Failed to send 2FA code. Please try again." });
    }

    return res.status(200).json({ 
      requiresTwoFactor: true, 
      message: "A 6-digit code has been sent to your email. Please enter it to continue." 
    });
  }

  // Successful login
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = now;
  await user.save();

  req.session.userId = user._id.toString();
  req.session.email = user.email;
  
  // Handle remember me by setting session cookie max age
  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  } else {
    req.session.cookie.maxAge = null; // Session cookie (expires when browser closes)
  }
  
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

// GET /auth/profile - Get current user profile
router.get("/profile", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await User.findById(req.session.userId).select("-passwordHash -emailVerifyTokenHash -emailVerifyExpires -passwordResetTokenHash -passwordResetExpires -failedAttempts -lockedUntil").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (e) {
    console.error("[profile]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /auth/profile - Update user profile
router.put("/profile", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { fullName, phoneNumber } = req.body || {};
    
    if (!fullName || !phoneNumber) {
      return res.status(400).json({ error: "Full name and phone number are required" });
    }
    
    const trimmedName = String(fullName).trim();
    const trimmedPhone = String(phoneNumber).trim();
    
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: "Please provide your full name" });
    }
    
    if (!PHONE_PATTERN.test(trimmedPhone)) {
      return res.status(400).json({ error: "Phone number should be 7-20 digits and may include +, spaces, or dashes" });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    user.fullName = trimmedName;
    user.phoneNumber = trimmedPhone;
    await user.save();
    
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (e) {
    console.error("[profile update]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/2fa/setup - Generate 2FA secret and QR code
router.post("/2fa/setup", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `MPH Booking (${user.email})`,
      issuer: 'MPH Booking System'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    return res.status(200).json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url
    });
  } catch (e) {
    console.error("[2fa setup]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/2fa/verify-setup - Verify and enable 2FA
router.post("/2fa/verify-setup", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA setup not initiated" });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(generateToken(8, 0).token.toUpperCase());
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );
    await user.save();

    return res.status(200).json({
      message: "2FA enabled successfully",
      backupCodes: backupCodes
    });
  } catch (e) {
    console.error("[2fa verify-setup]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/2fa/disable - Disable 2FA
router.post("/2fa/disable", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    return res.status(200).json({ message: "2FA disabled successfully" });
  } catch (e) {
    console.error("[2fa disable]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /auth/2fa/status - Check if 2FA is enabled
router.get("/2fa/status", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      enabled: user.twoFactorEnabled || false
    });
  } catch (e) {
    console.error("[2fa status]", e);
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

// GET /auth/check-admin
router.get("/check-admin", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ 
      isAdmin: user.isAdmin || false,
      email: user.email
    });
  } catch (e) {
    console.error("[check-admin]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
