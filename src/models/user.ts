import type { ID } from "./common";

export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: ID;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email?: string;
}
