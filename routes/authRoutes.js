import express from "express";
import jwt from "jsonwebtoken";
import { login, logout, register } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import ElectricityTransaction from "../models/electricityTransactions.js";
import TVTransaction from "../models/tvTransactions.js";
import { generateAccessToken } from "../utils/genToken.js";

const router = express.Router();

// -------------------- User Auth --------------------

// Registration
router.post("/register", register);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Refresh Token
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Fetch full user info
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ success: true, message: "Access token refreshed" });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// -------------------- User Info --------------------

// Get current user info
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id name email phone isAdmin"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Error fetching /me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- User Transactions --------------------

// Get all user transactions across services
router.get("/transactions/user", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch transactions from all services
    const [airtimeTx, tvTx, electricityTx] = await Promise.all([
      AirtimeTransaction.find({ user: userId }).sort({ createdAt: -1 }),
      TVTransaction.find({ user: userId }).sort({ createdAt: -1 }),
      ElectricityTransaction.find({ user: userId }).sort({ createdAt: -1 }),
    ]);

    // Combine and sort by date
    const allTransactions = [...airtimeTx, ...tvTx, ...electricityTx].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json({ transactions: allTransactions });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch transactions", details: err.message });
  }
});

export default router;
