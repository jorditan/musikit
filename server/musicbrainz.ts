import { setTimeout as delay } from "node:timers/promises";
import type { SearchRequest, SearchResponse } from "../shared/search.ts";

export class SearchError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function parseSearch(params: URLSearchParams): SearchRequest {
  const name = (params.get("name") ?? "").trim();
  const type = params.get("type") ?? "all";
  if (!name || name.length > 200)
    throw new SearchError(
      400,
      "Ingresá un nombre de entre 1 y 200 caracteres.",
    );
  if (type !== "artist" && type !== "band" && type !== "song" && type !== "all")
    throw new SearchError(400, "Elegí artista, banda o canción.");
  return { name, type };
}

export function searchUrl({ name, type }: SearchRequest) {
  // A quoted Lucene phrase treats operators as text; escape syntax before URL encoding.
  const escaped = name.replace(/([+\-!(){}[\]^"~*?:\\/|&])/g, "\\$1");
  const entity = type === "song" ? "work" : "artist";
  const filter =
    type === "song" || type === "all"
      ? ""
      : ` AND type:${type === "band" ? "group" : "person"}`;
  const url = new URL(`https://musicbrainz.org/ws/2/${entity}`);
  url.search = new URLSearchParams({
    query: `${entity}:"${escaped}"${filter}`,
    fmt: "json",
    limit: "10",
  }).toString();
  return url;
}

type Entry = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  languages?: string[];
  language?: string;
};
const optional = (value: unknown) =>
  typeof value === "string" && value ? value : null;

export function normalize(data: unknown, query: SearchRequest): SearchResponse {
  if (!data || typeof data !== "object")
    throw new SearchError(
      502,
      "MusicBrainz devolvió una respuesta inesperada.",
    );
  const body = data as { count?: unknown; artists?: Entry[]; works?: Entry[] };
  const entries = query.type === "song" ? body.works : body.artists;
  if (
    !Array.isArray(entries) ||
    typeof body.count !== "number" ||
    !Number.isFinite(body.count)
  )
    throw new SearchError(
      502,
      "MusicBrainz devolvió una respuesta inesperada.",
    );
  const results = entries.slice(0, 10).map((entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof (entry.name ?? entry.title) !== "string"
    )
      throw new SearchError(502, "MusicBrainz devolvió un resultado inválido.");
    return {
      id: entry.id,
      entity: query.type === "song" ? ("work" as const) : ("artist" as const),
      name: (entry.name ?? entry.title)!,
      kind: optional(entry.type),
      country: optional(entry.country),
      disambiguation: optional(entry.disambiguation),
      languages: Array.isArray(entry.languages)
        ? entry.languages.filter(
            (language): language is string => typeof language === "string",
          )
        : entry.language
          ? [entry.language]
          : [],
    };
  });
  return {
    query,
    results,
    total: body.count,
    limit: 10,
    partial: body.count > results.length,
  };
}

export function createMusicBrainzClient({
  fetcher = fetch,
  interval = 1100,
  userAgent = "MusiKit/0.1.0 (local development)",
} = {}) {
  let tail = Promise.resolve();
  let lastStart = 0;
  let pending = 0;
  const search = async (
    query: SearchRequest,
    signal?: AbortSignal,
  ): Promise<SearchResponse> => {
    if (pending >= 10)
      throw new SearchError(
        503,
        "Hay muchas búsquedas en espera. Reintentá en unos segundos.",
      );
    pending++;
    const task = tail.then(async () => {
      signal?.throwIfAborted();
      await delay(Math.max(0, interval - (Date.now() - lastStart)), undefined, {
        signal,
      });
      signal?.throwIfAborted();
      lastStart = Date.now();
      try {
        const response = await fetcher(searchUrl(query), {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
            : AbortSignal.timeout(12000),
        });
        if (!response.ok)
          throw new SearchError(
            response.status === 429 || response.status === 503 ? 503 : 502,
            "MusicBrainz no está disponible en este momento. Reintentá en unos segundos.",
          );
        return normalize(await response.json(), query);
      } catch (error) {
        if (error instanceof SearchError) throw error;
        throw new SearchError(
          502,
          "No pudimos conectar con MusicBrainz. Reintentá en unos segundos.",
        );
      }
    });
    tail = task.then(
      () => {},
      () => {},
    );
    try {
      return await task;
    } finally {
      pending--;
    }
  };
  return async (
    query: SearchRequest,
    signal?: AbortSignal,
  ): Promise<SearchResponse> => {
    if (query.type !== "all") return search(query, signal);
    // Both indices share the same queue and rate limit. Preserve order within each index.
    const [artists, works] = await Promise.all([
      search(query, signal),
      search({ ...query, type: "song" }, signal),
    ]);
    const results = [];
    for (let index = 0; results.length < 10 && index < 10; index++) {
      if (artists.results[index]) results.push(artists.results[index]);
      if (results.length < 10 && works.results[index])
        results.push(works.results[index]);
    }
    const total = artists.total + works.total;
    return {
      query,
      results,
      total,
      limit: 10,
      partial: total > results.length,
    };
  };
}
