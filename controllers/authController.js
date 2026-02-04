import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../logger.js"; // your Pino instance
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/genToken.js";

// ===================== REGISTER =====================
// Create a reusable cookie config
const cookieConfig = {
  httpOnly: true,
  secure: true, // MUST be true for sameSite: "None"
  sameSite: "None",
  path: "/",
};

// ===================== REGISTER =====================
export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    logger.warn(
      { email, ip: req.ip },
      "Registration attempt with missing fields",
    );
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(
        { email, ip: req.ip },
        "Registration attempt with existing email",
      );
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = await User.create({ name, email, phone, password });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    res
      .cookie("accessToken", accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
      });

    logger.info(
      { userId: user._id, email: user.email, ip: req.ip },
      "User registered successfully",
    );
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
      "Login attempt with missing credentials",
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
        ...cookieConfig,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
      });

    logger.info(
      { action: "login", userId: user._id, email: user.email, ip: req.ip },
      "User logged in successfully",
    );
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
    const user = await User.findById(payload.userId).select("_id isAdmin");

    if (!user) {
      logger.warn({ userId: payload.userId }, "User not found during refresh");
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(user);

    res
      .cookie("accessToken", accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Access token refreshed" });

    logger.info(
      { userId: payload.userId },
      "Access token refreshed successfully",
    );
  } catch (err) {
    logger.error({ err }, "Refresh token error");
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

// ===================== LOGOUT =====================
export const logout = (req, res) => {
  res
    .clearCookie("accessToken", cookieConfig)
    .clearCookie("refreshToken", cookieConfig)
    .json({ message: "Logged out successfully" });

  logger.info({ ip: req.ip }, "User logged out");
};
