import type { Device } from "./device";
import type { ID } from "./common";
import type { AppNotification } from "./notification";
import type { IoBrokerObjectTreeNode } from "./iobrokerObject";

/**
 * Ausgehende Nachrichten (App → Server). Bewusst offen gehalten:
 * "command" trägt einen beliebigen Payload, damit unterschiedliche
 * Server-Protokolle darauf abgebildet werden können.
 */
export type WsOutgoingMessage =
  | { type: "auth"; payload: Record<string, unknown> }
  | { type: "subscribe"; topic: string }
  | { type: "unsubscribe"; topic: string }
  | { type: "command"; deviceId: ID; key: string; value: unknown; requestId?: string }
  | { type: "request"; op: string; payload?: unknown; requestId?: string }
  | { type: "ping"; ts?: number };

/**
 * Eingehende Events (Server → App). Der Dispatcher übersetzt Rohdaten in diese Form.
 */
export type WsIncomingEvent =
  | { type: "welcome"; payload?: Record<string, unknown> }
  | { type: "auth_ok"; payload?: Record<string, unknown> }
  | { type: "auth_failed"; reason?: string }
  | { type: "snapshot"; devices: Device[] }
  | { type: "object_tree"; tree: IoBrokerObjectTreeNode[]; requestId?: string }
  | { type: "device.added"; device: Device }
  | { type: "device.updated"; device: Device }
  | { type: "device.removed"; deviceId: ID }
  | { type: "device.state"; deviceId: ID; key: string; value: unknown }
  | { type: "device.online"; deviceId: ID; online: boolean }
  | { type: "room.updated"; roomId: ID; patch: Record<string, unknown> }
  | { type: "scene.updated"; sceneId: ID; patch: Record<string, unknown> }
  | { type: "automation.updated"; automationId: ID; patch: Record<string, unknown> }
  | { type: "notification"; notification: AppNotification }
  | {
      type: "command.ack";
      requestId?: string;
      success: boolean;
      deviceId?: ID;
      key?: string;
      value?: unknown;
      code?: string;
      message?: string;
    }
  | { type: "pong"; ts?: number }
  | { type: "noop" }
  | { type: "error"; message: string; code?: string; requestId?: string };

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "authenticating"
  | "authenticated"
  | "reconnecting"
  | "disconnected"
  | "error";
