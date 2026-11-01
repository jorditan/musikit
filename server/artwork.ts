import { setTimeout as delay } from "node:timers/promises";
import type { Artwork, EntityRef } from "../shared/explore.ts";
import { entityKey } from "../shared/explore.ts";
import { SearchError } from "./musicbrainz.ts";
import { relationIncludes, type Lookup, type MbEntity } from "./relations.ts";

type ImageResponse = {
  artists?:
    | {
        strMusicBrainzID?: string;
        strArtistThumb?: string;
        strArtist?: string;
      }[]
    | null;
  images?: {
    front?: boolean;
    thumbnails?: Record<string, string>;
    image?: string;
  }[];
};

export function createArtworkClient(
  lookup: Lookup,
  { fetcher = fetch, apiKey = "123", interval = 2100 } = {},
) {
  const cache = new Map<string, { artwork: Artwork | null; expires: number }>();
  const pending = new Map<string, Promise<Artwork | null>>();
  let artistQueue = Promise.resolve();
  let coverQueue = Promise.resolve();
  let lastStart = 0;
  let blockedUntil = 0;

  async function json(url: string) {
    const response = await fetcher(url, { signal: AbortSignal.timeout(12000) });
    if (response.status === 404) return null;
    if (!response.ok) {
      if (response.status === 429) blockedUntil = Date.now() + 60000;
      throw new SearchError(
        503,
        "Las imágenes no están disponibles por el momento.",
      );
    }
    return (await response.json()) as ImageResponse;
  }
  function artistImage(ref: EntityRef): Promise<Artwork | null> {
    const task = artistQueue.then(async () => {
      if (Date.now() < blockedUntil)
        throw new SearchError(
          503,
          "Límite temporal de imágenes. Reintentá más tarde.",
        );
      await delay(Math.max(0, interval - (Date.now() - lastStart)));
      lastStart = Date.now();
      const data = await json(
        `https://www.theaudiodb.com/api/v1/json/${encodeURIComponent(apiKey)}/artist-mb.php?i=${ref.id}`,
      );
      const artist = data?.artists?.find(
        (entry: { strMusicBrainzID?: string }) =>
          entry.strMusicBrainzID?.toLowerCase() === ref.id,
      );
      const url = artist?.strArtistThumb;
      if (typeof url !== "string" || !url.startsWith("https://")) return null;
      return {
        url,
        source: "TheAudioDB" as const,
        sourceUrl: "https://www.theaudiodb.com",
        caption: `Foto de ${artist?.strArtist || "artista"} · TheAudioDB`,
      };
    });
    artistQueue = task.then(
      () => {},
      () => {},
    );
    return task;
  }
  async function coverImage(ref: EntityRef): Promise<Artwork | null> {
    if (Date.now() < blockedUntil)
      throw new SearchError(
        503,
        "Límite temporal de imágenes. Reintentá más tarde.",
      );
    if (ref.entity === "release-group") {
      const data = await json(
        `https://coverartarchive.org/release-group/${ref.id}`,
      );
      const front = data?.images?.find((image) => image.front);
      const url = front?.thumbnails?.["250"] ?? front?.image;
      if (typeof url !== "string" || !url.startsWith("https://")) return null;
      return {
        url,
        source: "Cover Art Archive",
        sourceUrl: `https://musicbrainz.org/release-group/${ref.id}`,
        caption: "Portada del disco · Cover Art Archive",
      };
    }
    let recordingId = ref.id;
    if (ref.entity === "work") {
      const work = (await lookup(
        "work",
        ref.id,
        relationIncludes("work"),
      )) as MbEntity;
      if (work.id !== ref.id)
        throw new SearchError(
          502,
          "No se pudo verificar la identidad de la obra.",
        );
      const versions = (work.relations ?? []).filter(
        (r) => r.type === "performance" && r.recording,
      );
      const version =
        versions.find(
          (r) => !r.attributes?.some((a) => a === "cover" || a === "live"),
        ) ?? versions[0];
      if (!version?.recording) return null;
      recordingId = version.recording.id;
    }
    const recording = (await lookup(
      "recording",
      recordingId,
      "releases+artists",
    )) as MbEntity;
    if (recording.id !== recordingId)
      throw new SearchError(
        502,
        "No se pudo verificar la identidad de la grabación.",
      );
    const credit =
      recording["artist-credit"]
        ?.map((c) => c.name ?? c.artist?.name)
        .filter(Boolean)
        .join(", ") || "Intérprete sin informar";
    // A bounded sample, never a title-based match or a claim of canonical cover.
    for (const release of (recording.releases ?? []).slice(0, 3)) {
      const data = await json(
        `https://coverartarchive.org/release/${release.id}`,
      );
      const front = data?.images?.find(
        (image: { front?: boolean }) => image.front,
      );
      const url = front?.thumbnails?.["250"] ?? front?.image;
      if (typeof url !== "string" || !url.startsWith("https://")) continue;
      return {
        url,
        source: "Cover Art Archive",
        sourceUrl: `https://musicbrainz.org/release/${release.id}`,
        recordingId,
        releaseId: release.id,
        caption: `Versión: ${credit} · ${release.title ?? "Lanzamiento"}`,
      };
    }
    return null;
  }
  return (ref: EntityRef): Promise<Artwork | null> => {
    const key = entityKey(ref);
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return Promise.resolve(hit.artwork);
    const active = pending.get(key);
    if (active) return active;
    if (pending.size >= 24)
      return Promise.reject(
        new SearchError(503, "Hay imágenes en espera. Reintentá más tarde."),
      );
    const resolve =
      ref.entity === "artist"
        ? artistImage(ref)
        : coverQueue.then(() => coverImage(ref));
    if (ref.entity !== "artist")
      coverQueue = resolve.then(
        () => {},
        () => {},
      );
    const task = resolve
      .then((artwork) => {
        if (cache.size >= 500) cache.delete(cache.keys().next().value!);
        cache.set(key, {
          artwork,
          expires: Date.now() + (artwork ? 86400000 : 600000),
        });
        return artwork;
      })
      .finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}
