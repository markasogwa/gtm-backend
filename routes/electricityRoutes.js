// routes/electricityRoutes.js
import express from "express";
import {
  buyElectricity,
  getDiscoVariations,
  getElectricityDiscos,
} from "../controllers/electricityController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/discos", protect, getElectricityDiscos);
router.get("/:discoId/variations", protect, getDiscoVariations);
router.post("/buy", protect, buyElectricity);

export default router;
