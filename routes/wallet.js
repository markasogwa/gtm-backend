import axios from "axios";
import express from "express";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
const router = express.Router();

// ===================== FUND WALLET =====================
router.post("/fund", protect, async (req, res) => {
  const { amount, email } = req.body;

  if (!email || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount or email" });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        callback_url: "http://localhost:3000/payment-success", // Frontend success page
        metadata: {
          userId: req.user._id, // For webhook processing
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = response.data.data;

    return res.status(200).json({
      authorization_url,
      reference,
    });
  } catch (err) {
    console.error("Paystack error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// ✅ Get wallet balance
router.get("/balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("wallet");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ balance: user.wallet });
  } catch (err) {
    console.error("Failed to fetch balance:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
