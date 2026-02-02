// import crypto from "crypto";
// import { vtpassClient } from "../config/vtpassClient.js";
// import AirtimeTransaction from "../models/airtimeTransactions.js";

// export const handlePaystackWebhook = async (req, res) => {
//   const secret = process.env.PAYSTACK_SECRET_KEY;

//   const hash = crypto
//     .createHmac("sha512", secret)
//     .update(req.body)
//     .digest("hex");

//   const signature = req.headers["x-paystack-signature"];

//   if (hash !== signature) {
//     return res.status(401).send("Invalid signature");
//   }

//   const event = JSON.parse(req.body);

//   if (event.event !== "charge.success") {
//     return res.status(200).send("Ignored");
//   }

//   const { reference } = event.data;

//   try {
//     const transaction = await AirtimeTransaction.findOne({
//       transactionId: reference,
//       status: "PENDING",
//     });

//     if (!transaction) {
//       return res.status(200).send("Already handled or invalid reference");
//     }

//     // Call VTPass to deliver airtime/data
//     const vtpassResponse = await vtpassClient({
//       request_id: reference,
//       serviceID: transaction.serviceID,
//       phone: transaction.phone,
//       amount: transaction.amount,
//       variation_code: transaction.variation_code,
//     });

//     transaction.vtpassResponse = vtpassResponse;
//     transaction.status = vtpassResponse.code === "000" ? "SUCCESS" : "FAILED";

//     await transaction.save();

//     console.log(
//       `Transaction ${reference} processed. Status: ${transaction.status}`
//     );

//     return res.status(200).send("Processed");
//   } catch (error) {
//     console.error("Webhook processing error:", error.message);

//     await AirtimeTransaction.findOneAndUpdate(
//       { transactionId: reference },
//       { status: "FAILED" }
//     );

//     return res.status(200).send("Failed but acknowledged");
//   }
// };
