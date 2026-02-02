// import axios from "axios";

// // 🔒 Allowed service IDs
// const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];

// // Min Plan
// const MIN_PLAN_PRICE = 100;

// // ⏱ Cache with expiration
// const dataPlanCache = {};
// const CACHE_DURATION = 5 * 60 * 1000;

// // Prevent multiple simultaneous calls
// const ongoingRequests = {};

// /**
//  * Helper: determine category + filter unwanted plans
//  */
// const getPlanCategory = (plan) => {
//   const name = plan.name?.toLowerCase() || "";

//   // ❌ Remove high plans (2 months and above)
//   if (
//     name.includes("60 days") ||
//     name.includes("90 days") ||
//     name.includes("2-months") ||
//     name.includes("2 months") ||
//     name.includes("2-month") ||
//     name.includes("3-month") ||
//     name.includes("hour") ||
//     name.includes("sme") ||
//     name.includes("hrs") ||
//     name.includes("3-months")
//   ) {
//     return null; // filtered out
//   }

//   // 🕒 Hours & days → Days
//   if (
//     name.includes("1 day") ||
//     name.includes("2 days") ||
//     name.includes("3 days") ||
//     name.includes("7 days") ||
//     name.includes("14 days") ||
//     // name.includes("day") ||
//     name.includes("daily")
//   ) {
//     return "Daily";
//   }

//   // 📅 Weekly → Weeks
//   // if (name.includes("sme") || name.includes("7 day")) {
//   //   return "SME_Data";
//   // }

//   // 🗓 Monthly (only 1 month allowed)
//   if (
//     // name.includes("month") ||
//     name.includes("30 days")
//     // name.includes("monthly")
//   ) {
//     return "Monthly";
//   }

//   // 🎁 ExtraTalk & others
//   if (name.includes("extra") || name.includes("talk")) {
//     return "Extra_Talk";
//   }

//   // return "Extra_Talk";
// };

// /**
//  * Helper: group & sort plans
//  */
// const groupAndSortPlans = (serviceID, variations) => {
//   const network = serviceID.split("-")[0].toUpperCase();

//   const grouped = {
//     network,
//     categories: {
//       Daily: [],
//       // SME_Data: [],
//       Monthly: [],
//       Extra_Talk: [],
//     },
//   };

//   for (const plan of variations) {
//     const price = Number(plan.variation_amount || 0);

//     // Skip low plans
//     if (price < MIN_PLAN_PRICE) {
//       continue;
//     }

//     const category = getPlanCategory(plan);

//     // 🚫 Skip filtered plans
//     if (!category) continue;

//     grouped.categories[category].push({
//       ...plan,
//       price: Number(plan.variation_amount),
//     });
//   }

//   // 🔽 Sort each category by price
//   Object.values(grouped.categories).forEach((plans) => {
//     plans.sort((a, b) => a.price - b.price);
//   });

//   return grouped;
// };

// /**
//  * Get data plans from VTPass (grouped & filtered)
//  */
// export const getDataPlans = async (req, res) => {
//   const { serviceID } = req.query;

//   if (!serviceID || !VALID_SERVICES.includes(serviceID)) {
//     return res.status(400).json({
//       error: `Invalid serviceID. Must be one of: ${VALID_SERVICES.join(", ")}`,
//     });
//   }

//   const now = Date.now();

//   // ♻️ Serve from cache
//   if (
//     dataPlanCache[serviceID] &&
//     now - dataPlanCache[serviceID].timestamp < CACHE_DURATION
//   ) {
//     return res.json(dataPlanCache[serviceID].data);
//   }

//   // ⏳ Prevent concurrent fetches
//   if (ongoingRequests[serviceID]) {
//     await ongoingRequests[serviceID];
//     return res.json(dataPlanCache[serviceID]?.data || {});
//   }

//   ongoingRequests[serviceID] = (async () => {
//     const baseUrl = process.env.VTPASS_SANDBOX_BASE_URL.replace(/\/+$/, "");

//     try {
//       const response = await axios.get(
//         `${baseUrl}/service-variations?serviceID=${serviceID}`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "api-key": process.env.VTPASS_SANDBOX_API_KEY,
//             "secret-key": process.env.VTPASS_SANDBOX_SECRET_KEY,
//           },
//         }
//       );

//       const variations = response.data?.content?.variations;
//       console.log("📦 RAW VTPASS PLANS:", variations);
//       if (!variations) throw new Error("Invalid response from VTPass");

//       const groupedData = groupAndSortPlans(serviceID, variations);

//       dataPlanCache[serviceID] = {
//         data: groupedData,
//         timestamp: Date.now(),
//       };

//       return groupedData;
//     } finally {
//       delete ongoingRequests[serviceID];
//     }
//   })();

