import mongoose from "mongoose";

export async function connectDB(primaryUri, options = {}) {
  if (mongoose.connection.readyState !== 0) return;
  const fallbackUri = options.fallbackUri || process.env.MONGO_URI_FALLBACK || process.env.LOCAL_MONGO_URI;
  const uris = [primaryUri, fallbackUri].filter(Boolean);

  let lastError = null;
  for (let index = 0; index < uris.length; index += 1) {
    const uri = uris[index];
    const label = index === 0 ? "primary" : "fallback";
    try {
      await mongoose.connect(uri, {
        dbName: "mph_booking",
        serverSelectionTimeoutMS: Number.parseInt(process.env.DB_SELECT_TIMEOUT_MS || "5000", 10),
      });
      console.log(`[db] connected (${label})`);
      return;
    } catch (err) {
      lastError = err;
      console.error(`[db] connection attempt failed (${label})`, err.message);
    }
  }

  throw lastError || new Error("No MongoDB URI provided.");
}
