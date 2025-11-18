import User from "../models/User.js";

export function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated." });
  next();
}

// Middleware to ensure only regular users can access (not admins)
export async function requireRegularUser(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ error: "Admins cannot access user pages. Please use the admin dashboard." });
    }
    
    req.user = user;
    next();
  } catch (e) {
    console.error("[requireRegularUser]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Middleware to ensure only admins can access
export async function requireAdmin(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.adminUser = user;
    next();
  } catch (e) {
    console.error("[requireAdmin]", e);
    return res.status(500).json({ error: "Server error" });
  }
}
