// controllers/airtimeController.js
import mongoose from "mongoose";
import { vtpassClient } from "../config/vtpassClient.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";
import User from "../models/User.js"; // ✅ Replace WalletUpdate
import generateTransactionId from "../utils/generateTransactionId.js";
import validateNigerianPhone from "../utils/phoneValidation.js";

// Recharge Airtime
export const rechargeAirtime = async (req, res) => {
  const { phone, amount, network } = req.body;
  const userId = req.user._id;

  if (!phone || !amount || !network) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const validation = validateNigerianPhone(phone);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const formattedPhone = validation.formatted;
  const transactionId = generateTransactionId();

  try {
    // ✅ Call VTPass first
    const responseData = await vtpassClient({
      serviceID: network.toLowerCase(),
      phone,
      amount,
      request_id: transactionId,
    });

    // ✅ If VTPass response is failed, don’t deduct
    if (responseData.code !== "000") {
      await AirtimeTransaction.create({
        transactionId,
        user: userId,
        network,
        phone,
        amount,
        response: responseData,
        status: "FAILED",
        paid: false,
      });

      return res.status(400).json({
        error: "Recharge failed",
        vtpass: responseData,
      });
    }

    // ✅ If successful, now deduct and save in transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(userId).session(session);

    if (!user || user.wallet < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    user.wallet -= amount;
    await user.save({ session });

    await AirtimeTransaction.insertMany(
      [
        {
          transactionId,
          user: userId,
          network,
          phone,
          amount,
          response: responseData,
          status: "SUCCESS",
          paid: true,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    console.error("❌ Recharge error:", err.response?.data || err.message);

    await AirtimeTransaction.create({
      transactionId,
      user: userId,
      network,
      phone,
      amount,
      response: err.response?.data || err.message,
      status: "FAILED",
      paid: false,
    });

    return res.status(500).json({
      error: "Airtime recharge failed",
      details: err.response?.data || err.message,
    });
  }
};

// Airtime history

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
