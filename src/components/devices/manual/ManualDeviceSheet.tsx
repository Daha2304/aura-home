import { useEffect, useMemo, useState } from "react";
import { Database, Plus, RefreshCw, Search } from "lucide-react";
import { BottomSheet } from "@/components/ds/cards/BottomSheet";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { GlassInput } from "@/components/ds/controls/GlassInput";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import type { DeviceTypeId } from "@/models/deviceType";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useObjectTreeStore } from "@/store/slices/objectTreeStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { createManualDevice } from "@/services/manualDevices/manualDeviceFactory";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { createId } from "@/utils/ids";

interface Props {
  open: boolean;
  roomId: string;
  onClose: () => void;
}

const DEVICE_TYPES: Array<{ value: DeviceTypeId; label: string }> = [
  { value: "custom", label: "Allgemein" },
  { value: "doorContact", label: "Türkontakt" },
  { value: "windowContact", label: "Fensterkontakt" },
  { value: "light", label: "Lampe" },
  { value: "outlet", label: "Steckdose" },
  { value: "sensor", label: "Sensor" },
  { value: "motion", label: "Bewegung" },
  { value: "presence", label: "Anwesenheit" },
  { value: "avr", label: "AVR" },
  { value: "mediaPlayer", label: "Media Player" },
];

export function ManualDeviceSheet({ open, roomId, onClose }: Props) {
  const authenticated = useConnectionStore((s) => s.authenticated);
  const tree = useObjectTreeStore((s) => s.tree);
  const loading = useObjectTreeStore((s) => s.loading);
  const setLoading = useObjectTreeStore((s) => s.setLoading);
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceTypeId>("custom");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const states = useMemo(() => flattenStates(tree), [tree]);
  const visibleStates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? states.filter((node) =>
          [node.name, node.id, node.role, node.valueType]
            .filter((value): value is string => typeof value === "string")
            .some((value) => value.toLowerCase().includes(q)),
        )
      : states;

    return base.slice(0, 120);
  }, [states, query]);

  const selectedNodes = useMemo(
    () => Object.keys(selected).map((id) => states.find((node) => node.id === id)).filter(Boolean) as IoBrokerObjectTreeNode[],
    [selected, states],
  );

  const requestTree = () => {
    setLoading(true);
    wsManager.send({
      type: "request",
      op: "objects.list",
      requestId: createId("objects"),
    });
  };

  useEffect(() => {
    if (open && authenticated && tree.length === 0 && !loading) {
      requestTree();
    }
  }, [open, authenticated, tree.length, loading]);

  const toggle = (node: IoBrokerObjectTreeNode) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[node.id] !== undefined) delete next[node.id];
      else next[node.id] = suggestedLabel(node);
      return next;
    });
  };

  const reset = () => {
    setName("");
    setType("custom");
    setQuery("");
    setSelected({});
  };

  const save = () => {
    const bindings = selectedNodes.map((node) => ({
      node,
      label: selected[node.id] || suggestedLabel(node),
    }));

    if (name.trim().length === 0 || bindings.length === 0) return;

    const device = createManualDevice({
      name,
      roomId,
      type,
      bindings,
    });

    useDevicesStore.getState().upsertDevice(device);
    for (const binding of bindings) wsManager.subscribe(binding.node.id);
    reset();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Gerät hinzufügen" className="mx-auto max-w-3xl">
      <div className="grid gap-3">
        <GlassInput
          label="Gerätename"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Eingang-Tür"
        />

        <label className="block space-y-1.5">
          <span className="block text-[13px] font-medium text-foreground">Gerätetyp</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as DeviceTypeId)}
            className="glass-panel hairline block w-full rounded-xl bg-white/40 px-4 py-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/5"
          >
            {DEVICE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <GlassInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="State suchen, z. B. contact, battery, Eingang ..."
            aria-label="ioBroker-State suchen"
          />
          <GlassButton variant="ghost" onClick={requestTree} disabled={!authenticated || loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </GlassButton>
        </div>

        {selectedNodes.length > 0 && (
          <div className="grid gap-2 rounded-xl border border-white/10 p-3">
            <div className="text-sm font-semibold">Ausgewählt</div>
            {selectedNodes.map((node) => (
              <GlassInput
                key={node.id}
                label={node.id}
                value={selected[node.id] ?? suggestedLabel(node)}
                onChange={(event) =>
                  setSelected((prev) => ({ ...prev, [node.id]: event.target.value }))
                }
              />
            ))}
          </div>
        )}

        {!authenticated ? (
          <EmptyStateCard
            icon={Database}
            title="Nicht verbunden"
            description="Verbinde Aura mit dem Adapter, dann kannst du ioBroker-States auswählen."
          />
        ) : visibleStates.length === 0 ? (
          <EmptyStateCard
            icon={Search}
            title={loading ? "Lade Objektbaum" : "Keine States"}
            description={loading ? "Aura lädt die ioBroker-Objekte." : "Zu deiner Suche wurden keine State-Objekte gefunden."}
          />
        ) : (
          <div className="max-h-[42dvh] overflow-y-auto rounded-xl border border-white/10">
            {visibleStates.map((node) => (
              <StateOption
                key={node.id}
                node={node}
                selected={selected[node.id] !== undefined}
                onToggle={() => toggle(node)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <GlassButton variant="ghost" onClick={onClose}>
            Abbrechen
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={save}
            disabled={name.trim().length === 0 || selectedNodes.length === 0}
          >
            <Plus className="h-4 w-4" />
            Gerät erstellen
          </GlassButton>
        </div>
      </div>
    </BottomSheet>
  );
}

function StateOption({
  node,
  selected,
  onToggle,
}: {
  node: IoBrokerObjectTreeNode;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/5",
        selected && "bg-accent/10",
      )}
    >
      <span
        className={cn(
          "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border",
          selected ? "border-accent bg-accent text-accent-foreground" : "border-white/30",
        )}
      >
        {selected ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{suggestedLabel(node)}</span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">{node.id}</span>
        <span className="mt-1 flex flex-wrap gap-1">
          {node.role && <StatusBadge tone="neutral">{node.role}</StatusBadge>}
          {node.valueType && <StatusBadge tone="neutral">{node.valueType}</StatusBadge>}
          {node.unit && <StatusBadge tone="neutral">{node.unit}</StatusBadge>}
          {node.writable && <StatusBadge tone="info">write</StatusBadge>}
        </span>
      </span>
      <span className="max-w-[9rem] truncate text-xs text-muted-foreground">
        {formatValue(node.value, node.unit)}
      </span>
    </button>
  );
}

function flattenStates(nodes: IoBrokerObjectTreeNode[]): IoBrokerObjectTreeNode[] {
  const result: IoBrokerObjectTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "state") result.push(node);
    result.push(...flattenStates(node.children));
  }

  return result;
}

function suggestedLabel(node: IoBrokerObjectTreeNode): string {
  const last = node.id.split(".").at(-1) ?? node.id;
  const name = node.name && node.name !== last ? node.name : last;
  return name.replaceAll("_", " ");
}

function formatValue(value: unknown, unit?: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "{...}";
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}
