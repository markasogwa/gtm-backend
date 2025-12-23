import express from "express";
import {
  buyTVSubscription,
  getTVBouquets,
} from "../controllers/tvController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTVBouquets);
router.post("/", protect, buyTVSubscription);

export default router;
