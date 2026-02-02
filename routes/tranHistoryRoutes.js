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

    // Fetch all transactions in parallel
    const [airtimeTxns, electricityTxns, tvTxns] = await Promise.all([
      AirtimeTransaction.find({ user: req.user._id }).lean(),
      ElectricityTransaction.find({ user: req.user._id }).lean(),
      TVTransaction.find({ user: req.user._id }).lean(),
    ]);

    // Log transaction counts
    req.log.debug(
      {
        userId: req.user._id,
        counts: {
          airtime: airtimeTxns.length,
          electricity: electricityTxns.length,
          tv: tvTxns.length,
        },
      },
      "Fetched transaction counts",
    );

    const normalizeTxn = (txn) => ({
      ...txn,
      status: txn.deliveryStatus, // frontend uses this
    });

    // Helper to sum amounts of successful transactions
    const sumSuccessful = (txns) =>
      txns
        .filter(
          (tx) =>
            tx.status?.toLowerCase() === "paid" ||
            tx.status?.toLowerCase() === "success" ||
            tx.deliveryStatus?.toLowerCase() === "delivered",
        )
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSpent =
      sumSuccessful(airtimeTxns) +
      sumSuccessful(electricityTxns) +
      sumSuccessful(tvTxns);

    // Tag transaction types for clarity
    const taggedAirtime = airtimeTxns.map((txn) =>
      normalizeTxn({
        ...txn,
        type: "Airtime Recharge",
        phone: txn.phone,
        network: txn.network,
      }),
    );

    const taggedElectricity = electricityTxns.map((txn) =>
      normalizeTxn({
        ...txn,
        type: "Electricity Purchase",
        meter_number: txn.meter_number,
        disco: txn.disco,
      }),
    );

    const taggedTV = tvTxns.map((txn) =>
      normalizeTxn({
        ...txn,
        type: "TV Subscription",
        smartcard_number: txn.smartcard_number,
        provider: txn.provider,
      }),
    );

    // Merge all transactions
    const allTxns = [...taggedAirtime, ...taggedElectricity, ...taggedTV].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
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
    req.log.error(
      { err: error, userId: req.user?._id },
      "Failed to fetch unified transactions",
    );
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
