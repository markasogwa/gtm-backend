import VtpassProvider from "../providers/vtpassProvider.js";
// import CheapProvider from "../providers/cheapProvider.js"; // later

const vtpass = new VtpassProvider();

export async function getBestPlans(serviceID) {
  const providers = [vtpass]; // add more later

  const results = await Promise.all(
    providers.map((p) => p.getPlans(serviceID))
  );

  // merge & choose cheapest
  const merged = {};
  results.flat().forEach((plan) => {
    if (!merged[plan.planId] || plan.price < merged[plan.planId].price) {
      merged[plan.planId] = plan;
    }
  });

  return Object.values(merged);
}

export async function checkProvidersHealth() {
  const statuses = {};
  statuses["VTPass"] = await vtpass.healthCheck();
  return statuses;
}
