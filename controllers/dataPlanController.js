import axios from "axios";

// 🔒 Allowed service IDs for data bundles
const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];

// ⏱ Cache with expiration
const dataPlanCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// To prevent multiple simultaneous calls
const ongoingRequests = {};

/**
 * Get data plans from VTPass with caching
 */
export const getDataPlans = async (req, res) => {
  const { serviceID } = req.query;

  if (!serviceID || !VALID_SERVICES.includes(serviceID)) {
    return res.status(400).json({
      error: `Invalid serviceID. Must be one of: ${VALID_SERVICES.join(", ")}`,
    });
  }

  const now = Date.now();

  // ✅ Return from cache if valid
  if (
    dataPlanCache[serviceID] &&
    now - dataPlanCache[serviceID].timestamp < CACHE_DURATION
  ) {
    console.log(`♻️ Returning cached data plans for ${serviceID}`);
    return res.json(dataPlanCache[serviceID].variations);
  }

  // ✅ Prevent multiple concurrent calls
  if (ongoingRequests[serviceID]) {
    console.log(`⏳ Waiting for ongoing request for ${serviceID}`);
    await ongoingRequests[serviceID];
    return res.json(dataPlanCache[serviceID]?.variations || []);
  }

  // Save promise to prevent duplicate calls
  ongoingRequests[serviceID] = (async () => {
    const baseUrl = process.env.VTPASS_SANDBOX_BASE_URL.replace(/\/+$/, "");

    try {
      const response = await axios.get(
        `${baseUrl}/service-variations?serviceID=${serviceID}`,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.VTPASS_SANDBOX_API_KEY,
            "secret-key": process.env.VTPASS_SANDBOX_SECRET_KEY,
          },
        }
      );

      if (!response.data || !response.data.content) {
        throw new Error("Invalid response from VTPass");
      }

      const variations = response.data.content.variations || [];

      // ✅ Save to cache
      dataPlanCache[serviceID] = {
        variations,
        timestamp: Date.now(),
      };

      return variations;
    } catch (error) {
      console.error(
        "❌ Error fetching plans:",
        error.response?.data || error.message
      );
      throw error;
    } finally {
      // Remove ongoing request once done
      delete ongoingRequests[serviceID];
    }
  })();

  try {
    const variations = await ongoingRequests[serviceID];
    res.json(variations);
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch data plans" });
  }
};
