import express from "express";
import {
  getDataTransaction,
  rechargeData,
} from "../controllers/dataController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];

// const isValidPhone = (phone) => /^0\d{10}$/.test(phone);

router.post("/recharge", protect, rechargeData);
router.get("/transaction/:transactionId", protect, getDataTransaction);

export default router;
