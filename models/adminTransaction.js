import mongoose from "mongoose";

const adminTransactionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SUCCESS", "FAILED", "REFUNDED"],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    note: String, // optional reason or comment for status change
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
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
      enum: ["AIRTIME", "DATA", "TV", "ELECTRICITY", "OTHER"],
      required: true,
    },

    serviceID: {
      type: String,
      required: true,
    },

    network: String, // e.g., MTN, GLO, DSTV
    phone: String, // for airtime/data
    meterNumber: String, // for electricity
    tvPackage: String, // for TV subscriptions

    variation_code: String, // for data/airtime plans
    serviceDetails: Object, // generic object for storing extra info per service

    amount: {
      type: Number,
      required: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    paymentGateway: {
      type: String,
      enum: ["PAYSTACK", "MONNIFY", "OTHER"],
      default: "PAYSTACK",
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    statusHistory: {
      type: [adminTransactionSchema],
      default: [],
    },

    paystackReference: String,
    paystackTransactionId: String,

    vtpassResponse: Object, // can store response for airtime/data/TV
    otherResponse: Object, // optional for other services
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
