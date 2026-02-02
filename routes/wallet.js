// import axios from "axios";
// import express from "express";
// import protect from "../middleware/authMiddleware.js";
// import AirtimeTransaction from "../models/airtimeTransactions.js";
// import generateTransactionId from "../utils/generateTransactionId.js";

// const router = express.Router();

// router.post("/airtime/init", protect, async (req, res) => {
//   const { phone, amount, network, variation_code } = req.body;
//   const userId = req.user._id;

//   if (!phone || !amount || !network) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   const numericAmount = Number(amount);
//   if (isNaN(numericAmount) || numericAmount <= 0) {
//     return res.status(400).json({ error: "Invalid amount" });
//   }

//   const transactionId = generateTransactionId();

//   try {
//     // 1️⃣ Create PENDING AirtimeTransaction
//     await AirtimeTransaction.create({
//       transactionId,
//       user: userId,
//       type: "AIRTIME",
//       network,
//       phone,
//       serviceID: network.toLowerCase(),
//       variation_code,
//       amount: numericAmount, // VTU face value
//       amountPaid: numericAmount, // can adjust if you want markup
//       status: "PENDING",
//     });

//     // 2️⃣ Initialize Paystack payment
//     const response = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       {
//         email: req.user.email,
//         amount: numericAmount * 100, // Paystack expects kobo
//         reference: transactionId,
//         callback_url: "http://localhost:3000/airtime/success",
//         metadata: {
//           transactionId, // track transaction in webhook
//           phone,
//           network,
//           variation_code,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const { authorization_url, reference } = response.data.data;

//     return res.status(200).json({ authorization_url, reference });
//   } catch (err) {
//     console.error(
//       "Paystack initialization error:",
//       err.response?.data || err.message
//     );
//     return res.status(500).json({ error: "Failed to initialize payment" });
//   }
// });

// export default router;
