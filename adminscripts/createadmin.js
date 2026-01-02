import mongoose from "mongoose";
import User from "../models/User.js";
import "dotenv/config";

await mongoose.connect(process.env.MONGODB_URI);

const adminData = {
  name: "Admin Mark",
  email: "asogwaoke@gmail.com",
  phone: "08141996501",
  password: "Gmax@Chineke4u",
  isAdmin: true,
};

const existing = await User.findOne({ email: adminData.email });

if (existing) {
  console.log("❌ Admin already exists");
  process.exit(0);
}

await User.create(adminData);

console.log("✅ Admin created successfully");
process.exit(0);
