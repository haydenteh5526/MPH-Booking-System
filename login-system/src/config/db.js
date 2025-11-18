import mongoose from "mongoose";

export async function connectDB(uri) {
  if (mongoose.connection.readyState !== 0) return;
  await mongoose.connect(uri, {
    dbName: "mph_booking",
    serverSelectionTimeoutMS: parseInt(process.env.DB_SELECT_TIMEOUT_MS || "5000", 10),
  });
  console.log("[db] connected");
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await connectDB(process.env.MONGO_URI);
  }
  return mongoose.connection.db;
}
