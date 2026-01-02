import express from "express";
import {
  getAirtimeHistory,
  getAirtimeTransaction,
  rechargeAirtime,
} from "../controllers/airtimeController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
// Route to recharge airtime
router.post("/recharge", protect, rechargeAirtime);
router.get("/history", protect, getAirtimeHistory);
// ✅ New route for single transaction
router.get("/transaction/:transactionId", protect, getAirtimeTransaction);

export default router;
