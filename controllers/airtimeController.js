// controllers/airtimeController.js
import axios from "axios";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import generateTransactionId from "../utils/generateTransactionId.js";
// import validateNigerianPhone from "../utils/phoneValidation.js";

export const rechargeAirtime = async (req, res) => {
  const PROCESSING_FEE = 50;
  const { phone, amount, network } = req.body;
  console.log("🟢 BUY REQUEST RECEIVED:", req.body);

  const userId = req.user._id;

  if (!phone || !amount || !network) {
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
    type: "AIRTIME",
    network,
    phone,
    serviceID: network.toLowerCase(),
    amount: numericAmount,
    amountPaid: amountPaid, // add markup here later
    status: "PENDING",
  });

  console.log("💳 Calling Paystack...");

  // 2️⃣ Initialize Paystack
  const paystackRes = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: req.user.email,
      amount: amountPaid * 100,
      reference: transactionId,
      metadata: {
        transactionId,
        phone,
        network,
      },
      callback_url: `http://localhost:3000/payment-success?transactionId=${transactionId}`, // ✅ Add this
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
};

export const getAirtimeTransaction = async (req, res) => {
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

export const getAirtimeHistory = async (req, res) => {
  try {
    const transactions = await AirtimeTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch airtime history" });
  }
};
