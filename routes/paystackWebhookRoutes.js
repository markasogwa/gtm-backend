// routes/webhook.js
import express from "express";
import { handlePaystackWebhook } from "../controllers/paystackWebhookController.js";

const router = express.Router();

router.post(
  "/wallet/webhook",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook
);

export default router;
