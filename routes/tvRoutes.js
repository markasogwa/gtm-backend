import express from "express";
import {
  buyTvSubscription,
  getTVBouquets,
} from "../controllers/tvController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTVBouquets);
router.post("/", protect, buyTvSubscription);

export default router;
