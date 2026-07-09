import type { Severity } from "@/models/severity";
import type { EventCategory } from "@/models/eventCategory";
import type {
  NotificationAction,
  NotificationInput,
} from "@/models/notification";
import { TypedEmitter } from "@/services/events/EventEmitter";

/**
 * Producer registrieren sich hier. Sie sind die generische Schnittstelle,
 * über die Domänen (Automationen, Discovery, Szenen, Gruppen, System, …)
 * Notifications erzeugen. Kein Switch/If — der EventCenter iteriert.
 */
export interface NotificationProducerDescriptor {
  id: string;
  label: string;
  category?: EventCategory;
  defaultSeverity?: Severity;
  icon?: string;
  color?: string;
  enabled?: boolean;
  /** Startet den Producer. Rückgabewert deabonniert. */
  subscribe(emit: (input: NotificationInput) => void): () => void;
}

export type NotificationActionHandler = (
  action: NotificationAction,
  ctx: NotificationActionContext,
) => void | Promise<void>;

export interface NotificationActionContext {
  navigate?: (to: string) => void;
  notificationId: string;
}

interface RegistryEvents {
  registered: { descriptor: NotificationProducerDescriptor };
  unregistered: { id: string };
}

class NotificationRegistryImpl {
  private readonly producers = new Map<
    string,
    NotificationProducerDescriptor
  >();
  private readonly actionHandlers = new Map<string, NotificationActionHandler>();
  readonly events = new TypedEmitter<RegistryEvents>();

  registerProducer(descriptor: NotificationProducerDescriptor): () => void {
    this.producers.set(descriptor.id, descriptor);
    this.events.emit("registered", { descriptor });
    return () => this.unregisterProducer(descriptor.id);
  }

  unregisterProducer(id: string): void {
    if (!this.producers.delete(id)) return;
    this.events.emit("unregistered", { id });
  }

  listProducers(): NotificationProducerDescriptor[] {
    return Array.from(this.producers.values());
  }

  registerActionHandler(kind: string, handler: NotificationActionHandler): void {
    this.actionHandlers.set(kind, handler);
  }

  getActionHandler(kind: string): NotificationActionHandler | undefined {
    return this.actionHandlers.get(kind);
  }
}

export const notificationRegistry = new NotificationRegistryImpl();
