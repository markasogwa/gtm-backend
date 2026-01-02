import { vtpassClient } from "../config/vtpassClient.js"; // your existing client
// import Transaction from "../models/adminTransaction.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";

export const adminController = {
  // GET all transactions with optional filters
  getAllTransactions: async (req, res) => {
    try {
      const { type, status, user } = req.query;
      const filter = {};

      if (type) filter.type = type.toUpperCase();
      if (status) filter.status = status.toUpperCase();
      if (user) filter.user = user;

      const transactions = await AirtimeTransaction.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 });
      console.log("Transactions found:", transactions.length);

      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      console.error("Admin getAllTransactions error:", error.message);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  },

  // GET single transaction by transactionId
  getTransactionById: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findOne({ transactionId }).populate(
        "user",
        "name email"
      );

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      console.error("Admin getTransactionById error:", error.message);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  },

  // Retry a transaction manually (e.g., VTpass call)
  retryTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status === "SUCCESS") {
        return res
          .status(400)
          .json({ error: "Transaction already successful" });
      }

      // Call VTpass manually
      const vtpassResponse = await vtpassClient({
        request_id: transaction.transactionId,
        serviceID: transaction.serviceID,
        phone: transaction.phone,
        amount: transaction.amount,
        variation_code: transaction.variation_code,
      });

      transaction.vtpassResponse = vtpassResponse;
      if (vtpassResponse?.code === "000") {
        transaction.status = "SUCCESS";
      } else {
        transaction.status = "FAILED";
      }

      transaction.statusHistory.push({ status: transaction.status });
      await transaction.save();

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      console.error("Admin retryTransaction error:", error.message);
      res.status(500).json({ error: "Failed to retry transaction" });
    }
  },

  // Refund a transaction manually
  refundTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "SUCCESS") {
        return res
          .status(400)
          .json({ error: "Only successful transactions can be refunded" });
      }

      // Logic to process refund via payment gateway if needed
      // For now, just mark as REFUNDED manually
      transaction.status = "REFUNDED";
      transaction.statusHistory.push({ status: "REFUNDED" });

      await transaction.save();

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      console.error("Admin refundTransaction error:", error.message);
      res.status(500).json({ error: "Failed to refund transaction" });
    }
  },
};
