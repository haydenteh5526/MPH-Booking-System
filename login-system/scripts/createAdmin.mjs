// Script to create admin account
// Run: node scripts/createAdmin.mjs

import "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import bcrypt from "bcrypt";

const adminData = {
  email: "admin@tus.ie",
  password: "admin",
  fullName: "System Administrator",
  phoneNumber: "+353 90 123 4567",
  studentId: "ADMIN001"
};

try {
  await connectDB(process.env.MONGO_URI);
  
  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: adminData.email.toLowerCase() });
  
  if (existingAdmin) {
    console.log(`Admin account already exists with email: ${adminData.email}`);
    
    // Update to ensure admin privileges
    if (!existingAdmin.isAdmin) {
      existingAdmin.isAdmin = true;
      existingAdmin.emailVerified = true;
      await existingAdmin.save();
      console.log("Updated existing user to admin status");
    }
    
    console.log("✓ Admin account is ready");
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${adminData.password}`);
    console.log(`  Access: http://localhost:3000/admin_page/index.html`);
    process.exit(0);
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(adminData.password, 10);
  
  // Create new admin user
  const admin = new User({
    email: adminData.email.toLowerCase(),
    passwordHash,
    fullName: adminData.fullName,
    phoneNumber: adminData.phoneNumber,
    studentId: adminData.studentId,
    emailVerified: true, // Pre-verified for admin
    isAdmin: true,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null
  });
  
  await admin.save();
  
  console.log("✓ Admin account created successfully!");
  console.log("");
  console.log("Admin Credentials:");
  console.log("==================");
  console.log(`Email:    ${adminData.email}`);
  console.log(`Password: ${adminData.password}`);
  console.log("");
  console.log("Access the admin dashboard at:");
  console.log("http://localhost:3000/admin_page/index.html");
  console.log("");
  console.log("⚠️  IMPORTANT: Change the password after first login!");
  
  process.exit(0);
} catch (error) {
  console.error("Error creating admin account:", error.message);
  process.exit(1);
}