//   try {
//     const result = await ongoingRequests[serviceID];
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({
//       error: err.message || "Failed to fetch data plans",
//     });
//   }
// };

import axios from "axios";
import logger from "../logger.js"; // your Pino instance

// 🔒 Allowed service IDs
const VALID_SERVICES = ["mtn-data", "airtel-data", "glo-data", "etisalat-data"];
const MIN_PLAN_PRICE = 100;

// ⏱ Cache with expiration
const dataPlanCache = {};
const CACHE_DURATION = 5 * 60 * 1000;

// Prevent multiple simultaneous calls
const ongoingRequests = {};

/**
 * Helper: determine category + filter unwanted plans
 */
const getPlanCategory = (plan) => {
  const name = plan.name?.toLowerCase() || "";

  // ❌ Remove high plans (2 months and above)
  if (
    name.includes("60 days") ||
    name.includes("90 days") ||
    name.includes("2-months") ||
    name.includes("2 months") ||
    name.includes("3-month") ||
    name.includes("hour") ||
    name.includes("sme") ||
    name.includes("hrs") ||
    name.includes("3-months")
  ) {
    return null;
  }

  if (
    name.includes("1 day") ||
    name.includes("2 days") ||
    name.includes("3 days") ||
    name.includes("7 days") ||
    name.includes("14 days") ||
    name.includes("daily")
  ) {
    return "Daily";
  }

  if (name.includes("30 days")) {
    return "Monthly";
  }

  if (name.includes("extra") || name.includes("talk")) {
    return "Extra_Talk";
  }
};

/**
 * Helper: group & sort plans
 */
const groupAndSortPlans = (serviceID, variations) => {
  const network = serviceID.split("-")[0].toUpperCase();

  const grouped = {
    network,
    categories: {
      Daily: [],
      Monthly: [],
      Extra_Talk: [],
    },
  };

  for (const plan of variations) {
    const price = Number(plan.variation_amount || 0);

    if (price < MIN_PLAN_PRICE) continue;

    const category = getPlanCategory(plan);
    if (!category) continue;

    grouped.categories[category].push({
      ...plan,
      price: Number(plan.variation_amount),
    });
  }

  // 🔽 Sort each category by price
  Object.values(grouped.categories).forEach((plans) => {
    plans.sort((a, b) => a.price - b.price);
  });

  return grouped;
};

/**
 * Get data plans from VTPass (grouped & filtered)
 */
export const getDataPlans = async (req, res) => {
  const { serviceID } = req.query;

  if (!serviceID || !VALID_SERVICES.includes(serviceID)) {
    logger.warn({ serviceID }, "Invalid serviceID requested");
    return res.status(400).json({
      error: `Invalid serviceID. Must be one of: ${VALID_SERVICES.join(", ")}`,
    });
  }

  const now = Date.now();

  // ♻️ Serve from cache
  if (
    dataPlanCache[serviceID] &&
    now - dataPlanCache[serviceID].timestamp < CACHE_DURATION
  ) {
    logger.debug({ serviceID }, "Serving data plans from cache");
    return res.json(dataPlanCache[serviceID].data);
  }

  // ⏳ Prevent concurrent fetches
  if (ongoingRequests[serviceID]) {
    logger.debug({ serviceID }, "Waiting for ongoing request to finish");
    await ongoingRequests[serviceID];
    return res.json(dataPlanCache[serviceID]?.data || {});
  }

  ongoingRequests[serviceID] = (async () => {
    const baseUrl = process.env.VTPASS_SANDBOX_BASE_URL.replace(/\/+$/, "");

    try {
      const url = `${baseUrl}/service-variations?serviceID=${serviceID}`;
      logger.info(
        { url, serviceID },
        "Fetching service variations from VTPass"
      );

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.VTPASS_SANDBOX_API_KEY,
          "secret-key": process.env.VTPASS_SANDBOX_SECRET_KEY,
        },
      });

      const variations = response.data?.content?.variations;

      if (!variations) {
        logger.error(
          { serviceID, responseData: response.data },
          "Invalid response from VTPass"
        );
        throw new Error("Invalid response from VTPass");
      }

      const groupedData = groupAndSortPlans(serviceID, variations);

      // Update cache
      dataPlanCache[serviceID] = {
        data: groupedData,
        timestamp: Date.now(),
      };

      logger.debug(
        { serviceID, planCount: variations.length },
        "Service variations processed and cached"
      );

      return groupedData;
    } finally {
      delete ongoingRequests[serviceID];
    }
  })();

  try {
    const result = await ongoingRequests[serviceID];
    res.json(result);
  } catch (err) {
    logger.error({ err, serviceID }, "Failed to fetch data plans from VTPass");
    res.status(500).json({
      error: err.message || "Failed to fetch data plans",
    });
  }
};
