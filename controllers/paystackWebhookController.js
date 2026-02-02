import crypto from "crypto";
import { vtpassClient } from "../config/vtpassClient.js";
import logger from "../logger.js"; // your Pino instance
import AirtimeTransaction from "../models/airtimeTransactions.js";

export const handlePaystackWebhook = async (req, res) => {
  logger.info(
    { path: req.originalUrl, method: req.method },
    "Paystack webhook received",
  );

  const secret = process.env.PAYSTACK_SECRET_KEY;

  // Generate hash from payload
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];

  // Validate signature
  if (hash !== signature) {
    logger.warn(
      { expected: hash, received: signature },
      "Invalid Paystack webhook signature",
    );
    return res.status(401).send("Invalid signature");
  }

  let event;
  try {
    event = JSON.parse(req.body);
  } catch (err) {
    logger.error({ err }, "Failed to parse Paystack webhook payload");
    return res.status(400).send("Invalid payload");
  }

  // Ignore non-charge.success events
  if (event.event !== "charge.success") {
    logger.debug({ event: event.event }, "Ignored non-charge.success webhook");
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
      logger.info(
        { reference },
        "Webhook received for unknown or already processed transaction",
      );
      return res.status(200).send("Already handled");
    }

    // Payment confirmed
    transaction.status = "PAID";
    transaction.amountPaid = amount / 100; // convert kobo → Naira
    transaction.paystackReference = reference;
    transaction.paystackTransactionId = paystackTransactionId;
    transaction.statusHistory.push({ status: "PAID" });

    await transaction.save();
    logger.info(
      { transactionId: reference, amountPaid: transaction.amountPaid },
      "Transaction marked as PAID",
    );

    // 2️⃣ Call VTPass after payment confirmation
    const vtpassResponse = await vtpassClient({
      request_id: reference,
      serviceID: transaction.serviceID,
      phone: transaction.phone,
      amount: transaction.amount,
      variation_code: transaction.variation_code,
    });

    // 3️⃣ Update transaction based on VTU result
    transaction.vtpassResponse = vtpassResponse;

    if (vtpassResponse?.code === "000") {
      transaction.deliveryStatus = "DELIVERED";
    } else if (vtpassResponse?.code === "099") {
      transaction.deliveryStatus = "PENDING";
    } else {
      transaction.deliveryStatus = "FAILED";
    }

    transaction.statusHistory.push({ status: transaction.deliveryStatus });
    await transaction.save();

    logger.info(
      {
        transactionId: reference,
        vtpassCode: vtpassResponse?.code,
        deliveryStatus: transaction.deliveryStatus,
      },
      "VTPass response processed",
    );

    return res.status(200).send("Processed");
  } catch (error) {
    logger.error({ error, reference }, "Webhook processing failed");

    await AirtimeTransaction.findOneAndUpdate(
      { transactionId: reference },
      { status: "FAILED", $push: { statusHistory: { status: "FAILED" } } },
    );

    return res.status(200).send("Failed but acknowledged");
  }
};
