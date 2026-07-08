import type { ID } from "./common";

export interface ServerAuth {
  type: "none" | "token" | "basic";
  token?: string;
  username?: string;
  password?: string;
}

export interface ServerConfig {
  id: ID;
  name: string;
  url: string; // wss://... or ws://
  ssl: boolean;
  auth: ServerAuth;
  active: boolean;
}
