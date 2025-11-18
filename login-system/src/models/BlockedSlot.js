import mongoose from "mongoose";

const blockedSlotSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  court: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  createdBy: { type: String, required: true },
  adminEmail: { type: String, required: true },
  autoBlocked: { type: Boolean, default: false },
  parentBlockId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlockedSlot' }
}, { timestamps: true });

// Index for efficient queries
blockedSlotSchema.index({ sport: 1, court: 1, date: 1, time: 1 });
blockedSlotSchema.index({ date: 1 });

export default mongoose.model("BlockedSlot", blockedSlotSchema);
