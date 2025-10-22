import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = Router();

const LOCKOUT_THRESHOLD = parseInt(process.env.LOCKOUT_THRESHOLD || "5", 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || "15", 10);
const idleSecs = parseInt(process.env.SESSION_IDLE_MINUTES || "30", 10) * 60;

// POST /auth/login
router.post("/login", async (req, res) => {
  const start = Date.now();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const user = await User.findOne({ email }).lean(false); // need document for save()
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const now = new Date();
  if (user.lockedUntil && now < user.lockedUntil) {
    return res.status(423).json({
      error: `Account locked. Try again at ${user.lockedUntil.toLocaleTimeString()}.`,
      retryAt: user.lockedUntil.toISOString()
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= LOCKOUT_THRESHOLD) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
    await user.save();
    if (user.lockedUntil) {
      return res.status(423).json({
        error: `Account locked. Try again at ${user.lockedUntil.toLocaleTimeString()}.`,
        retryAt: user.lockedUntil.toISOString()
      });
    }
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // success
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = now;
  await user.save();

  req.session.userId = user._id.toString();
  req.session.email = user.email;

  res.setHeader("X-Auth-Login-Duration", `${Date.now() - start}ms`);
  return res.status(200).json({ message: "Logged in", userId: req.session.userId, expiresIn: idleSecs });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie("sid");
    res.status(200).json({ message: "Logged out" });
  });
});

export default router;
