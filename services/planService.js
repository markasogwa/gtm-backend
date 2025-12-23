import Plan from "../models/Plan.js";

export async function savePlans(serviceID, plans) {
  await Plan.deleteMany({ serviceID });
  const docs = plans.map((p) => ({ ...p, serviceID }));
  await Plan.insertMany(docs);
  return docs;
}

export async function getCachedPlans(serviceID) {
  return await Plan.find({ serviceID }).sort({ price: 1 });
}
