import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI missing from .env");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { dbName: "mph_booking" });
  const result = await mongoose.connection.db.collection("users").deleteMany({});
  console.log(`Deleted ${result.deletedCount} users.`);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("Failed to delete users:", err);
  process.exit(1);
}
