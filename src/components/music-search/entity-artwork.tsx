import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music2, UserRound, UsersRound, Disc3 } from "lucide-react";
import type { SearchResult } from "../../../shared/search";
import type { Artwork } from "../../../shared/explore";

export function EntityArtwork({
  result,
  caption = false,
}: {
  result: SearchResult;
  caption?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const query = useQuery({
    queryKey: ["artwork", result.entity, result.id],
    queryFn: async ({ signal }): Promise<Artwork | null> => {
      const response = await fetch(
        `/api/artwork?${new URLSearchParams({ entity: result.entity, id: result.id })}`,
        { signal },
      );
      if (!response.ok) throw new Error("Imagen no disponible");
      return (await response.json()).artwork;
    },
    enabled: visible,
    staleTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const artwork = query.data;
  const Icon =
    result.entity === "work"
      ? Music2
      : result.entity === "recording" || result.entity === "release-group"
        ? Disc3
        : result.kind === "Group"
          ? UsersRound
          : UserRound;
  return (
    <span
      ref={ref}
      className={caption ? "entity-artwork with-caption" : "entity-artwork"}
    >
      <span
        className="artwork-frame"
        title={
          artwork?.caption ??
          (query.isFetching ? "Cargando imagen…" : "Sin imagen disponible")
        }
      >
        {artwork && failedUrl !== artwork.url ? (
          <img
            src={artwork.url}
            alt={artwork.caption}
            width={56}
            height={56}
            loading="lazy"
            onError={() => setFailedUrl(artwork.url)}
          />
        ) : (
          <Icon size={24} aria-hidden="true" />
        )}
      </span>
      {artwork && (caption || result.entity === "work") && (
        <span className="artwork-caption" title={artwork.caption}>
          {caption ? artwork.caption : "Portada de una versión"}
        </span>
      )}
      {caption && artwork && (
        <a href={artwork.sourceUrl} target="_blank" rel="noreferrer">
          Imagen: {artwork.source} ↗
        </a>
      )}
      {caption && query.isError && (
        <button
          type="button"
          className="graph-action"
          onClick={() => void query.refetch()}
        >
          Reintentar imagen
        </button>
      )}
    </span>
  );
}
