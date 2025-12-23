import crypto from "crypto";
import walletTransaction from "../models/walletTransaction.js";

export const handlePaystackWebhook = async (req, res) => {
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

  console.log("Webhook event triggered:", event.event);

  if (event.event === "charge.success") {
    const { metadata, amount, customer } = event.data;

    const userId = metadata._id; // you set this when initializing Paystack
    const amountInNaira = amount / 100;

    // Update user's wallet
    await walletTransaction.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: amountInNaira } },
      { new: true }
    );

    // Create transaction record
    await walletTransaction.create({
      user: userId,
      type: "Wallet Funding",
      amount: amountInNaira,
      status: "success",
      method: "Paystack",
    });

    console.log("Fund credited successfully for user:", userId);

    return res.status(200).send("Wallet funded and transaction recorded");
  }

  res.status(200).send("Webhook received");
};
