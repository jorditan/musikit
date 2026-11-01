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
  if (
    type !== "artist" &&
    type !== "band" &&
    type !== "song" &&
    type !== "all" &&
    type !== "artists"
  )
    throw new SearchError(400, "Elegí artista, banda o canción.");
  const offset = Number(params.get("offset") ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    throw new SearchError(400, "Página inválida.");
  return { name, type, ...(offset ? { offset } : {}) };
}

export function searchUrl({ name, type, offset = 0 }: SearchRequest) {
  // A quoted Lucene phrase treats operators as text; escape syntax before URL encoding.
  const escaped = name.replace(/([+\-!(){}[\]^"~*?:\\/|&])/g, "\\$1");
  const entity = type === "song" ? "work" : "artist";
  const filter =
    type === "song" || type === "all" || type === "artists"
      ? ""
      : ` AND type:${type === "band" ? "group" : "person"}`;
  const url = new URL(`https://musicbrainz.org/ws/2/${entity}`);
  url.search = new URLSearchParams({
    query: `${entity}:"${escaped}"${filter}`,
    fmt: "json",
    limit: type === "all" ? "5" : "20",
    offset: String(offset),
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
  const results = entries
    .slice(0, query.type === "all" ? 5 : 20)
    .map((entry) => {
      if (
        !entry ||
        typeof entry.id !== "string" ||
        typeof (entry.name ?? entry.title) !== "string"
      )
        throw new SearchError(
          502,
          "MusicBrainz devolvió un resultado inválido.",
        );
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
    limit: query.type === "all" ? 5 : 20,
    partial: body.count > (query.offset ?? 0) + results.length,
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
  const request = async (url: URL, signal?: AbortSignal): Promise<unknown> => {
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
        const response = await fetcher(url, {
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
        return response.json();
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
  const search = async (query: SearchRequest, signal?: AbortSignal) =>
    normalize(await request(searchUrl(query), signal), query);
  const lookupCache = new Map<string, { expires: number; value: unknown }>();
  const lookups = new Map<string, Promise<unknown>>();
  const cachedRequest = (url: URL): Promise<unknown> => {
    const key = url.toString();
    const cached = lookupCache.get(key);
    if (cached && cached.expires > Date.now())
      return Promise.resolve(cached.value);
    const active = lookups.get(key);
    if (active) return active;
    const task = request(url)
      .then((value) => {
        if (lookupCache.size >= 300)
          lookupCache.delete(lookupCache.keys().next().value!);
        lookupCache.set(key, { value, expires: Date.now() + 3600000 });
        return value;
      })
      .finally(() => lookups.delete(key));
    lookups.set(key, task);
    return task;
  };
  const lookup = (entity: string, id: string, inc: string) => {
    const url = new URL("https://musicbrainz.org/ws/2/" + entity + "/" + id);
    url.search = new URLSearchParams({ fmt: "json", inc }).toString();
    return cachedRequest(url);
  };
  const browse = (entity: string, params: Record<string, string>) => {
    const url = new URL("https://musicbrainz.org/ws/2/" + entity);
    url.search = new URLSearchParams({ ...params, fmt: "json" }).toString();
    return cachedRequest(url);
  };
  const unifiedSearch = async (
    query: SearchRequest,
    signal?: AbortSignal,
  ): Promise<SearchResponse> => {
    if (query.type !== "all") return search(query, signal);
    const outcomes = await Promise.allSettled([
      search({ name: query.name, type: "all" }, signal),
      search({ name: query.name, type: "song" }, signal),
    ]);
    signal?.throwIfAborted();
    const groups = outcomes.map((outcome, index) => ({
      type: index === 0 ? ("artists" as const) : ("song" as const),
      total: outcome.status === "fulfilled" ? outcome.value.total : null,
      results:
        outcome.status === "fulfilled" ? outcome.value.results.slice(0, 5) : [],
      ...(outcome.status === "rejected"
        ? {
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : "Fuente indisponible.",
          }
        : {}),
    }));
    const results = groups.flatMap((group) => group.results);
    const total = groups.reduce((sum, group) => sum + (group.total ?? 0), 0);
    return {
      query,
      results,
      total,
      limit: 10,
      partial: groups.some(
        (group) => group.total === null || group.total > group.results.length,
      ),
      groups,
    };
  };
  return Object.assign(unifiedSearch, { lookup, browse });
}
