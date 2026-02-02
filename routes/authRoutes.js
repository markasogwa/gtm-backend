// import express from "express";
// import jwt from "jsonwebtoken";
// import { login, logout, register } from "../controllers/authController.js";
// import protect from "../middleware/authMiddleware.js";
// import User from "../models/User.js";
// import AirtimeTransaction from "../models/airtimeTransactions.js";
// import ElectricityTransaction from "../models/electricityTransactions.js";
// import TVTransaction from "../models/tvTransactions.js";
// import { generateAccessToken } from "../utils/genToken.js";

// const router = express.Router();

// // -------------------- User Auth --------------------

// // Registration
// router.post("/register", register);

// // Login
// router.post("/login", login);

// // Logout
// router.post("/logout", logout);

// // Refresh Token
// router.post("/refresh", async (req, res) => {
//   const refreshToken = req.cookies.refreshToken;
//   if (!refreshToken)
//     return res.status(401).json({ error: "No refresh token provided" });

//   try {
//     const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//     // Fetch full user info
//     const user = await User.findById(payload.userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const newAccessToken = generateAccessToken(user);

//     res.cookie("accessToken", newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//       maxAge: 15 * 60 * 1000, // 15 minutes
//     });

//     res.json({ success: true, message: "Access token refreshed" });
//   } catch (err) {
//     console.error("Refresh token error:", err);
//     return res.status(403).json({ error: "Invalid or expired refresh token" });
//   }
// });

// // -------------------- User Info --------------------

// // Get current user info
// router.get("/me", protect, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       "_id name email phone isAdmin"
//     );
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json({ user });
//   } catch (err) {
//     console.error("Error fetching /me:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // -------------------- User Transactions --------------------

// // Get all user transactions across services
// router.get("/transactions/user", protect, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Fetch transactions from all services
//     const [airtimeTx, tvTx, electricityTx] = await Promise.all([
//       AirtimeTransaction.find({ user: userId }).sort({ createdAt: -1 }),
//       TVTransaction.find({ user: userId }).sort({ createdAt: -1 }),
//       ElectricityTransaction.find({ user: userId }).sort({ createdAt: -1 }),
//     ]);

//     // Combine and sort by date
//     const allTransactions = [...airtimeTx, ...tvTx, ...electricityTx].sort(
//       (a, b) => b.createdAt - a.createdAt
//     );

//     res.json({ transactions: allTransactions });
//   } catch (err) {
//     console.error("Error fetching transactions:", err);
//     res
//       .status(500)
//       .json({ error: "Failed to fetch transactions", details: err.message });
//   }
// });

// export default router;

import express from "express";
import jwt from "jsonwebtoken";
import { login, logout, register } from "../controllers/authController.js";
import logger from "../logger.js"; // Pino
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
  if (!refreshToken) {
    logger.warn("Refresh token missing", { route: "/refresh", ip: req.ip });
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(payload.userId);
    if (!user) {
      logger.warn("User not found during token refresh", {
        userId: payload.userId,
      });
      return res.status(404).json({ error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    logger.info("Access token refreshed successfully", { userId: user._id });
    res.json({ success: true, message: "Access token refreshed" });
  } catch (err) {
    logger.error({ err, route: "/refresh" }, "Refresh token error");
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
    if (!user) {
      logger.warn("User not found on /me", { userId: req.user.id });
      return res.status(404).json({ message: "User not found" });
    }

    logger.info("User info fetched", { userId: req.user.id });
    res.json({ user });
  } catch (err) {
    logger.error(
      { err, route: "/me", userId: req.user.id },
      "Error fetching user info"
    );
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- User Transactions --------------------

// Get all user transactions across services
router.get("/transactions/user", protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const [airtimeTx, tvTx, electricityTx] = await Promise.all([
      AirtimeTransaction.find({ user: userId }).sort({ createdAt: -1 }),
      TVTransaction.find({ user: userId }).sort({ createdAt: -1 }),
      ElectricityTransaction.find({ user: userId }).sort({ createdAt: -1 }),
    ]);

    const allTransactions = [...airtimeTx, ...tvTx, ...electricityTx].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    logger.info("Fetched all user transactions", {
      userId,
      total: allTransactions.length,
    });
    res.json({ transactions: allTransactions });
  } catch (err) {
    logger.error(
      { err, route: "/transactions/user", userId },
      "Error fetching user transactions"
    );
    res
      .status(500)
      .json({ error: "Failed to fetch transactions", details: err.message });
  }
});

export default router;
