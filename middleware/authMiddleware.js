// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const protect = async (req, res, next) => {
//   const token = req.cookies.accessToken;
//   console.log("Incoming token:", req.cookies.accessToken);

//   if (!token) {
//     console.log("🚫 No token found in cookies");
//     return res
//       .status(401)
//       .json({ error: "Not authorized, access token missing" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//     console.log("✅ Decoded User:", decoded);
//     const user = await User.findById(decoded.userId).select("-password");

//     if (!user) {
//       return res.status(401).json({ error: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid or expired access token" });
//   }
// };

// export default protect;

import jwt from "jsonwebtoken";
import logger from "../logger.js"; // your Pino instance
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const token = req.cookies.accessToken;

  // Log incoming request info without exposing the token
  logger.debug(
    { cookies: Object.keys(req.cookies) },
    "Checking access token in cookies"
  );

  if (!token) {
    logger.warn(
      { cookies: Object.keys(req.cookies) },
      "Access token missing in request cookies"
    );
    return res
      .status(401)
      .json({ error: "Not authorized, access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    logger.debug(
      { userId: decoded.userId },
      "Access token decoded successfully"
    );

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      logger.warn({ userId: decoded.userId }, "User not found in database");
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;

    logger.debug({ userId: user._id }, "User authenticated");
    next();
  } catch (err) {
    logger.error({ err }, "Invalid or expired access token");
    return res.status(403).json({ error: "Invalid or expired access token" });
  }
};

export default protect;
