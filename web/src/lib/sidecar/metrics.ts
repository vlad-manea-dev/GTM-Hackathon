import { deals } from "./data";
import { STAGES } from "./types";

export function computeMetrics() {
  const openDeals = deals.filter((d) => d.stage !== "Closed Won");
  const openValue = openDeals.reduce((sum, d) => sum + d.value, 0);

  const stageCounts = STAGES.map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
  }));

  const totalArtefacts = deals.flatMap((d) => d.artefacts);
  const sentArtefacts = totalArtefacts.filter((a) => a.status === "sent");
  const completionRate = Math.round((sentArtefacts.length / totalArtefacts.length) * 100);

  const conflictDeals = deals.filter((d) => d.conflicts.length > 0);

  const fieldsPerDeal = deals.map((d) => {
    const base = 18; // deal + buyer schema fields always populated
    const contextFields = Object.values(d.context).filter((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v)
    ).length;
    const quoteFields = d.quotes.length;
    return base + contextFields + quoteFields;
  });
  const totalFields = fieldsPerDeal.reduce((a, b) => a + b, 0);

  return {
    openValue,
    openCount: openDeals.length,
    stageCounts,
    completionRate,
    sentArtefactsCount: sentArtefacts.length,
    totalArtefactsCount: totalArtefacts.length,
    conflictDeals,
    totalFields,
    fieldsPerDeal,
  };
}
