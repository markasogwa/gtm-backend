import crypto from "crypto";
import { vtpassClient } from "../config/vtpassClient.js";
import AirtimeTransaction from "../models/airtimeTransactions.js";

export const handlePaystackWebhook = async (req, res) => {
  console.log("🔥 PAYSTACK WEBHOOK HIT");

  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body);

  if (event.event !== "charge.success") {
    return res.status(200).send("Ignored");
  }

  const { reference, amount, id: paystackTransactionId } = event.data;

  try {
    // 1️⃣ Find pending VTU transaction
    const transaction = await AirtimeTransaction.findOne({
      transactionId: reference,
      status: "PENDING",
    });

    if (!transaction) {
      // Already processed or invalid reference
      return res.status(200).send("Already handled");
    }

    // mpney confirmed - mark as paid
    transaction.status = "PAID";
    transaction.amountPaid = amount / 100;
    transaction.paystackReference = reference;
    transaction.paystackTransactionId = paystackTransactionId;
    transaction.statusHistory.push({ status: "PAID" });

    await transaction.save();

    // 2️⃣ Call VTPass after payment is confirmed
    const vtpassResponse = await vtpassClient({
      request_id: reference,
      serviceID: transaction.serviceID,
      phone: transaction.phone,
      amount: transaction.amount,
      variation_code: transaction.variation_code,
    });

    // 3️⃣ Update transaction based on VTU result
    transaction.vtpassResponse = vtpassResponse;
    // transaction.vtpassResponse = vtpassResponse?.request_id;

    if (vtpassResponse?.code === "000") {
      transaction.deliveryStatus = "DELIVERED";
    } else if (vtpassResponse?.code === "099") {
      transaction.deliveryStatus = "PENDING";
    } else {
      transaction.deliveryStatus = "FAILED";
    }

    transaction.statusHistory.push({ status: transaction.deliveryStatus });

    await transaction.save();

    return res.status(200).send("Processed");
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);

    await AirtimeTransaction.findOneAndUpdate(
      { transactionId: reference },
      { status: "FAILED", $push: { statusHistory: { status: "FAILED" } } }
    );

    return res.status(200).send("Failed but acknowledged");
  }
};
