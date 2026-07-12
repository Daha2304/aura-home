import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Database, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/ds/controls/GlassInput";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useObjectTreeStore } from "@/store/slices/objectTreeStore";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { createId } from "@/utils/ids";

export const Route = createFileRoute("/_app/settings/objects")({
  component: ObjectTreeSettings,
});

function ObjectTreeSettings() {
  const tree = useObjectTreeStore((s) => s.tree);
  const loading = useObjectTreeStore((s) => s.loading);
  const setLoading = useObjectTreeStore((s) => s.setLoading);
  const authenticated = useConnectionStore((s) => s.authenticated);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["zigbee2mqtt", "sonoff", "shelly", "denon", "sony-bravia"]));

  const filtered = useMemo(() => filterTree(tree, query), [tree, query]);
  const total = useMemo(() => countNodes(tree), [tree]);

  const requestTree = () => {
    setLoading(true);
    wsManager.send({
      type: "request",
      op: "objects.list",
      requestId: createId("objects"),
    });
  };

  useEffect(() => {
    if (authenticated && tree.length === 0 && !loading) {
      requestTree();
    }
  }, [authenticated, tree.length, loading]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader
        title="ioBroker-Objekte"
        subtitle={total > 0 ? `${total} Objekte` : "Objektbaum"}
        trailing={
          <GlassButton variant="ghost" onClick={requestTree} disabled={!authenticated || loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Laden
          </GlassButton>
        }
      />

      <div className="mb-3">
        <GlassInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Objekte suchen ..."
          aria-label="Objekte suchen"
        />
      </div>

      {!authenticated ? (
        <EmptyStateCard
          icon={Database}
          title="Nicht verbunden"
          description="Der Objektbaum kann geladen werden, sobald die WebSocket-Verbindung authentifiziert ist."
        />
      ) : filtered.length === 0 ? (
        <EmptyStateCard
          icon={Search}
          title={loading ? "Lade Objektbaum" : "Keine Objekte"}
          description={loading ? "Der Adapter liefert gerade die ioBroker-Struktur." : "Kein Objekt passt zur aktuellen Suche."}
        />
      ) : (
        <SectionCard bare className="gap-1">
          {filtered.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              query={query}
              onToggle={toggle}
            />
          ))}
        </SectionCard>
      )}
    </>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  query,
  onToggle,
}: {
  node: IoBrokerObjectTreeNode;
  depth: number;
  expanded: Set<string>;
  query: string;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const open = query.trim().length > 0 || expanded.has(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/10"
          aria-label={open ? "Schließen" : "Öffnen"}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{node.name}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">{node.id}</div>
        </div>
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <StatusBadge tone="neutral">{node.type}</StatusBadge>
          {node.role && <StatusBadge tone="neutral">{node.role}</StatusBadge>}
          {node.valueType && <StatusBadge tone="neutral">{node.valueType}</StatusBadge>}
          {node.writable && <StatusBadge tone="info">write</StatusBadge>}
          {node.value !== undefined && (
            <StatusBadge tone="neutral">{formatValue(node.value, node.unit)}</StatusBadge>
          )}
        </div>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              query={query}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function filterTree(nodes: IoBrokerObjectTreeNode[], query: string): IoBrokerObjectTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const result: IoBrokerObjectTreeNode[] = [];

  for (const node of nodes) {
    const children = filterTree(node.children, query);
    const matches = [node.id, node.name, node.type, node.role, node.valueType]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(q));

    if (matches || children.length > 0) {
      result.push({ ...node, children });
    }
  }

  return result;
}

function countNodes(nodes: IoBrokerObjectTreeNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

function formatValue(value: unknown, unit?: string): string {
  if (value === null) return "null";
  if (typeof value === "object") return "{...}";
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}
