import Plan from "../models/Plan.js";

/**
 * Save or update plans for a given service.
 * Replaces old plans with new ones for the same serviceID.
 *
 * @param {string} serviceID - e.g., 'mtn-data', 'airtel-data'
 * @param {Array} plans - Array of plan objects from VTpass
 * @returns {Promise<Array>} - Saved plans
 */
export async function savePlans(serviceID, plans) {
  // Remove old plans for this serviceID
  await Plan.deleteMany({ serviceID });

  // Map VTpass plans and attach serviceID
  const docs = plans.map((plan) => ({
    planId: plan.variation_code || plan.planId,
    name: plan.name,
    price: plan.variation_amount || plan.price || 0,
    provider: plan.provider || serviceID.split("-")[0], // optional provider field
    serviceID,
    updatedAt: new Date(),
  }));

  // Bulk insert new plans
  await Plan.insertMany(docs);

  return docs;
}

/**
 * Get cached plans for a service.
 * Sorted by price ascending for easy frontend display.
 *
 * @param {string} serviceID
 * @returns {Promise<Array>} - Array of plans
 */
export async function getCachedPlans(serviceID) {
  return await Plan.find({ serviceID }).sort({ price: 1 }).lean();
}
