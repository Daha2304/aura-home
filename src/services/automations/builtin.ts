/**
 * Built-in Trigger, Condition und Action Descriptors.
 *
 * Alles wird ausschließlich über die vorbereiteten Registries
 * registriert. Es entstehen keine gerätespezifischen Sonderpfade.
 */

import {
  triggerRegistry,
  conditionRegistry,
  actionRegistry,
  type TriggerDescriptor,
  type ConditionDescriptor,
  type ActionDescriptor,
  type Unsubscribe,
  type ActionPlan,
} from "./descriptors";
import { discoveryEvents } from "@/services/discovery/DiscoveryEvents";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { sceneEvents } from "@/services/scenes/SceneEvents";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { groupResolver } from "@/services/groups/GroupResolver";
import { sceneExecutor } from "@/services/scenes/SceneExecutor";
import { automationVariables } from "./AutomationVariables";

// -------------------------------------------------------------------
// TRIGGERS
// -------------------------------------------------------------------

const noopUnsub: Unsubscribe = () => {};

const deviceStateTrigger: TriggerDescriptor<{ deviceId?: string; capabilityId?: string }, unknown> = {
  id: "device.state",
  label: "Gerätestatus geändert",
  version: 1,
  category: "device",
  subscribe(_ctx, config, fire) {
    const off = wsManager.dispatcher.on("device.state", (ev) => {
      if (config.deviceId && ev.deviceId !== config.deviceId) return;
      if (config.capabilityId && ev.key !== config.capabilityId) return;
      fire({ deviceId: ev.deviceId, key: ev.key, value: ev.value });
    });
    return off;
  },
};

const deviceOnlineTrigger: TriggerDescriptor<{ deviceId?: string }, unknown> = {
  id: "device.online",
  label: "Gerät online",
  version: 1,
  category: "device",
  subscribe(_ctx, config, fire) {
    const off = discoveryEvents.on("deviceOnline", (ev) => {
      if (config.deviceId && ev.deviceId !== config.deviceId) return;
      fire({ deviceId: ev.deviceId });
    });
    return off;
  },
};

const deviceOfflineTrigger: TriggerDescriptor<{ deviceId?: string }, unknown> = {
  id: "device.offline",
  label: "Gerät offline",
  version: 1,
  category: "device",
  subscribe(_ctx, config, fire) {
    const off = discoveryEvents.on("deviceOffline", (ev) => {
      if (config.deviceId && ev.deviceId !== config.deviceId) return;
      fire({ deviceId: ev.deviceId });
    });
    return off;
  },
};

const capabilityChangedTrigger: TriggerDescriptor<{ capabilityId?: string }, unknown> = {
  id: "capability.changed",
  label: "Capability geändert",
  version: 1,
  category: "device",
  subscribe(_ctx, config, fire) {
    const off = wsManager.dispatcher.on("device.state", (ev) => {
      if (config.capabilityId && ev.key !== config.capabilityId) return;
      fire({ deviceId: ev.deviceId, key: ev.key, value: ev.value });
    });
    return off;
  },
};

const roomStateTrigger: TriggerDescriptor<{ roomId?: string }, unknown> = {
  id: "room.state",
  label: "Raumstatus geändert",
  version: 1,
  category: "room",
  subscribe(_ctx, config, fire) {
    // Kein globaler Room-Emitter im Zugriff — wir hören auf device.state
    // und filtern über den Raum. Kein zusätzlicher Bus.
    const off = wsManager.dispatcher.on("device.state", (ev) => {
      if (!config.roomId) { fire({ ...ev }); return; }
      const d = useDevicesStore.getState().byId(ev.deviceId);
      if (d?.roomId === config.roomId) fire({ ...ev, roomId: config.roomId });
    });
    return off;
  },
};

