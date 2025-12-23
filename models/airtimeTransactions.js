import mongoose from "mongoose";

const airtimeTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Airtime Recharge"],
      default: "Airtime Recharge",
      required: true,
    },
    network: { type: String, required: true },
    phone: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    method: {
      type: String,
      enum: ["wallet"],
      default: "wallet",
    },
    paid: { type: Boolean, default: true },
    response: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("AirtimeTransaction", airtimeTransactionSchema);
