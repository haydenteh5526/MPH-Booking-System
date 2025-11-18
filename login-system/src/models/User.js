import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true, unique: true },
  email: { type: String, unique: true, required: true, index: true },
  passwordHash: { type: String, required: true },

  emailVerified: { type: Boolean, default: false },
  emailVerifyTokenHash: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },

  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },

  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
