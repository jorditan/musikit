import type { SearchResult } from "../../../shared/search";

export type MusicNode = {
  id: string;
  position: { x: number; y: number };
  data: { result: SearchResult; root?: boolean };
};
export type MusicEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  ariaLabel?: string;
  data?: { relationLabel: string; relationType: string };
  style?: { stroke: string; strokeWidth: number; opacity: number };
};
export type NodePositionChange = {
  id: string;
  type: "position";
  position?: { x: number; y: number };
  dragging?: boolean;
};
