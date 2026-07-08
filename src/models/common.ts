export type ID = string;
export type Timestamp = number;

export type IconName = string;
export type HexColor = `#${string}`;

export interface Meta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
