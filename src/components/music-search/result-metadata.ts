import type { SearchResult } from "../../../shared/search";

export function resultLabel(result: SearchResult) {
  if (result.entity === "release-group") return "Disco";
  if (result.entity === "recording") return "Grabación";
  if (result.entity === "work") return "Composición";
  if (result.kind === "Group") return "Banda";
  return "Artista";
}
export function resultMetadata(result: SearchResult) {
  return (
    [
      result.country && `País asociado: ${result.country}`,
      result.languages.length && `Idioma: ${result.languages.join(", ")}`,
      result.disambiguation,
    ]
      .filter(Boolean)
      .join(" · ") || "Sin metadatos adicionales"
  );
}
