import { create } from "zustand";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";

interface ObjectTreeState {
  tree: IoBrokerObjectTreeNode[];
  loading: boolean;
  lastLoadedAt?: number;
  setLoading: (loading: boolean) => void;
  setTree: (tree: IoBrokerObjectTreeNode[]) => void;
}

export const useObjectTreeStore = create<ObjectTreeState>((set) => ({
  tree: [],
  loading: false,
  setLoading: (loading) => set({ loading }),
  setTree: (tree) => set({ tree, loading: false, lastLoadedAt: Date.now() }),
}));
