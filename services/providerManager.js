// import VtpassProvider from "../providers/vtpassProvider.js";
// // import CheapProvider from "../providers/cheapProvider.js"; // can add later

// const vtpass = new VtpassProvider();

// /**
//  * Fetch the best (cheapest) plans across providers for a given service.
//  *
//  * @param {string} serviceID - e.g., 'mtn-data', 'airtel-data'
//  * @returns {Promise<Array>} - Array of plans with cheapest price
//  */
// export async function getBestPlans(serviceID) {
//   // List of providers to query
//   const providers = [vtpass]; // add more providers later if needed

//   // Fetch plans from all providers concurrently
//   const results = await Promise.all(
//     providers.map((p) => p.getPlans(serviceID))
//   );

//   // Merge and pick cheapest plan for each variation
//   const merged = {};
//   results.flat().forEach((plan) => {
//     const planKey = plan.planId || plan.variation_code;
//     if (!merged[planKey] || plan.price < merged[planKey].price) {
//       merged[planKey] = {
//         planId: planKey,
//         name: plan.name,
//         price: plan.price,
//         provider: plan.provider || serviceID.split("-")[0],
//       };
//     }
//   });

//   return Object.values(merged);
// }

// /**
//  * Check health/status of each provider
//  *
//  * @returns {Promise<Object>} - Object with provider names as keys and statuses as values
//  */
// export async function checkProvidersHealth() {
//   const statuses = {};
//   statuses["VTPass"] = await vtpass.healthCheck();
//   // later: statuses["CheapProvider"] = await cheapProvider.healthCheck();
//   return statuses;
// }
