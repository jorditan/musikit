export type SearchType = "artist" | "band" | "song" | "all" | "artists";
export type SearchRequest = { name: string; type: SearchType; offset?: number };
export type SearchResult = {
  id: string;
  entity: "artist" | "work" | "recording" | "release-group";
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
  groups?: {
    type: "artists" | "song";
    total: number | null;
    results: SearchResult[];
    error?: string;
  }[];
};
