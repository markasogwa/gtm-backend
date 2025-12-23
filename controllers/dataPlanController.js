import axios from "axios";

// 🔒 Allowed service IDs for data bundles
const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];

// ⏱ Simple in-memory cache
const dataPlanCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getDataPlans = async (req, res) => {
  const { serviceID } = req.query;

  // ✅ Validate serviceID before calling VTPass
  if (!serviceID || !VALID_SERVICES.includes(serviceID)) {
    return res.status(400).json({
      error: `Invalid serviceID. Must be one of: ${VALID_SERVICES.join(", ")}`,
    });
  }

  const now = Date.now();

  // ✅ Return from cache if exists and not expired
  if (
    dataPlanCache[serviceID] &&
    dataPlanCache[serviceID].timestamp &&
    now - dataPlanCache[serviceID].timestamp < CACHE_DURATION
  ) {
    console.log(`♻️ Returning cached data plans for ${serviceID}`);
    return res.json(dataPlanCache[serviceID].variations);
  }

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

    console.log("✅ VTPass raw response:", response.data);

    if (!response.data || !response.data.content) {
      return res.status(502).json({ error: "Invalid response from VTPass" });
    }

    const variations = response.data.content.variations || [];

    // ✅ Store in cache
    dataPlanCache[serviceID] = {
      variations,
      timestamp: now,
    };

    res.json(variations);
  } catch (error) {
    console.error(
      "❌ Error fetching plans:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
};
