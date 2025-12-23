import express from "express";
import { getDataPlans } from "../controllers/dataPlanController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/dataplans?serviceID=mtn-data
router.get("/", protect, getDataPlans);

export default router;
