import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import { requireAuth } from "./src/middleware/requireAuth.js";

// load .env from the app directory after move
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB(process.env.MONGO_URI);

// security + parsers
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session (implements 30-min inactivity by cookie maxAge + rolling)
const idleMs = (parseInt(process.env.SESSION_IDLE_MINUTES || "30", 10)) * 60 * 1000;
app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, dbName: "mph_booking", ttl: idleMs / 1000 }),
  cookie: { httpOnly: true, secure: false, sameSite: "lax", maxAge: idleMs },
  rolling: true
}));

// static login page
app.use(express.static(path.join(__dirname, "public")));

// auth routes
app.use("/auth", authRoutes);

// tiny protected route to verify success
app.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: `Welcome ${req.session.email}!` });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running at http://localhost:${port}`));
