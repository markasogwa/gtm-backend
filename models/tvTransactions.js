import mongoose from "mongoose";

const tvTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, default: "TV Subscription" }, // fixed type
    provider: { type: String, required: true },
    smartcardNumber: { type: String, required: true },
    variationCode: { type: String, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    response: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const TVTransaction =
  mongoose.models.TVTransaction ||
  mongoose.model("TVTransaction", tvTransactionSchema);

export default TVTransaction;
