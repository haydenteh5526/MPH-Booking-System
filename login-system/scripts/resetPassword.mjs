import dotenv from "dotenv"; import path from "path"; import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const uri = process.env.MONGO_URI;
const email = process.argv[2] || "test@example.com";
const plain = process.argv[3] || "Password123!";

await mongoose.connect(uri, { dbName: "mph_booking" });

const passwordHash = await bcrypt.hash(plain, 10);

await mongoose.connection.db.collection("users").updateOne(
  { email },
  { $set: { email, passwordHash, failedAttempts: 0, lockedUntil: null, lastLoginAt: null, emailVerified: true } },
  { upsert: true }
);

const user = await mongoose.connection.db.collection("users").findOne({ email });
const ok = await bcrypt.compare(plain, user.passwordHash);
console.log({ email, setHashLen: String(user.passwordHash || "").length, compareOK: ok });

await mongoose.disconnect();
process.exit(0);
