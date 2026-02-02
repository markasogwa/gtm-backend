import axios from "axios";
import logger from "../logger.js"; // your Pino instance
import AirtimeTransaction from "../models/airtimeTransactions.js";
import generateTransactionId from "../utils/generateTransactionId.js";

export const rechargeData = async (req, res) => {
  const PROCESSING_FEE = 50;
  const userId = req.user._id;

  try {
    const { phone, amount, network, variation_code } = req.body;

    // Log incoming request with context
    logger.info({ userId, body: req.body }, "DATA PURCHASE REQUEST received");

    // Validate required fields
    if (!phone || !amount || !network || !variation_code) {
      logger.warn(
        { userId, body: req.body },
        "Missing required fields for data purchase",
      );
      return res.status(400).json({ error: "All fields are required" });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      logger.warn(
        { userId, amount },
        "Invalid amount provided for data purchase",
      );
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountPaid = numericAmount + PROCESSING_FEE;
    const transactionId = generateTransactionId();

    // 1️⃣ Create pending transaction
    const pendingTransaction = await AirtimeTransaction.create({
      transactionId,
      user: userId,
      type: "DATA",
      network,
      phone,
      serviceID: network.toLowerCase(),
      variation_code,
      amount: numericAmount,
      amountPaid,
      paymentGateway: "PAYSTACK",
      status: "PENDING",
    });

    logger.info(
      { userId, transactionId, amountPaid },
      "Pending DATA transaction created",
    );

    // 2️⃣ Initialize Paystack
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amountPaid * 100, // Paystack uses kobo
        reference: transactionId,
        metadata: { transactionId, phone, network, variation_code },
        callback_url: `http://localhost:3000/payment-success?transactionId=${transactionId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    logger.info(
      { userId, transactionId, paystackRef: paystackRes.data.data.reference },
      "Paystack transaction initialized",
    );

    return res.status(200).json({
      success: true,
      authorization_url: paystackRes.data.data.authorization_url,
    });
  } catch (err) {
    // Structured error logging
    logger.error(
      {
        userId,
        body: req.body,
        error: err.response?.data || err.message,
      },
      "Error in rechargeData",
    );

    return res.status(500).json({
      error: "Failed to initialize payment",
      details: err.response?.data || err.message,
    });
  }
};

export const getDataTransaction = async (req, res) => {
  const userId = req.user._id;
  const { transactionId } = req.params;

  try {
    const transaction = await AirtimeTransaction.findOne({
      transactionId,
      user: userId, // ensure user owns it
    });

    if (!transaction) {
      logger.warn({ userId, transactionId }, "Data transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }

    logger.info(
      { userId, transactionId },
      "Data transaction retrieved successfully",
    );
    return res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    logger.error(
      { userId, transactionId, error: err.message },
      "Failed to fetch data transaction",
    );
    return res.status(500).json({ error: "Failed to fetch transaction" });
  }
};
