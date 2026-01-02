import axios from "axios";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import generateTransactionId from "../utils/generateTransactionId.js";

export const rechargeData = async (req, res) => {
  const PROCESSING_FEE = 50;
  try {
    const { phone, amount, network, variation_code } = req.body;
    console.log("🟢 DATA PURCHASE REQUEST:", req.body);

    const userId = req.user._id;

    if (!phone || !amount || !network || !variation_code) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountPaid = numericAmount + PROCESSING_FEE;

    const transactionId = generateTransactionId();

    // 1️⃣ Create pending transaction
    await AirtimeTransaction.create({
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

    // 2️⃣ Initialize Paystack
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amountPaid * 100,
        reference: transactionId,
        metadata: { transactionId, phone, network, variation_code },
        callback_url: `http://localhost:3000/payment-success?transactionId=${transactionId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return res.status(200).json({
      success: true,
      authorization_url: paystackRes.data.data.authorization_url,
    });
  } catch (error) {
    console.error("❌ rechargeData error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to initialize payment",
      details: err.response?.data || err.message,
    });
  }
};

export const getDataTransaction = async (req, res) => {
  const { transactionId } = req.params;
  try {
    const transaction = await AirtimeTransaction.findOne({
      transactionId,
      user: req.user._id, // ensure user owns it
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};
