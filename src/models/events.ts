import type { Device } from "./device";
import type { ID } from "./common";

export type WsOutgoingMessage =
  | { type: "subscribe"; topic: string }
  | { type: "unsubscribe"; topic: string }
  | { type: "command"; deviceId: ID; capabilityId: string; value: unknown }
  | { type: "ping" };

export type WsIncomingEvent =
  | { type: "device.added"; device: Device }
  | { type: "device.updated"; device: Device }
  | { type: "device.removed"; deviceId: ID }
  | { type: "device.state"; deviceId: ID; capabilityId: string; value: unknown }
  | { type: "device.online"; deviceId: ID; online: boolean }
  | { type: "discovery.found"; device: Device }
  | { type: "pong" }
  | { type: "error"; message: string };

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";
