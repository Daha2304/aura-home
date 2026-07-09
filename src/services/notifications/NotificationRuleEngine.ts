import type { AppNotification } from "@/models/notification";
import { isMutedByRule } from "@/models/notificationRule";
import { useNotificationRulesStore } from "@/store/slices/notificationRulesStore";

export interface RuleDecision {
  muted: boolean;
  reasonRuleId?: string;
}

class NotificationRuleEngineImpl {
  evaluate(n: AppNotification, now: Date = new Date()): RuleDecision {
    const rules = useNotificationRulesStore.getState().rules;
    for (const r of rules) {
      if (isMutedByRule(n, r, now)) {
        return { muted: true, reasonRuleId: r.id };
      }
    }
    return { muted: false };
  }
}

export const notificationRuleEngine = new NotificationRuleEngineImpl();
