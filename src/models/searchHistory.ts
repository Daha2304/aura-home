import type { ID, Timestamp } from "./common";
import type { SearchCategory } from "./search";

export interface SearchHistoryEntry {
  id: string;
  userId?: ID;
  query: string;
  at: Timestamp;
  resultCount?: number;
}

export interface RecentOpen {
  id: string;
  userId?: ID;
  resultId: string;
  providerId: string;
  category: SearchCategory;
  title: string;
  at: Timestamp;
  /** Optional ref for domain lookup (device id, scene id, …). */
  refType?: string;
  refId?: ID;
}

export interface SearchFavorite {
  id: string;
  userId?: ID;
  resultId: string;
  providerId: string;
  category: SearchCategory;
  title: string;
  addedAt: Timestamp;
  refType?: string;
  refId?: ID;
}
