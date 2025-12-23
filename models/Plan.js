import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  planId: String,
  name: String,
  price: Number,
  provider: String,
  serviceID: String,
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Plan", planSchema);
