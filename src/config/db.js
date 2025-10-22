import mongoose from "mongoose";

export async function connectDB(uri) {
  if (mongoose.connection.readyState !== 0) return;
  await mongoose.connect(uri, { dbName: "mph_booking" });
  console.log("[db] connected");
}
