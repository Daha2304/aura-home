import type { Automation, ConditionNode } from "@/models/automation";
import { triggerRegistry, conditionRegistry, actionRegistry } from "./descriptors";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

function walkConditions(
  node: ConditionNode | undefined,
  path: string,
  errors: ValidationIssue[],
): void {
  if (!node) return;
  if (node.kind === "and" || node.kind === "or") {
    const n = node as { kind: string; children: ConditionNode[] };
    if (!Array.isArray(n.children) || n.children.length === 0) {
      errors.push({ path, message: `Container '${node.kind}' hat keine Kinder` });
      return;
    }
    n.children.forEach((c, i) => walkConditions(c, `${path}.${node.kind}[${i}]`, errors));
    return;
  }
  if (node.kind === "not") {
    const n = node as { kind: "not"; child: ConditionNode };
    if (!n.child) errors.push({ path, message: "'not' ohne Kind" });
    else walkConditions(n.child, `${path}.not`, errors);
    return;
  }
  if (!conditionRegistry.get(node.kind)) {
    errors.push({ path, message: `Unbekannte Bedingung '${node.kind}'` });
  }
}

export function validateAutomation(a: Automation): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!a.name?.trim()) errors.push({ path: "name", message: "Name fehlt" });

  if (a.triggers.length === 0) {
    warnings.push({ path: "triggers", message: "Keine Auslöser definiert" });
  }
  a.triggers.forEach((t, i) => {
    if (!triggerRegistry.get(t.kind)) {
      errors.push({ path: `triggers[${i}]`, message: `Unbekannter Trigger '${t.kind}'` });
    }
  });

  walkConditions(a.conditions, "conditions", errors);

  if (a.actions.length === 0) {
    warnings.push({ path: "actions", message: "Keine Aktionen definiert" });
  }
  a.actions.forEach((x, i) => {
    if (!actionRegistry.get(x.kind)) {
      errors.push({ path: `actions[${i}]`, message: `Unbekannte Aktion '${x.kind}'` });
    }
    if (x.retry && x.retry.count < 0) {
      errors.push({ path: `actions[${i}].retry`, message: "Retry-Count negativ" });
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