const groupStateTrigger: TriggerDescriptor<{ groupId?: string }, unknown> = {
  id: "group.state",
  label: "Gruppenstatus geändert",
  version: 1,
  category: "group",
  subscribe(_ctx, config, fire) {
    const off = wsManager.dispatcher.on("device.state", (ev) => {
      if (!config.groupId) { fire({ ...ev }); return; }
      const members = groupResolver.expand(config.groupId);
      if (members.includes(ev.deviceId)) fire({ ...ev, groupId: config.groupId });
    });
    return off;
  },
};

const sceneStartedTrigger: TriggerDescriptor<{ sceneId?: string }, unknown> = {
  id: "scene.started",
  label: "Szene gestartet",
  version: 1,
  category: "scene",
  subscribe(_ctx, config, fire) {
    return sceneEvents.on("sceneExecutionStarted", (ev) => {
      if (config.sceneId && ev.execution.sceneId !== config.sceneId) return;
      fire({ sceneId: ev.execution.sceneId, executionId: ev.execution.id });
    });
  },
};

const sceneFinishedTrigger: TriggerDescriptor<{ sceneId?: string }, unknown> = {
  id: "scene.finished",
  label: "Szene beendet",
  version: 1,
  category: "scene",
  subscribe(_ctx, config, fire) {
    return sceneEvents.on("sceneExecuted", (ev) => {
      if (config.sceneId && ev.execution.sceneId !== config.sceneId) return;
      fire({ sceneId: ev.execution.sceneId, executionId: ev.execution.id, status: ev.execution.status });
    });
  },
};

// Zeit-Trigger: ein zentraler Ticker im Scheduler wäre optimal — hier
// pro Subscription ein simpler Interval-Watcher (Sekundengenau).
function subscribeTime(check: () => boolean, fire: (payload?: unknown) => void): Unsubscribe {
  let last = false;
  const id = setInterval(() => {
    const now = check();
    if (now && !last) fire({ at: Date.now() });
    last = now;
  }, 1000);
  return () => clearInterval(id);
}

const timeTrigger: TriggerDescriptor<{ time?: string; weekdays?: number[] }, unknown> = {
  id: "time",
  label: "Zeitpunkt",
  version: 1,
  category: "time",
  subscribe(_ctx, config, fire) {
    if (!config.time) return noopUnsub;
    const [hh, mm] = config.time.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return noopUnsub;
    return subscribeTime(() => {
      const d = new Date();
      if (d.getHours() !== hh || d.getMinutes() !== mm || d.getSeconds() !== 0) return false;
      if (config.weekdays && config.weekdays.length > 0) {
        if (!config.weekdays.includes(d.getDay())) return false;
      }
      return true;
    }, fire);
  },
};

const dateTrigger: TriggerDescriptor<{ date?: string; time?: string }, unknown> = {
  id: "date",
  label: "Datum",
  version: 1,
  category: "time",
  subscribe(_ctx, config, fire) {
    if (!config.date) return noopUnsub;
    return subscribeTime(() => {
      const d = new Date();
      const iso = d.toISOString().slice(0, 10);
      if (iso !== config.date) return false;
      if (config.time) {
        const [hh, mm] = config.time.split(":").map((n) => parseInt(n, 10));
        if (d.getHours() !== hh || d.getMinutes() !== mm || d.getSeconds() !== 0) return false;
      }
      return true;
    }, fire);
  },
};

const weekdayTrigger: TriggerDescriptor<{ weekdays: number[]; time?: string }, unknown> = {
  id: "weekday",
  label: "Wochentag",
  version: 1,
  category: "time",
  subscribe(_ctx, config, fire) {
    if (!config.weekdays || config.weekdays.length === 0) return noopUnsub;
    return subscribeTime(() => {
      const d = new Date();
      if (!config.weekdays.includes(d.getDay())) return false;
      if (config.time) {
        const [hh, mm] = config.time.split(":").map((n) => parseInt(n, 10));
        if (d.getHours() !== hh || d.getMinutes() !== mm || d.getSeconds() !== 0) return false;
      } else if (d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0) {
        return false;
      }
      return true;
    }, fire);
  },
};

