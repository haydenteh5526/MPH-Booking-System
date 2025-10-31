import mongoose from "mongoose";

const trustedDeviceSchema = new mongoose.Schema({
  deviceIdHash: { type: String, required: true },
  userAgentHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  passwordHash: { type: String, required: true },

  emailVerified: { type: Boolean, default: false },
  emailVerifyTokenHash: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },

  loginOtpHash: { type: String, default: null },
  loginOtpExpires: { type: Date, default: null },

  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },

  trustedDevices: { type: [trustedDeviceSchema], default: [] },

  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
