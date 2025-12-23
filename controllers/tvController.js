// controllers/tvController.js
import vtpass from "../providers/vtpassProvider.js";

// Simple in-memory cache
const tvCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Get TV bouquets with caching and include price
export const getTVBouquets = async (req, res) => {
  const { provider } = req.query; // e.g. dstv, gotv, startimes
  if (!provider) {
    return res.status(400).json({ error: "Provider is required" });
  }

  try {
    const now = Date.now();

    // Check cache
    if (
      tvCache[provider] &&
      tvCache[provider].timestamp &&
      now - tvCache[provider].timestamp < CACHE_DURATION
    ) {
      return res.json(tvCache[provider].variations);
    }

    // Fetch from VTpass if not cached or expired
    const response = await vtpass.getServiceVariations(provider);
    const rawVariations = response.variations || [];

    // Map variations to include `amount` for frontend
    const variations = rawVariations.map((v) => ({
      name: v.name,
      variation_code: v.variation_code,
      amount: v.variation_amount || 0, // Price for this variation
    }));

    // Store mapped variations in cache
    tvCache[provider] = {
      variations,
      timestamp: now,
    };

    res.json(variations);
  } catch (err) {
    console.error("❌ Failed to fetch TV bouquets:", err.message || err);
    res.status(500).json({ error: "Failed to fetch bouquets" });
  }
};

// ✅ Buy TV subscription
export const buyTVSubscription = async (req, res) => {
  const { provider, smartcard_number, variation_code, phone, amount } =
    req.body;

  if (!provider || !smartcard_number || !variation_code || !phone || !amount) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const response = await vtpass.purchaseService({
      serviceID: provider,
      billersCode: smartcard_number,
      variation_code,
      phone,
      amount, // Amount comes from frontend based on selected variation
      request_id: `tv_${Date.now()}`,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Failed to buy TV subscription:", err.message || err);
    res.status(500).json({ error: "Failed to buy TV subscription" });
  }
};