const sunriseTrigger: TriggerDescriptor<{ offsetMin?: number }, unknown> = {
  id: "sunrise",
  label: "Sonnenaufgang",
  version: 1,
  category: "time",
  subscribe(_ctx, _config, _fire) {
    // Sonnenzeiten benötigen Geo-Position. Solange keine vorliegt,
    // registrieren wir uns still — der Trigger bleibt inaktiv.
    return noopUnsub;
  },
};

const sunsetTrigger: TriggerDescriptor<{ offsetMin?: number }, unknown> = {
  id: "sunset",
  label: "Sonnenuntergang",
  version: 1,
  category: "time",
  subscribe(_ctx, _config, _fire) {
    return noopUnsub;
  },
};

const timerTrigger: TriggerDescriptor<{ intervalMs: number }, unknown> = {
  id: "timer",
  label: "Timer",
  version: 1,
  category: "time",
  subscribe(_ctx, config, fire) {
    const ms = Math.max(1000, config.intervalMs ?? 60_000);
    const id = setInterval(() => fire({ at: Date.now() }), ms);
    return () => clearInterval(id);
  },
};

const systemStartTrigger: TriggerDescriptor<Record<string, never>, unknown> = {
  id: "system.start",
  label: "Systemstart",
  version: 1,
  category: "system",
  subscribe(_ctx, _config, fire) {
    // Feuert einmalig kurz nach dem Registrieren.
    const t = setTimeout(() => fire({ at: Date.now() }), 500);
    return () => clearTimeout(t);
  },
};

const customTrigger: TriggerDescriptor<Record<string, unknown>, unknown> = {
  id: "custom",
  label: "Benutzerdefiniert",
  version: 1,
  category: "custom",
  subscribe: () => noopUnsub,
};

// -------------------------------------------------------------------
// CONDITIONS
// -------------------------------------------------------------------

interface CompareConfig {
  left?: { kind: "value" | "capability" | "variable"; deviceId?: string; capabilityId?: string; key?: string; value?: unknown };
  right?: unknown;
  min?: number;
  max?: number;
}

function resolve(cfgSide: CompareConfig["left"]): unknown {
  if (!cfgSide) return undefined;
  if (cfgSide.kind === "value") return cfgSide.value;
  if (cfgSide.kind === "capability" && cfgSide.deviceId && cfgSide.capabilityId) {
    const d = useDevicesStore.getState().byId(cfgSide.deviceId);
    const cap = (d?.capabilities ?? []).find((c) => c.id === cfgSide.capabilityId);
    return (cap as { value?: unknown } | undefined)?.value;
  }
  if (cfgSide.kind === "variable" && cfgSide.key) {
    return automationVariables.value(cfgSide.key);
  }
  return undefined;
}

function makeCompare(id: string, label: string, op: "eq" | "neq" | "gt" | "lt" | "between"): ConditionDescriptor<CompareConfig> {
  return {
    id,
    label,
    version: 1,
    category: "compare",
    evaluate(_ctx, cfg) {
      const l = resolve(cfg.left);
      if (op === "between") {
        const n = Number(l);
        if (Number.isNaN(n)) return false;
        return (cfg.min === undefined || n >= cfg.min) && (cfg.max === undefined || n <= cfg.max);
      }
      const r = cfg.right;
      switch (op) {
        case "eq": return l === r;
        case "neq": return l !== r;
        case "gt": return Number(l) > Number(r);
        case "lt": return Number(l) < Number(r);
      }
    },
  };
}

const capabilityCond: ConditionDescriptor<{ deviceId: string; capabilityId: string; equals?: unknown }> = {
  id: "capability",
  label: "Capability-Wert",
  version: 1,
  category: "entity",
  evaluate(_ctx, cfg) {
    const d = useDevicesStore.getState().byId(cfg.deviceId);
    const cap = (d?.capabilities ?? []).find((c) => c.id === cfg.capabilityId);
    if (!cap) return false;
    if (cfg.equals === undefined) return true;
    return (cap as { value?: unknown }).value === cfg.equals;
  },
};

