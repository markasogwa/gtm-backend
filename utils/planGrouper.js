function extractDuration(name) {
  const match = name.match(/(\d+)\s*(hrs?|days?|months?|year)/i);
  if (!match) return null;

  return {
    value: parseInt(match[1], 10),
    unit: match[2].toLowerCase(),
  };
}

function isSME(name) {
  return name.includes("sme");
}

function isXtra(name) {
  return name.includes("xtratalk") || name.includes("xtradata");
}

function sortByPrice(plans) {
  return plans.sort(
    (a, b) => Number(a.variation_amount) - Number(b.variation_amount)
  );
}

function groupPlans(plans) {
  const groups = {
    daily: [],
    weekly: [],
    monthly: [],
    multiMonth: [],
    yearly: [],
    sme: [],
    others: [],
  };

  plans.forEach((plan) => {
    const name = plan.name.toLowerCase();

    if (isSME(name)) {
      groups.sme.push(plan);
      return;
    }

    if (isXtra(name)) {
      groups.others.push(plan);
      return;
    }

    const duration = extractDuration(name);

    if (!duration) {
      groups.others.push(plan);
      return;
    }

    const { value, unit } = duration;

    if (unit.includes("hr") || (unit.includes("day") && value <= 2)) {
      groups.daily.push(plan);
    } else if (unit.includes("day") && value <= 7) {
      groups.weekly.push(plan);
    } else if (unit.includes("day") && value <= 30) {
      groups.monthly.push(plan);
    } else if (unit.includes("month") && value === 1) {
      groups.monthly.push(plan);
    } else if (unit.includes("month") && value > 1) {
      groups.multiMonth.push(plan);
    } else if (unit.includes("year")) {
      groups.yearly.push(plan);
    } else {
      groups.others.push(plan);
    }
  });

  // 🔥 SORT EACH GROUP BY PRICE
  Object.keys(groups).forEach((key) => {
    groups[key] = sortByPrice(groups[key]);
  });

  return groups;
}

export default groupPlans;
