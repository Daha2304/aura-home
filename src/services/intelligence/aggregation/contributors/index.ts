import { metricContributors } from "../MetricContributors";
import { countContributor } from "./countContributor";
import { climateContributor } from "./climateContributor";
import { openingsContributor } from "./openingsContributor";
import { activityContributor } from "./activityContributor";
import { energyContributor } from "./energyContributor";
import { healthContributor } from "./healthContributor";

let registered = false;

export function registerBuiltinContributors(): void {
  if (registered) return;
  registered = true;
  metricContributors.register(countContributor);
  metricContributors.register(climateContributor);
  metricContributors.register(openingsContributor);
  metricContributors.register(activityContributor);
  metricContributors.register(energyContributor);
  metricContributors.register(healthContributor);
}
