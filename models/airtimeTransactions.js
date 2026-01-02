import mongoose from "mongoose";

const airtimeTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["AIRTIME", "DATA"],
      required: true,
    },

    serviceID: {
      type: String,
      required: true,
    },

    network: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    variation_code: {
      type: String,
      required: function () {
        return this.type === "DATA";
      },
    },

    amount: {
      type: Number,
      required: true, // VTpass value
    },

    amountPaid: {
      type: Number,
      // required: true, // what user paid you
    },

    paymentGateway: {
      type: String,
      enum: ["PAYSTACK"],
      default: "PAYSTACK",
    },

    // Paystack tracking
    paystackReference: String,
    paystackTransactionId: String,

    // VTpass tracking
    vtpassRequestId: String,

    vtpassResponse: {
      type: Object,
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("AirtimeTransaction", airtimeTransactionSchema);
