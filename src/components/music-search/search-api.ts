import type { SearchRequest, SearchResponse } from "../../../shared/search";
export async function fetchResults(
  query: SearchRequest,
  signal: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch(`/api/search?${new URLSearchParams(query)}`, {
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new Error(
      data?.error ||
        "No pudimos completar la búsqueda. Revisá la conexión y reintentá.",
    );
  return data;
}
