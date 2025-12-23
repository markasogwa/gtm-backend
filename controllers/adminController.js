import User from "../models/User.js";
import WalletTransaction from "../models/walletTransaction.js";
// import WalletUpdate from "../models/walletUpdate.js";

export const adminController = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const userData = await Promise.all(
      users.map(async (user) => {
        const wallet = await WalletUpdate.findOne({ user: user._id });
        const txCount = await WalletTransaction.countDocuments({
          user: user._id,
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          balance: wallet?.balance || 0,
          transactionCount: txCount,
        };
      })
    );
    res.json(userData);
  } catch (err) {
    console.error("Error fetching admin user list:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
