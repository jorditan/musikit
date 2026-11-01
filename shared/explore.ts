import type { SearchResult } from "./search.ts";

export type EntityRef = Pick<SearchResult, "entity" | "id">;
export type Connection = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};
export type RelationsResponse = {
  subject?: SearchResult;
  nodes: SearchResult[];
  edges: Connection[];
  total: number;
  nextOffset: number | null;
};
export type Artwork = {
  url: string;
  source: "TheAudioDB" | "Cover Art Archive";
  sourceUrl: string;
  caption: string;
  recordingId?: string;
  releaseId?: string;
};
export const entityKey = (entity: EntityRef) => `${entity.entity}:${entity.id}`;
