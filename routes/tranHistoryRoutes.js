import express from "express";
import protect from "../middleware/authMiddleware.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import ElectricityTransaction from "../models/electricityTransactions.js";
import TVTransaction from "../models/tvTransactions.js";

const router = express.Router();

router.get("/user", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // const totalSpent = await Transaction.aggregate([
    //   { $match: { user: req.user._id } },
    //   { $group: { _id: null, total: { $sum: "$amount" } } },
    // ]);

    // res.json({
    //   transactions,
    //   totalPages: Math.ceil(totalCount / limit),
    //   totalSpent: totalSpent[0]?.total || 0,
    // });

    // Fetch all transactions in parallel
    const [airtimeTxns, electricityTxns, tvTxns] = await Promise.all([
      AirtimeTransaction.find({ user: req.user._id }).lean(),
      ElectricityTransaction.find({ user: req.user._id }).lean(),
      TVTransaction.find({ user: req.user._id }).lean(),
    ]);

    // Helper to sum amounts of successful transactions
    const sumSuccessful = (txns) =>
      txns
        .filter(
          (tx) =>
            tx.status?.toLowerCase() === "success" ||
            tx.status?.toLowerCase() === "successful"
        )
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Then compute totalSpent like this:
    const totalSpent =
      sumSuccessful(airtimeTxns) +
      sumSuccessful(electricityTxns) +
      sumSuccessful(tvTxns);

    // Tag transaction types for clarity
    const taggedAirtime = airtimeTxns.map((txn) => ({
      ...txn,
      type: "Airtime Recharge",
      phone: txn.phone,
      network: txn.network,
    }));

    const taggedElectricity = electricityTxns.map((txn) => ({
      ...txn,
      type: "Electricity Purchase",
      meter_number: txn.meter_number,
      disco: txn.disco,
    }));

    const taggedTV = tvTxns.map((txn) => ({
      ...txn,
      type: "TV Subscription",
      smartcard_number: txn.smartcard_number,
      provider: txn.provider,
    }));

    // Merge all transactions
    const allTxns = [...taggedAirtime, ...taggedElectricity, ...taggedTV].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalCount = allTxns.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination
    const paginatedTxns = allTxns.slice(skip, skip + limit);

    res.json({
      transactions: paginatedTxns,
      totalPages,
      currentPage: page,
      totalCount,
      totalSpent,
    });
  } catch (error) {
    console.error("Failed to fetch unified transactions:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
