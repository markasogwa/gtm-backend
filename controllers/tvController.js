// controllers/tvController.js
import { nanoid } from "nanoid";
import vtpass from "../providers/vtpassProvider.js";

// List of allowed providers
const ALLOWED_PROVIDERS = ["dstv", "gotv", "startimes", "spectranet"];

// In-memory cache for plan variations
const tvCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ongoingRequests = {};

// ✅ Get TV providers for dropdown
export const getTVBouquets = async (req, res) => {
  try {
    const providers = ALLOWED_PROVIDERS.map((p) => ({
      id: p,
      name: p.toUpperCase(),
    }));
    res.json(providers);
  } catch (err) {
    console.error("❌ Failed to fetch TV providers:", err);
    res.status(500).json({ error: "Failed to fetch TV providers" });
  }
};

// ✅ Fetch plan variations for a provider (cached)
export const getTvPlans = async (req, res) => {
  const { provider } = req.params;

  if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Invalid TV provider" });
  }

  const now = Date.now();

  // Return from cache if still valid
  if (tvCache[provider] && now - tvCache[provider].timestamp < CACHE_DURATION) {
    return res.json(tvCache[provider].plans);
  }

  // Prevent concurrent calls
  if (ongoingRequests[provider]) {
    console.log(`⏳ Waiting for ongoing request for ${provider}`);
    const data = await ongoingRequests[provider];
    return res.json(data);
  }

  ongoingRequests[provider] = (async () => {
    try {
      const response = await vtpass.getServiceVariations(provider);
      const rawVariations = response?.variations ?? [];

      // Map variations to include `name`, `variation_code`, and `amount`
      const plans = rawVariations.map((v) => ({
        name: v.name,
        variation_code: v.variation_code,
        amount: v.variation_amount || 0,
      }));

      // Cache the plans
      tvCache[provider] = {
        plans,
        timestamp: Date.now(),
      };

      return plans;
    } catch (err) {
      console.error(
        `❌ Failed to fetch TV plans for ${provider}:`,
        err.message || err
      );
      throw err;
    } finally {
      delete ongoingRequests[provider];
    }
  })();

  try {
    const plans = await ongoingRequests[provider];
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch TV plans" });
  }
};

// ✅ Buy TV subscription
export const buyTvSubscription = async (req, res) => {
  const { provider, smartcard_number, variation_code, phone } = req.body;

  // Input validation
  if (!provider || !smartcard_number || !variation_code || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Invalid TV provider" });
  }

  // Get plan from cache to enforce correct amount
  const cachedPlans = tvCache[provider]?.plans ?? [];
  const selectedPlan = cachedPlans.find(
    (p) => p.variation_code === variation_code
  );

  if (!selectedPlan) {
    return res.status(400).json({ error: "Invalid plan selected" });
  }

  const amount = selectedPlan.amount;
  if (amount <= 0) {
    return res.status(400).json({ error: "Invalid plan amount" });
  }

  // Unique request ID
  const request_id = `tv_${nanoid()}`;

  try {
    const response = await vtpass.purchaseService({
      serviceID: provider,
      billersCode: smartcard_number,
      variation_code,
      phone,
      amount, // Use cached plan amount
      request_id,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Failed to buy TV subscription:", err.message || err);
    res.status(500).json({ error: "Failed to buy TV subscription" });
  }
};
