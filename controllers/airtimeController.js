import AirtimeTransaction from "../models/airtimeTransactions.js";
import generateTransactionId from "../utils/generateTransactionId.js";

export const rechargeAirtime = async (req, res) => {
  const PROCESSING_FEE = 50;
  const { phone, amount, network } = req.body;
  const userId = req.user._id;

  // Log incoming request
  req.log.info({ userId, body: req.body }, "BUY REQUEST RECEIVED");

  // Validate input
  if (!phone || !amount || !network) {
    req.log.warn({ userId, body: req.body }, "Missing required fields");
    return res.status(400).json({ error: "All fields are required" });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 100) {
    req.log.warn({ userId, amount }, "Invalid amount");
    return res.status(400).json({ error: "Invalid amount" });
  }

  const amountPaid = numericAmount + PROCESSING_FEE;
  const transactionId = generateTransactionId();

  try {
    // 1️⃣ Create pending transaction
    const transaction = await AirtimeTransaction.create({
      transactionId,
      user: userId,
      type: "AIRTIME",
      network,
      phone,
      serviceID: network.toLowerCase(),
      amount: numericAmount,
      amountPaid,
      status: "PENDING",
      deliveryStatus: "PENDING",
    });

    req.log.info(
      { userId, transactionId, amountPaid, network, phone },
      "Pending airtime transaction created",
    );

    req.log.info(
      { userId, transactionId, email: req.user.email, amountPaid },
      "Transaction ready for popup payment",
    );

    return res.status(200).json({
      success: true,
      reference: transactionId,
      email: req.user.email,
      amount: amountPaid,
    });
  } catch (err) {
    req.log.error(
      { err, userId, transactionId },
      "Failed to create transaction",
    );
    return res
      .status(500)
      .json({ error: "Failed to process airtime recharge" });
  }
};

export const getAirtimeTransaction = async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  try {
    const transaction = await AirtimeTransaction.findOne({
      transactionId,
      user: userId,
    });

    if (!transaction) {
      req.log.warn({ userId, transactionId }, "Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }

    req.log.info({ userId, transactionId }, "Transaction fetched successfully");
    return res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    req.log.error(
      { err, userId, transactionId },
      "Failed to fetch transaction",
    );
    return res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

export const getAirtimeHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const transactions = await AirtimeTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    req.log.info(
      { userId, count: transactions.length },
      "Fetched airtime transaction history",
    );
    return res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    req.log.error({ err, userId }, "Failed to fetch airtime history");
    return res.status(500).json({ error: "Failed to fetch airtime history" });
  }
};
