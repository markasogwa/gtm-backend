import cron from "node-cron";
import ProviderStatus from "../models/ProviderStatus.js";
import { savePlans } from "../services/planService.js";
import {
  checkProvidersHealth,
  getBestPlans,
} from "../services/providerManager.js";

// refresh plans every 30 mins
cron.schedule("*/30 * * * *", async () => {
  console.log("🔄 Refreshing plans...");
  const services = ["MTN-data", "Airtel-data", "Glo-data", "9mobile-data"];
  for (const service of services) {
    const bestPlans = await getBestPlans(service);
    await savePlans(service, bestPlans);
    console.log(`✅ Plans updated for ${service}`);
  }
});

// check provider health every 5 mins
cron.schedule("*/5 * * * *", async () => {
  console.log("🩺 Checking provider health...");
  const statuses = await checkProvidersHealth();
  for (const [provider, status] of Object.entries(statuses)) {
    await ProviderStatus.findOneAndUpdate(
      { provider },
      { status, checkedAt: new Date() },
      { upsert: true }
    );
  }
});
