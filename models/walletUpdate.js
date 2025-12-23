// import mongoose from "mongoose";

// const walletUpdateSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true, // Ensure one wallet per user
//     },
//     balance: {
//       type: Number,
//       default: 0,
//       min: 0, // Prevent negative balances
//     },
//   },
//   { timestamps: true }
// );

// const WalletUpdate =
//   mongoose.models.WalletUpdate ||
//   mongoose.model("WalletUpdate", walletUpdateSchema);

// export default WalletUpdate;
