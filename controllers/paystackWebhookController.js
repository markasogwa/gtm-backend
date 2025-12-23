import crypto from "crypto";
import User from "../models/User.js";
import WalletTransaction from "../models/walletTransaction.js";

export const handlePaystackWebhook = async (req, res) => {
  console.log("👉 Webhook endpoint hit");
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
  console.log("📨 Paystack event received:", event.event);

  if (event.event === "charge.success") {
    const { metadata, amount, reference } = event.data;
    const userId = metadata.userId;
    const amountInNaira = amount / 100;

    try {
      // Prevent duplicate funding using reference
      const existing = await WalletTransaction.findOne({ reference });
      if (existing) {
        console.log("🔁 Duplicate webhook received. Ignoring.");
        return res.status(200).send("Already processed");
      }

      // ✅ Update wallet balance
      await User.findByIdAndUpdate(
        userId,
        { $inc: { wallet: amountInNaira } },
        { new: true }
      );

      // ✅ Record the transaction
      await WalletTransaction.create({
        user: userId,
        amount: amountInNaira,
        method: "Paystack",
        reference,
        status: "success",
        type: "Wallet Funding",
      });

      console.log("✅ Wallet funded for user:", userId);
      return res.status(200).send("Success");
    } catch (error) {
      console.error("❌ Error processing webhook:", error.message);
      return res.status(500).send("Internal Server Error");
    }
  }

  res.status(200).send("OK");
};
