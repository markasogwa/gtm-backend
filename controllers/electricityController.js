// controllers/electricityController.js
import { nanoid } from "nanoid";
import vtpass from "../providers/vtpassProvider.js";

// Hardcoded discos list for dropdown
const discos = [
  { id: "ikeja-electric", name: "Ikeja Electric" },
  { id: "eko-electric", name: "Eko Electric" },
  { id: "abuja-electric", name: "Abuja Electric" },
  { id: "kano-electric", name: "Kano Electric" },
  { id: "portharcourt-electric", name: "Port Harcourt Electric" },
  { id: "jos-electric", name: "Jos Electric" },
  { id: "ibadan-electric", name: "Ibadan Electric" },
  { id: "kaduna-electric", name: "Kaduna Electric" },
  { id: "benin-electric", name: "Benin Electric" },
  { id: "enugu-electric", name: "Enugu Electric" },
];

// Simple in-memory cache for disco variations
const discoCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ongoingRequests = {};

// ✅ Return list of discos for dropdown
export const getElectricityDiscos = async (req, res) => {
  try {
    res.json(discos);
  } catch (err) {
    console.error("❌ Failed to fetch discos:", err);
    res.status(500).json({ error: "Failed to fetch discos" });
  }
};

// ✅ Fetch variations (prepaid/postpaid) for selected disco with caching
export const getDiscoVariations = async (req, res) => {
  const { discoId } = req.params;

  if (!discoId || !discos.some((d) => d.id === discoId)) {
    return res.status(400).json({ error: "Invalid disco selected" });
  }

  const now = Date.now();

  // Return from cache if valid
  if (
    discoCache[discoId] &&
    now - discoCache[discoId].timestamp < CACHE_DURATION
  ) {
    return res.json(discoCache[discoId].variations);
  }

  // Prevent multiple concurrent calls
  if (ongoingRequests[discoId]) {
    console.log(`⏳ Waiting for ongoing request for ${discoId}`);
    const data = await ongoingRequests[discoId];
    return res.json(data);
  }

  ongoingRequests[discoId] = (async () => {
    try {
      const response = await vtpass.getServiceVariations(discoId);
      const variations = response?.variations ?? [];

      // Store in cache
      discoCache[discoId] = {
        variations,
        timestamp: Date.now(),
      };

      return variations;
    } catch (err) {
      console.error(
        `❌ Failed to fetch variations for ${discoId}:`,
        err.message || err
      );
      throw err;
    } finally {
      delete ongoingRequests[discoId];
    }
  })();

  try {
    const data = await ongoingRequests[discoId];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch variations" });
  }
};

// ✅ Buy electricity
export const buyElectricity = async (req, res) => {
  const { disco, meter_number, amount, variation_code, phone } = req.body;

  // Input validation
  if (!disco || !meter_number || !amount || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!discos.some((d) => d.id === disco)) {
    return res.status(400).json({ error: "Invalid disco" });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // Generate unique request ID
  const request_id = `elec_${nanoid()}`;

  try {
    const response = await vtpass.purchaseService({
      serviceID: disco,
      billersCode: meter_number,
      amount,
      variation_code,
      phone,
      request_id,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Failed to buy electricity:", err.message || err);
    res.status(500).json({ error: "Failed to buy electricity" });
  }
};
