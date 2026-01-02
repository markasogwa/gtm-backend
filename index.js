import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
// import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

// dotenv.config();

// import "./cron/jobs.js"; // auto-start cron jobs
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import airtimeRoutes from "./routes/airtimeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dataPlanRoutes from "./routes/dataPlanRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import electricityRoutes from "./routes/electricityRoutes.js";
import paystackWebhookRoutes from "./routes/paystackWebhookRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import transactionHistory from "./routes/tranHistoryRoutes.js";
import tvRoutes from "./routes/tvRoutes.js";

const app = express();
// Raw
app.use("/api", paystackWebhookRoutes);

// Middleware
app.use(express.json()); // ✅ For normal routes
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// MongoDB Connection
await mongoose
  .connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use((req, res, next) => {
  console.log("🌍 Incoming:", req.method, req.originalUrl);
  next();
});

// Normal route handling
app.use("/api/auth", authRoutes);
app.use("/api/airtime", airtimeRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/dataplans", dataPlanRoutes);
app.use("/api/electricity", electricityRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/transactions", transactionHistory);
// app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", adminAuthRoutes);
app.use("/api", planRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error", details: err.message });
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Airtime API" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
