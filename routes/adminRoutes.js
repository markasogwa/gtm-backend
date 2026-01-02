import express from "express";
import { adminController } from "../controllers/adminController.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

// List all transactions with optional filters
router.get(
  "/transactions",
  protect,
  adminOnly,
  adminController.getAllTransactions
);

// View a single transaction
router.get(
  "/transactions/:transactionId",
  protect,
  adminOnly,
  adminController.getTransactionById
);

// Retry a failed transaction manually
router.post(
  "/transactions/:transactionId/retry",
  protect,
  adminOnly,
  adminController.retryTransaction
);

// Refund a successful transaction manually
router.post(
  "/transactions/:transactionId/refund",
  protect,
  adminOnly,
  adminController.refundTransaction
);

export default router;
