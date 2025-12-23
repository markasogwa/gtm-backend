import express from "express";
import { vtpassClient } from "../config/vtpassClient.js";

const router = express.Router();

// 🔒 Allowed service IDs
const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];

// 📌 Validation helpers
function isValidPhone(phone) {
  // Must be 11 digits and start with 0
  return /^0\d{10}$/.test(phone);
}

router.post("/", async (req, res) => {
  const { serviceID, phone, variation_code } = req.body;

  // ✅ Validate inputs before calling VTPass
  if (!serviceID || !VALID_SERVICES.includes(serviceID)) {
    return res.status(400).json({
      error: `Invalid serviceID. Must be one of: ${VALID_SERVICES.join(", ")}`,
    });
  }

  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({
      error: "Invalid phone number. Must start with 0 and be 11 digits long.",
    });
  }

  if (!variation_code || typeof variation_code !== "string") {
    return res.status(400).json({
      error: "variation_code is required and must be a string.",
    });
  }

  try {
    const result = await vtpassClient({ serviceID, phone, variation_code });

    // ✅ Double-check VTPass response
    if (!result || result.code !== "000") {
      return res.status(502).json({
        error: result?.response_description || "Failed to process purchase",
        raw: result,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("❌ VTPass error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

export default router;
