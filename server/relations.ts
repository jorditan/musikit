import type {
  EntityRef,
  RelationsResponse,
  Connection,
} from "../shared/explore.ts";
import { entityKey } from "../shared/explore.ts";
import type { SearchResult } from "../shared/search.ts";
import { SearchError } from "./musicbrainz.ts";

export type Lookup = (
  entity: string,
  id: string,
  inc: string,
) => Promise<unknown>;
export type MbEntity = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  languages?: string[];
  relations?: MbRelation[];
  "artist-credit"?: { name?: string; artist?: MbEntity }[];
  releases?: MbEntity[];
  "primary-type"?: string;
  media?: { tracks?: { recording?: MbEntity }[] }[];
};
type MbRelation = {
  type: string;
  "type-id"?: string;
  direction?: string;
  "target-type": string;
  attributes?: string[];
  artist?: MbEntity;
  work?: MbEntity;
  recording?: MbEntity;
};
const mbid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseEntity(params: URLSearchParams): EntityRef {
  const id = params.get("id") ?? "";
  const entity = params.get("entity");
  if (
    !mbid.test(id) ||
    (entity !== "artist" &&
      entity !== "work" &&
      entity !== "recording" &&
      entity !== "release-group")
  )
    throw new SearchError(400, "Identidad musical inválida.");
  return { id: id.toLowerCase(), entity };
}
export function relationIncludes(entity: EntityRef["entity"]) {
  return entity === "work"
    ? "artist-rels+recording-rels+artist-credits"
    : entity === "recording"
      ? "artist-rels+artists"
      : "artist-rels";
}
export function asResult(
  entry: MbEntity,
  entity: EntityRef["entity"],
): SearchResult {
  return {
    id: entry.id,
    entity,
    name: entry.name ?? entry.title ?? "Sin título",
    kind: entry["primary-type"] ?? entry.type ?? null,
    country: entry.country ?? null,
    disambiguation: entry.disambiguation || null,
    languages: entry.languages ?? [],
  };
}
const labels: Record<string, string> = {
  writer: "es autor de",
  composer: "compuso",
  lyricist: "escribió la letra de",
  "member of band": "es miembro de",
  performance: "es grabación de",
  vocal: "voz en",
  instrument: "instrumento en",
  producer: "produjo",
  conductor: "dirigió",
  arranger: "arregló",
  "artist credit": "interpreta",
};
export function normalizeRelations(
  ref: EntityRef,
  data: MbEntity,
  offset = 0,
): RelationsResponse {
  if (!data || data.id !== ref.id)
    throw new SearchError(502, "La fuente no devolvió la entidad solicitada.");
  const nodes = new Map<string, SearchResult>();
  const edges = new Map<string, Connection>();
  for (const relation of data.relations ?? []) {
    const type = relation["target-type"];
    if (type !== "artist") continue;
    if (ref.entity === "artist") {
      if (
        relation.type !== "member of band" ||
        relation.direction !== (data.type === "Group" ? "backward" : "forward")
      )
        continue;
    } else if (
      ![
        "writer",
        "composer",
        "lyricist",
        "vocal",
        "instrument",
        "producer",
        "conductor",
        "arranger",
      ].includes(relation.type)
    )
      continue;
    const entry = relation[type];
    if (!entry || !mbid.test(entry.id)) continue;
    const result = asResult(entry, type);
    if (ref.entity === "artist" && !result.kind)
      result.kind = relation.direction === "forward" ? "Group" : "Person";
    const key = entityKey(result);
    const origin = entityKey(ref);
    if (key === origin) continue;
    const source = relation.direction === "backward" ? key : origin;
    const target = relation.direction === "backward" ? origin : key;
    const id = `${source}|${relation["type-id"] ?? relation.type}|${target}`;
    nodes.set(key, result);
    edges.set(id, {
      id,
      source,
      target,
      type: relation.type,
      label: labels[relation.type] ?? relation.type,
    });
  }
  // Recording credits explicitly identify performers; they are not inferred from titles.
  for (const credit of ref.entity === "recording"
    ? (data["artist-credit"] ?? [])
    : ref.entity === "work"
      ? (data.relations ?? [])
          .filter((r) => r.type === "performance")
          .flatMap((r) => r.recording?.["artist-credit"] ?? [])
      : []) {
    if (!credit.artist || !mbid.test(credit.artist.id)) continue;
    const artist = asResult(credit.artist, "artist");
    const source = entityKey(artist),
      target = entityKey(ref);
    nodes.set(source, artist);
    const id = `${source}|artist credit|${target}`;
    edges.set(id, {
      id,
      source,
      target,
      type: "artist credit",
      label:
        ref.entity === "work"
          ? "interpretó una versión de"
          : labels["artist credit"],
    });
  }
  const all = [...edges.values()];
  const batch = all.slice(offset, offset + 12);
  const needed = new Set(batch.flatMap((edge) => [edge.source, edge.target]));
  return {
    subject: asResult(data, ref.entity),
    nodes: [...nodes]
      .filter(([key]) => needed.has(key))
      .map(([, value]) => value),
    edges: batch,
    total: all.length,
    nextOffset: offset + 12 < all.length ? offset + 12 : null,
  };
}

