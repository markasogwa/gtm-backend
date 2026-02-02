import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
// import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import logger from "./logger.js";
// dotenv.config();

// import "./cron/jobs.js"; // auto-start cron jobs
// import adminAuthRoutes from "./routes/adminAuthRoutes.js";
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

// trust proxy
app.set("trust proxy", true);

// Attach request logging to all normal routes

app.use(
  pinoHttp({
    logger,
    autoLogging: false,
    // Determine log level based on response or errors
    customLogLevel: (res) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      // Only log method and URL to keep it clean
      req: () => undefined,
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

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
  .then(() => logger.info("MongoDB connected"))
  .catch((err) => logger.error("MongoDB error:", err));

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
// app.use("/api/auth", adminAuthRoutes);
app.use("/api", planRoutes);

// Error handler
app.use((err, req, res, next) => {
  req.log.error(
    {
      err,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    "Unhandled error occurred"
  );
  res.status(500).json({ error: "Server error", details: err.message });
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Airtime API" });
});

const PORT = process.env.PORT || 5000;

logger.info(`Server running on port ${PORT}`);
logger.info(
  `VTPASS BASE URL: ${process.env.VTPASS_BASE_URL ? "Loaded" : "Missing"}`
);
logger.info(`API KEY: ${process.env.VTPASS_API_KEY ? "Loaded" : "Missing"}`);
logger.info(
  `SECRET KEY: ${process.env.VTPASS_SECRET_KEY ? "Loaded" : "Missing"}`
);
console.log(process.env.VTPASS_API_KEY);

// Start server
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
