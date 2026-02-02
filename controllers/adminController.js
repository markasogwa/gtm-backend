import { vtpassClient } from "../config/vtpassClient.js";
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

      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      req.log.error(
        { err: error, query: req.query },
        "Failed to fetch transactions",
      );
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  },

  // GET single transaction by transactionId
  getTransactionById: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await AirtimeTransaction.findOne({
        transactionId,
      }).populate("user", "name email");

      if (!transaction) {
        req.log.warn({ transactionId }, "Transaction not found");
        return res.status(404).json({ error: "Transaction not found" });
      }

      req.log.info({ transactionId }, "Transaction fetched successfully");
      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      req.log.error(
        { err: error, params: req.params },
        "Failed to fetch transaction by ID",
      );
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  },

  // Retry a transaction manually
  retryTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await AirtimeTransaction.findOne({ transactionId });

      if (!transaction) {
        req.log.warn({ transactionId }, "Retry failed: Transaction not found");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (!["PAID", "SUCCESS"].includes(transaction.status)) {
        req.log.warn(
          { transactionId, status: transaction.status },
          "Cannot retry: Payment incomplete",
        );
        return res
          .status(400)
          .json({ error: "Cannot retry: payment not completed" });
      }

      if (transaction.deliveryStatus === "delivered") {
        req.log.warn(
          { transactionId },
          "Cannot retry: Service already delivered",
        );
        return res
          .status(400)
          .json({ error: "Cannot retry: service already delivered" });
      }

      if (transaction.deliveryStatus === "PENDING") {
        req.log.warn({ transactionId }, "Cannot retry: Service still pending");
        return res
          .status(400)
          .json({ error: "Cannot retry: service is still pending" });
      }

      const vtpassResponse = await vtpassClient({
        request_id: transaction.transactionId,
        serviceID: transaction.serviceID,
        phone: transaction.phone,
        amount: transaction.amount,
        variation_code: transaction.variation_code,
      });

      transaction.status =
        vtpassResponse?.code === "000" ? "SUCCESS" : "FAILED";
      transaction.deliveryStatus =
        vtpassResponse?.code === "000" ? "DELIVERED" : "FAILED";

      transaction.statusHistory.push({
        status: transaction.status,
        deliveryStatus: transaction.deliveryStatus,
        at: new Date(),
      });

      await transaction.save();
      req.log.info(
        {
          transactionId,
          status: transaction.status,
          deliveryStatus: transaction.deliveryStatus,
        },
        "Transaction retried successfully",
      );

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      req.log.error(
        { err: error, params: req.params },
        "Error retrying transaction",
      );
      res.status(500).json({ error: "Failed to retry transaction" });
    }
  },

  // Refund a transaction
  refundTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await AirtimeTransaction.findOne({ transactionId });

      if (!transaction) {
        req.log.warn({ transactionId }, "Refund failed: Transaction not found");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (!["PAID", "SUCCESS"].includes(transaction.status)) {
        req.log.warn(
          { transactionId, status: transaction.status },
          "Cannot refund: Payment not completed",
        );
        return res
          .status(400)
          .json({ error: "Cannot refund: payment not completed" });
      }

      if (transaction.deliveryStatus !== "failed") {
        req.log.warn(
          { transactionId, deliveryStatus: transaction.deliveryStatus },
          "Cannot refund: Service not failed",
        );
        return res
          .status(400)
          .json({ error: "Cannot refund: service was delivered or pending" });
      }

      if (transaction.status === "REFUNDED") {
        req.log.warn({ transactionId }, "Transaction already refunded");
        return res
          .status(400)
          .json({ error: "Transaction has already been refunded" });
      }

      const refundRes = await axios.post(
        "https://api.paystack.co/refund",
        {
          transaction: transaction.paystackTransactionId,
          amount: transaction.amountPaid * 100,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      if (!refundRes.data.status) {
        req.log.error(
          { transactionId, refundRes: refundRes.data },
          "Paystack refund failed",
        );
        return res.status(400).json({ error: "Refund failed at Paystack" });
      }

      transaction.status = "REFUNDED";
      transaction.statusHistory.push({ status: "REFUNDED", at: new Date() });
      await transaction.save();

      req.log.info({ transactionId }, "Transaction refunded successfully");
      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      req.log.error(
        { err: error, params: req.params },
        "Error processing refund",
      );
      res.status(500).json({ error: "Failed to process refund" });
    }
  },
};
