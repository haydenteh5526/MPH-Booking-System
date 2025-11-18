// Script to make a user an admin
// Run: node scripts/makeAdmin.mjs <email>

import "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.mjs <email>");
  process.exit(1);
}

try {
  await connectDB(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }
  
  if (user.isAdmin) {
    console.log(`User ${email} is already an admin`);
    process.exit(0);
  }
  
  user.isAdmin = true;
  await user.save();
  
  console.log(`Successfully made ${email} an admin`);
  console.log(`User can now access the admin dashboard at /admin_page/index.html`);
  process.exit(0);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
