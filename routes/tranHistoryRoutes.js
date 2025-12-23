import express from "express";
import protect from "../middleware/authMiddleware.js";
import airtimeTransaction from "../models/airtimeTransactions.js";
import walletTransaction from "../models/walletTransaction.js";

const router = express.Router();

router.get("/user", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Fetch both types
    const [walletTxns, airtimeTxns] = await Promise.all([
      walletTransaction.find({ user: req.user._id }).lean(),
      airtimeTransaction.find({ user: req.user._id }).lean(),
    ]);

    // Tag them with types
    const walletHistory = walletTxns.map((txn) => ({
      ...txn,
      type: txn.type || "wallet funding",
    }));

    const airtimeHistory = airtimeTxns.map((txn) => ({
      ...txn,
      type: txn.type || "airtime recharge",
      phone: txn.phone,
      network: txn.network,
    }));

    // Combine and sort all
    const allTxns = [...walletHistory, ...airtimeHistory].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalPages = Math.ceil(allTxns.length / limit);
    const paginatedTxns = allTxns.slice(skip, skip + limit); // 👈 correct pagination here

    res.json({
      transactions: paginatedTxns,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch paginated transactions:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
