export type SearchType = "artist" | "band" | "song" | "all";
export type SearchRequest = { name: string; type: SearchType };
export type SearchResult = {
  id: string;
  entity: "artist" | "work";
  name: string;
  kind: string | null;
  country: string | null;
  disambiguation: string | null;
  languages: string[];
};
export type SearchResponse = {
  query: SearchRequest;
  results: SearchResult[];
  total: number;
  limit: number;
  partial: boolean;
};
