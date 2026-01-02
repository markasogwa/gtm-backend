import express from "express";
// import ProviderStatus from "../models/ProviderStatus.js";
import { getCachedPlans } from "../services/planService.js";

const router = express.Router();

// get cached plans
router.get("/plans", async (req, res) => {
  const { serviceID } = req.query;
  if (!serviceID) return res.status(400).json({ error: "serviceID required" });

  const plans = await getCachedPlans(serviceID);
  res.json(plans);
});

// get provider statuses
// router.get("/status", async (req, res) => {
//   const statuses = await ProviderStatus.find({});
//   res.json(statuses);
// });

export default router;
