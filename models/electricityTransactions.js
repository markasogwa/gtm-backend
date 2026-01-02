import mongoose from "mongoose";

const electricityTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Electricity Purchase"],
      default: "Electricity Purchase",
    },
    disco: { type: String, required: true }, // e.g., ikeja-electric
    meterNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    response: { type: Object }, // raw VTpass response
  },
  { timestamps: true }
);

const ElectricityTransaction =
  mongoose.models.ElectricityTransaction ||
  mongoose.model("ElectricityTransaction", electricityTransactionSchema);

export default ElectricityTransaction;
