import crypto from "crypto";
import jwt from "jsonwebtoken";

// Access Token – short-lived (15 min)
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

// Refresh Token – long-lived (7 days) with unique ID for revocation
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};
