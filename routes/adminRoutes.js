import express from "express";
import { adminController } from "../controllers/adminController.js";
import adminOnly from "../middleware/adminMiddleware.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ GET all users with wallet balances
router.get("/users", protect, adminOnly, adminController);

export default router;