export type Browse = (
  entity: string,
  params: Record<string, string>,
) => Promise<unknown>;

function connected(
  ref: EntityRef,
  entries: MbEntity[],
  entity: SearchResult["entity"],
  type: string,
  label: string,
): RelationsResponse {
  const nodes = [
    ...new Map(
      entries
        .filter((entry) => mbid.test(entry.id))
        .map((entry) => [entry.id, asResult(entry, entity)]),
    ).values(),
  ];
  return {
    nodes,
    edges: nodes.map((node) => ({
      id: `${entityKey(ref)}|${type}|${entityKey(node)}`,
      source: entityKey(ref),
      target: entityKey(node),
      type,
      label,
    })),
    total: nodes.length,
    nextOffset: null,
  };
}

export async function loadRelations(
  ref: EntityRef,
  offset: number,
  members: boolean,
  lookup: Lookup,
  browse: Browse,
): Promise<RelationsResponse> {
  if (members && ref.entity !== "artist")
    throw new SearchError(
      400,
      "Las bandas e integrantes se consultan desde un artista o banda.",
    );
  if (ref.entity === "artist" && !members) {
    const artist = (await lookup("artist", ref.id, "artist-rels")) as MbEntity;
    if (artist?.id !== ref.id)
      throw new SearchError(
        502,
        "La fuente no devolvió el artista solicitado.",
      );
    const data = (await browse("release-group", {
      artist: ref.id,
      type: "album",
      limit: "12",
      offset: String(offset),
    })) as { "release-groups": MbEntity[]; "release-group-count": number };
    if (
      !Array.isArray(data?.["release-groups"]) ||
      !Number.isSafeInteger(data["release-group-count"])
    )
      throw new SearchError(502, "No pudimos cargar los discos.");
    const result = connected(
      ref,
      data["release-groups"],
      "release-group",
      "album",
      "publicó",
    );
    const next = offset + data["release-groups"].length;
    return {
      ...result,
      subject: asResult(artist, "artist"),
      total: data["release-group-count"],
      nextOffset:
        next < data["release-group-count"] && next > offset ? next : null,
    };
  }
  if (ref.entity === "release-group") {
    // One edition per album keeps reissues and bonus-track variants out of the graph.
    const editions = (await browse("release", {
      "release-group": ref.id,
      status: "official",
      limit: "1",
    })) as { releases: MbEntity[] };
    if (!Array.isArray(editions?.releases))
      throw new SearchError(502, "No pudimos cargar las ediciones del disco.");
    const edition = editions.releases[0];
    if (!edition) return { nodes: [], edges: [], total: 0, nextOffset: null };
    const data = (await lookup(
      "release",
      edition.id,
      "recordings",
    )) as MbEntity;
    if (data?.id !== edition.id || !Array.isArray(data.media))
      throw new SearchError(502, "No pudimos cargar las canciones del disco.");
    const all = connected(
      ref,
      data.media.flatMap((medium) =>
        (medium.tracks ?? []).flatMap((track) =>
          track.recording ? [track.recording] : [],
        ),
      ),
      "recording",
      "track",
      "incluye",
    );
    const edges = all.edges.slice(offset, offset + 12);
    const ids = new Set(edges.map((edge) => edge.target));
    return {
      ...all,
      nodes: all.nodes.filter((node) => ids.has(entityKey(node))),
      edges,
      nextOffset: offset + 12 < all.total ? offset + 12 : null,
    };
  }
  const data = (await lookup(
    ref.entity,
    ref.id,
    relationIncludes(ref.entity),
  )) as MbEntity;
  return normalizeRelations(ref, data, offset);
}
