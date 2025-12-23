// controllers/electricityController.js
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

// ✅ Return list of discos for dropdown
export const getElectricityDiscos = async (req, res) => {
  try {
    res.json(discos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch discos" });
  }
};

// ✅ Fetch variations (prepaid/postpaid) for selected disco with caching
export const getDiscoVariations = async (req, res) => {
  const { discoId } = req.params;
  const now = Date.now();

  // Check cache
  if (
    discoCache[discoId] &&
    discoCache[discoId].timestamp &&
    now - discoCache[discoId].timestamp < CACHE_DURATION
  ) {
    return res.json(discoCache[discoId].variations);
  }

  try {
    const response = await vtpass.getServiceVariations(discoId);
    const variations = response.variations || [];

    // Store in cache
    discoCache[discoId] = {
      variations,
      timestamp: now,
    };

    res.json(variations);
  } catch (err) {
    console.error("❌ Failed to fetch variations:", err.message || err);
    res.status(500).json({ error: "Failed to fetch variations" });
  }
};

// ✅ Buy electricity
export const buyElectricity = async (req, res) => {
  const { disco, meter_number, amount, variation_code, phone } = req.body;

  try {
    const response = await vtpass.purchaseService({
      serviceID: disco,
      billersCode: meter_number,
      amount,
      variation_code,
      phone,
      request_id: `elec_${Date.now()}`,
    });
    res.json(response);
  } catch (err) {
    console.error("❌ Failed to buy electricity:", err.message || err);
    res.status(500).json({ error: "Failed to buy electricity" });
  }
};
