import "../config/env.js";
import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import { generateOtp6, generateToken, sha256Hex, userAgentHash } from "../utils/tokens.js";
import { sendVerificationEmail, sendLoginOtpEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const router = Router();

const LOCKOUT_THRESHOLD = parseInt(process.env.LOCKOUT_THRESHOLD || "5", 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || "15", 10);
const idleSecs = parseInt(process.env.SESSION_IDLE_MINUTES || "30", 10) * 60;

const VERIFY_TOKEN_MINUTES = parseInt(process.env.VERIFY_TOKEN_MINUTES || "1440", 10);
const OTP_MINUTES = parseInt(process.env.OTP_MINUTES || "10", 10);
const RESET_TOKEN_MINUTES = parseInt(process.env.RESET_TOKEN_MINUTES || "60", 10);
const TRUSTED_DEVICE_DAYS = parseInt(process.env.TRUSTED_DEVICE_DAYS || "30", 10);
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "student.tus.ie").toLowerCase();

function getCookie(req, name) {
  const raw = req.headers?.cookie || "";
  const parts = raw.split(/;\s*/).map(p => p.split("=", 2)).filter(a => a.length === 2);
  const found = parts.find(([k]) => k === name);
  return found ? decodeURIComponent(found[1]) : null;
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    const normEmail = String(email).trim().toLowerCase();
    if (!normEmail.endsWith("@" + ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({ error: `Email must be @${ALLOWED_EMAIL_DOMAIN}` });
    }
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

    const existing = await User.findOne({ email: normEmail });
    if (existing) return res.status(409).json({ error: "Account already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const { token, hash, expiresAt } = generateToken(32, VERIFY_TOKEN_MINUTES);

    const user = await User.create({
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

  // Check trusted device cookie
  const did = getCookie(req, "did");
  let trusted = false;
  if (did && Array.isArray(user.trustedDevices) && user.trustedDevices.length) {
    const didHash = sha256Hex(did);
    const uaHash = userAgentHash(req.headers["user-agent"] || "");
    const td = user.trustedDevices.find(d => d.deviceIdHash === didHash && d.userAgentHash === uaHash && d.expiresAt && d.expiresAt > new Date());
    if (td) {
      trusted = true;
      td.lastSeenAt = new Date();
      await user.save();
    }
  }

  if (trusted) {
    // success without OTP
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = now;
    await user.save();

    req.session.userId = user._id.toString();
    req.session.email = user.email;
    res.setHeader("X-Auth-Login-Duration", `${Date.now() - start}ms`);
    return res.status(200).json({ message: "Logged in", userId: req.session.userId, expiresIn: idleSecs, trusted: true });
  }

  // Generate and email OTP, require MFA verification step
  const { code, hash, expiresAt } = generateOtp6(OTP_MINUTES);
  user.loginOtpHash = hash;
  user.loginOtpExpires = expiresAt;
  await user.save();
  await sendLoginOtpEmail(user.email, code);
  return res.status(401).json({ error: "Verification code sent to your email.", mfaRequired: true });
});

// POST /auth/mfa-verify
router.post("/mfa-verify", async (req, res) => {
  try {
    const { email, code, rememberMe } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: "Email and code are required." });
    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail }).lean(false);
    if (!user) return res.status(400).json({ error: "Invalid code." });

    const now = new Date();
    if (!user.loginOtpHash || !user.loginOtpExpires || now > user.loginOtpExpires) {
      return res.status(400).json({ error: "Code expired or not requested." });
    }
    if (sha256Hex(String(code)) !== user.loginOtpHash) {
      return res.status(400).json({ error: "Invalid code." });
    }

    // success
    user.loginOtpHash = null;
    user.loginOtpExpires = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = now;

    // Trust this device if requested
    if (rememberMe) {
      const deviceId = crypto.randomBytes(24).toString("hex");
      const didHash = sha256Hex(deviceId);
      const uaHash = userAgentHash(req.headers["user-agent"] || "");
      const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000);
      user.trustedDevices = Array.isArray(user.trustedDevices) ? user.trustedDevices : [];
      user.trustedDevices.push({ deviceIdHash: didHash, userAgentHash: uaHash, createdAt: now, lastSeenAt: now, expiresAt });
      // set persistent device cookie
      res.cookie("did", deviceId, { httpOnly: true, sameSite: "lax", secure: false, maxAge: TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000 });
    }

    await user.save();

    req.session.userId = user._id.toString();
    req.session.email = user.email;
    return res.status(200).json({ message: "Logged in" });
  } catch (e) {
    console.error("[mfa-verify]", e);
    return res.status(500).json({ error: "Server error" });
  }
});

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
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    const hash = sha256Hex(token);
    const now = new Date();
    const user = await User.findOne({ passwordResetTokenHash: hash, passwordResetExpires: { $gt: now } }).lean(false);
    if (!user) return res.status(400).json({ error: "Invalid or expired token." });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.trustedDevices = [];
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
    res.clearCookie("did");
    res.status(200).json({ message: "Logged out" });
  });
});

export default router;