const deviceCond: ConditionDescriptor<{ deviceId: string; online?: boolean }> = {
  id: "device",
  label: "Gerätezustand",
  version: 1,
  category: "entity",
  evaluate(_ctx, cfg) {
    const d = useDevicesStore.getState().byId(cfg.deviceId);
    if (!d) return false;
    if (cfg.online !== undefined) return Boolean(d.online) === cfg.online;
    return true;
  },
};

const groupCond: ConditionDescriptor<{ groupId: string; minMembers?: number }> = {
  id: "group",
  label: "Gruppenzustand",
  version: 1,
  category: "entity",
  evaluate(_ctx, cfg) {
    const g = useGroupsStore.getState().byId[cfg.groupId];
    if (!g) return false;
    const size = groupResolver.expand(cfg.groupId).length;
    return size >= (cfg.minMembers ?? 1);
  },
};

const roomCond: ConditionDescriptor<{ roomId: string }> = {
  id: "room",
  label: "Raum vorhanden",
  version: 1,
  category: "entity",
  evaluate(_ctx, cfg) {
    return !!useRoomsStore.getState().byId[cfg.roomId];
  },
};

const sceneCond: ConditionDescriptor<{ sceneId: string; active?: boolean }> = {
  id: "scene",
  label: "Szene",
  version: 1,
  category: "entity",
  evaluate(_ctx, cfg) {
    const s = useScenesStore.getState().byId[cfg.sceneId];
    if (!s) return false;
    if (cfg.active !== undefined) return s.active === cfg.active;
    return true;
  },
};

const variableCond: ConditionDescriptor<{ key: string; equals?: unknown }> = {
  id: "variable",
  label: "Variable",
  version: 1,
  category: "variable",
  evaluate(_ctx, cfg) {
    const v = automationVariables.value(cfg.key);
    if (cfg.equals === undefined) return v !== undefined;
    return v === cfg.equals;
  },
};

const customCond: ConditionDescriptor<Record<string, unknown>> = {
  id: "custom",
  label: "Benutzerdefiniert",
  version: 1,
  category: "custom",
  evaluate: () => true,
};

// -------------------------------------------------------------------
// ACTIONS
// -------------------------------------------------------------------

const deviceControlAction: ActionDescriptor<{ deviceId: string; capabilityId: string; value: unknown }> = {
  id: "device.control",
  label: "Gerät steuern",
  version: 1,
  category: "device",
  plan(_ctx, cfg): ActionPlan {
    if (!cfg.deviceId || !cfg.capabilityId) return {};
    return { commands: [{ deviceId: cfg.deviceId, capabilityId: cfg.capabilityId, value: cfg.value }] };
  },
};

const groupControlAction: ActionDescriptor<{ groupId: string; capabilityId: string; value: unknown }> = {
  id: "group.control",
  label: "Gruppe steuern",
  version: 1,
  category: "group",
  plan(_ctx, cfg): ActionPlan {
    if (!cfg.groupId || !cfg.capabilityId) return {};
    const members = groupResolver.expand(cfg.groupId);
    const devices = useDevicesStore.getState();
    const commands = [] as Array<{ deviceId: string; capabilityId: string; value: unknown }>;
    for (const id of members) {
      const d = devices.byId(id);
      if (!d) continue;
      const supports = (d.capabilities ?? []).some((c) => c.id === cfg.capabilityId);
      if (!supports) continue;
      commands.push({ deviceId: id, capabilityId: cfg.capabilityId, value: cfg.value });
    }
    return { commands };
  },
};

const sceneStartAction: ActionDescriptor<{ sceneId: string }> = {
  id: "scene.start",
  label: "Szene starten",
  version: 1,
  category: "scene",
  plan(_ctx, cfg): ActionPlan {
    return { run: () => { if (cfg.sceneId) sceneExecutor.run(cfg.sceneId); } };
  },
};

