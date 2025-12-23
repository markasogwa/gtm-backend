import express from "express";
import jwt from "jsonwebtoken";
import { login, logout, register } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/genToken.js";

const router = express.Router();

// User Registration
router.post("/register", register);

// User Login
router.post("/login", login);

// User logout
router.post("/logout", logout);

// Refresh Token Route
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(payload.userId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ success: true, message: "Access token refreshed" });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// Add this block inside your authRoutes.js
router.get("/me", protect, async (req, res) => {
  try {
    // Assuming you saved user ID in req.user.id from the protect middleware
    const user = await User.findById(req.user.id).select(
      "name isAdmin _id wallet email"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Error fetching user in /me route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/transactions
router.get("/transactions/user", protect, async (req, res) => {
  try {
    const transactions = await AirtimeTransaction.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });
    res.json({ transactions });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch transactions", details: error.message });
  }
});

export default router;
