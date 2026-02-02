// import bcrypt from "bcryptjs";
// import User from "../models/User.js";
// import {
//   generateAccessToken,
//   generateRefreshToken,
// } from "../utils/genToken.js";

// // ===================== REGISTER =====================
// export const register = async (req, res) => {
//   const { name, email, phone, password } = req.body;

//   if (!name || !email || !phone || !password) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ error: "Email already in use" });

//     const user = await User.create({ name, email, phone, password });

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user._id);

//     res
//       .cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 15 * 60 * 1000, // 15 min
//       })
//       .cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       });

//     res.status(201).json({
//       message: "Registration successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         isAdmin: user.isAdmin,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Registration error:", err.message || err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // ===================== LOGIN =====================
// export const login = async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password)
//     return res.status(400).json({ error: "Email and password required" });

//   try {
//     const user = await User.findOne({ email });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user._id);

//     res
//       .cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 15 * 60 * 1000,
//       })
//       .cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });

//     res.status(200).json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         isAdmin: user.isAdmin,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Login error:", err.message || err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // ===================== REFRESH TOKEN =====================
// export const refreshToken = (req, res) => {
//   const token = req.cookies.refreshToken;
//   if (!token) return res.status(401).json({ error: "No refresh token" });

//   try {
//     const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
//     const accessToken = generateAccessToken({
//       _id: payload.userId,
//       isAdmin: payload.isAdmin || false,
//     });

//     res
//       .cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 15 * 60 * 1000,
//       })
//       .status(200)
//       .json({ message: "Access token refreshed" });
//   } catch (err) {
//     console.error("❌ Refresh token error:", err.message || err);
//     res.status(401).json({ error: "Invalid or expired refresh token" });
//   }
// };

// // ===================== LOGOUT =====================
// export const logout = (req, res) => {
//   res
//     .clearCookie("accessToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     })
//     .clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     });

//   res.json({ message: "Logged out successfully" });
// };

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../logger.js"; // your Pino instance
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/genToken.js";

// ===================== REGISTER =====================
export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    logger.warn(
      { email, ip: req.ip },
      "Registration attempt with missing fields"
    );
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(
        { email, ip: req.ip },
        "Registration attempt with existing email"
      );
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = await User.create({ name, email, phone, password });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    logger.info(
      { userId: user._id, email: user.email, ip: req.ip },
      "User registered successfully"
    );

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    logger.error({ err, email, ip: req.ip }, "Registration error");
    res.status(500).json({ error: "Server error" });
  }
};

// ===================== LOGIN =====================
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn(
      { email, ip: req.ip, hasPassword: !!password },
      "Login attempt with missing credentials"
    );

    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn({ email, ip: req.ip }, "Invalid login attempt");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    logger.info(
      { action: "login", userId: user._id, email: user.email, ip: req.ip },
      "User logged in successfully"
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    logger.error({ err, email }, "Login error");
    res.status(500).json({ error: "Server error" });
  }
};

// ===================== REFRESH TOKEN =====================
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    logger.warn({ ip: req.ip }, "Refresh token missing");
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    // const accessToken = generateAccessToken({
    //   _id: payload.userId,
    //   isAdmin: payload.isAdmin || false,
    // });
    const user = await User.findById(payload.userId).select("_id isAdmin");
    if (!user) {
      logger.warn({ userId: payload.userId }, "User not found during refresh");
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(user);

    logger.info(
      { userId: payload.userId },
      "Access token refreshed successfully"
    );

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Access token refreshed" });
  } catch (err) {
    logger.error({ err }, "Refresh token error");
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

// ===================== LOGOUT =====================
export const logout = (req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

  logger.info({ ip: req.ip }, "User logged out"); // Optional if you have req.user
  res.json({ message: "Logged out successfully" });
};