const delayAction: ActionDescriptor<{ ms: number }> = {
  id: "delay",
  label: "Verzögerung",
  version: 1,
  category: "control",
  plan(_ctx, cfg): ActionPlan {
    return { extraDelayMs: Math.max(0, cfg.ms ?? 0), run: () => {} };
  },
};

const variableSetAction: ActionDescriptor<{ key: string; value: unknown }> = {
  id: "variable.set",
  label: "Variable setzen",
  version: 1,
  category: "variable",
  plan(_ctx, cfg): ActionPlan {
    return { run: () => { if (cfg.key) automationVariables.set(cfg.key, cfg.value); } };
  },
};

function makeToggleAction(id: string, label: string, enabled: boolean): ActionDescriptor<{ automationId: string }> {
  return {
    id,
    label,
    version: 1,
    category: "control",
    plan(_ctx, cfg): ActionPlan {
      return {
        run: async () => {
          if (!cfg.automationId) return;
          const { automationManager } = await import("./AutomationManager");
          automationManager.setEnabled(cfg.automationId, enabled);
        },
      };
    },
  };
}

const customAction: ActionDescriptor<Record<string, unknown>> = {
  id: "custom",
  label: "Benutzerdefiniert",
  version: 1,
  category: "custom",
  plan: () => ({}),
};

// -------------------------------------------------------------------
// Registrierung
// -------------------------------------------------------------------

let registered = false;

export function registerBuiltinAutomationDescriptors(): void {
  if (registered) return;
  registered = true;

  const triggers: TriggerDescriptor[] = [
    deviceStateTrigger as TriggerDescriptor,
    deviceOnlineTrigger as TriggerDescriptor,
    deviceOfflineTrigger as TriggerDescriptor,
    capabilityChangedTrigger as TriggerDescriptor,
    roomStateTrigger as TriggerDescriptor,
    groupStateTrigger as TriggerDescriptor,
    sceneStartedTrigger as TriggerDescriptor,
    sceneFinishedTrigger as TriggerDescriptor,
    timeTrigger as TriggerDescriptor,
    dateTrigger as TriggerDescriptor,
    weekdayTrigger as TriggerDescriptor,
    sunriseTrigger as TriggerDescriptor,
    sunsetTrigger as TriggerDescriptor,
    timerTrigger as TriggerDescriptor,
    systemStartTrigger as TriggerDescriptor,
    customTrigger as TriggerDescriptor,
  ];
  for (const t of triggers) triggerRegistry.register(t);

  const conditions: ConditionDescriptor[] = [
    makeCompare("compare.eq", "Gleich", "eq") as ConditionDescriptor,
    makeCompare("compare.neq", "Ungleich", "neq") as ConditionDescriptor,
    makeCompare("compare.gt", "Größer", "gt") as ConditionDescriptor,
    makeCompare("compare.lt", "Kleiner", "lt") as ConditionDescriptor,
    makeCompare("compare.between", "Zwischen", "between") as ConditionDescriptor,
    capabilityCond as ConditionDescriptor,
    deviceCond as ConditionDescriptor,
    groupCond as ConditionDescriptor,
    roomCond as ConditionDescriptor,
    sceneCond as ConditionDescriptor,
    variableCond as ConditionDescriptor,
    customCond as ConditionDescriptor,
  ];
  for (const c of conditions) conditionRegistry.register(c);

  const actions: ActionDescriptor[] = [
    deviceControlAction as ActionDescriptor,
    groupControlAction as ActionDescriptor,
    sceneStartAction as ActionDescriptor,
    delayAction as ActionDescriptor,
    variableSetAction as ActionDescriptor,
    makeToggleAction("automation.enable", "Automation aktivieren", true) as ActionDescriptor,
    makeToggleAction("automation.disable", "Automation deaktivieren", false) as ActionDescriptor,
    customAction as ActionDescriptor,
  ];
  for (const a of actions) actionRegistry.register(a);
}
