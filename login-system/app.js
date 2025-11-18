import "./src/config/env.js";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import bookingRoutes from "./src/routes/bookings.js";
import adminRoutes from "./src/routes/admin.js";
import { requireAuth } from "./src/middleware/requireAuth.js";
import User from "./src/models/User.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB(process.env.MONGO_URI);

// security + parsers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
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

// Middleware to check page access based on user role
app.use(async (req, res, next) => {
  // Skip middleware for API routes, auth routes, and public files
  if (req.path.startsWith('/auth') || 
      req.path.startsWith('/api') || 
      req.path.startsWith('/bookings') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.svg') ||
      req.path.endsWith('.ico') ||
      req.path.includes('/public/')) {
    return next();
  }

  // Allow access to login/register pages
  if (req.path.includes('/login') || 
      req.path.includes('/register') || 
      req.path.includes('/forgot') || 
      req.path.includes('/reset') ||
      req.path.includes('/verify') ||
      req.path.includes('/resend')) {
    return next();
  }

  // Check if user is authenticated
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId);
      
      if (user && user.isAdmin) {
        // Admin trying to access user pages - redirect to admin
        if (req.path.includes('/landing_page') || 
            req.path.includes('/booking_page') ||
            req.path.includes('/about_page')) {
          return res.redirect('/admin_page/index.html');
        }
      } else if (user && !user.isAdmin) {
        // Regular user trying to access admin pages - redirect to landing
        if (req.path.includes('/admin_page')) {
          return res.redirect('/landing_page/index.html');
        }
      }
    } catch (err) {
      console.error('[Page access check]', err);
    }
  }

  next();
});

// static files for main site pages
app.use(express.static(path.join(__dirname, "..")));

// auth routes
app.use("/auth", authRoutes);

// booking routes
app.use("/bookings", bookingRoutes);

// admin routes
app.use("/api/admin", adminRoutes);

// tiny protected route to verify success
app.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: `Welcome ${req.session.email}!` });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running at http://localhost:${port}`));
