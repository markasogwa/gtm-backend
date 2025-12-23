import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const token = req.cookies.accessToken;
  console.log("Incoming token:", req.cookies.accessToken);

  if (!token) {
    console.log("🚫 No token found in cookies");
    return res
      .status(401)
      .json({ error: "Not authorized, access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log("✅ Decoded User:", decoded);
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired access token" });
  }
};

export default protect;
