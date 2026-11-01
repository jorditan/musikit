import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X, Network, LoaderCircle } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { ResultMetadata } from "@/components/music-search/result-metadata-view";
import { EntityArtwork } from "@/components/music-search/entity-artwork";
import { resultLabel } from "@/components/music-search/result-metadata";
import type { SearchResult } from "../../../shared/search";
import { entityKey } from "../../../shared/explore";
import { ForceGraphCanvas } from "./force-graph-canvas";
import { nodeIcons } from "./node-presentation";
import { useGraphExpansion } from "./use-graph-expansion";
import { visibleEdges } from "./graph-data";

export function GraphPage({
  result,
  onBack,
}: {
  result: SearchResult;
  onBack: () => void;
}) {
  const graph = useGraphExpansion(result);
  const [selection, setActive] = useState(result);
  const active =
    graph.nodes.find((node) => node.id === entityKey(selection))?.data.result ??
    selection;
  const [details, setDetails] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  const key = entityKey(active);
  const page = graph.pages[key];
  const error = graph.errors[key];
  const memberKey = `${key}:members`;
  const memberPage = graph.pages[memberKey];
  const affiliations =
    active.kind === "Group"
      ? "integrantes"
      : active.kind === "Person"
        ? "bandas"
        : "bandas e integrantes";
  const displayedEdges = visibleEdges(graph.edges);
  const hiddenCount = graph.edges.length - displayedEdges.length;
  const connectionName =
    active.entity === "artist"
      ? "discos"
      : active.entity === "release-group"
        ? "canciones"
        : "artistas";
  function select(node: SearchResult) {
    setActive(node);
    setDetails(true);
  }
  const names = new Map(
    graph.nodes.map((node) => [node.id, node.data.result.name]),
  );
  return (
    <SiteLayout>
      <section className="graph-page" aria-labelledby="graph-title">
        <div className="graph-toolbar">
          <button className="graph-action" onClick={onBack}>
            <ArrowLeft size={17} aria-hidden="true" />
            Volver a buscar
          </button>
          <span>EXPLORADOR / CONEXIONES REALES</span>
        </div>
        <h1 ref={titleRef} tabIndex={-1} id="graph-title">
          {result.name}
        </h1>
        <p className="graph-instructions">
          Hacé clic en un punto para ver sus detalles y elegí qué conexiones
          cargar desde el panel. Arrastrá el punto o su nombre para moverlo; las
          conexiones se acomodan con la simulación.
        </p>
        <div className="graph-legend" aria-label="Tipos de nodos">
          {Object.entries(nodeIcons).map(([category, Icon]) => (
            <span key={category} className={`node-${category}`}>
              <Icon size={15} aria-hidden="true" />
              {
                {
                  artist: "Artista",
                  band: "Banda",
                  album: "Disco",
                  song: "Canción",
                }[category]
              }
            </span>
          ))}
        </div>
        <div className="graph-workspace">
          <div className="graph-canvas" aria-label="Lienzo del grafo musical">
            <ForceGraphCanvas
              nodes={graph.nodes}
              edges={displayedEdges}
              selectedId={key}
              onSelect={select}
              onBackgroundClick={() => setDetails(false)}
              onPositionsChange={graph.onNodesChange}
            />
          </div>
          {details && (
            <aside className="graph-details" aria-label="Información del nodo">
              <div className="graph-detail-heading">
                <span>{resultLabel(active)}</span>
                <button
                  className="graph-action"
                  onClick={() => setDetails(false)}
                  aria-label="Cerrar información"
                >
                  <X size={18} />
                </button>
              </div>
              <h2>{active.name}</h2>
              <EntityArtwork key={key} result={active} caption />
              <ResultMetadata result={active} />
              <button
                className="expand-button"
                disabled={!!graph.busy || page?.nextOffset === null}
                onClick={() => void graph.expand(active)}
              >
                {graph.busy === key ? (
                  <LoaderCircle
                    size={18}
                    className="loading-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <Network size={18} aria-hidden="true" />
                )}
                {graph.busy === key
                  ? `Cargando ${connectionName}…`
                  : error
                    ? `Reintentar ${connectionName}`
                    : page?.nextOffset === null
                      ? "Exploración completada"
                      : page
                        ? `Cargar más ${connectionName}`
                        : `Explorar ${connectionName}`}
              </button>
              {active.entity === "artist" && (
                <>
                  <button
                    className="graph-action"
                    disabled={!!graph.busy || memberPage?.nextOffset === null}
                    onClick={() => void graph.expand(active, "members")}
                  >
                    {graph.busy === memberKey
                      ? `Cargando ${affiliations}…`
                      : graph.errors[memberKey]
                        ? `Reintentar ${affiliations}`
                        : memberPage?.nextOffset === null
                          ? "Vínculos cargados"
                          : memberPage
                            ? `Cargar más ${affiliations}`
                            : `Explorar ${affiliations}`}
                  </button>
                  <p role="status" aria-live="polite">
                    {memberPage &&
                      (memberPage.total
                        ? `${memberPage.nextOffset ?? memberPage.total} de ${memberPage.total} vínculos de ${affiliations} cargados.`
                        : `Sin ${affiliations} documentados.`)}
                  </p>
                  {graph.errors[memberKey] && (
                    <p role="alert" className="search-error">
                      {graph.errors[memberKey]}
                    </p>
                  )}
                </>
              )}
              <div role="status" aria-live="polite">
                {page && (
                  <p>
                    {page.total === 0
                      ? "Sin relaciones documentadas en las categorías disponibles."
                      : `${page.nextOffset ?? page.total} de ${page.total} relaciones cargadas para este nodo.`}
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="search-error">
                  {error}
                </p>
              )}
              <p className="muted">
                {active.entity === "artist"
                  ? "Los discos se agrupan sin repetir reediciones. Seleccioná un disco para explorar sus canciones."
                  : active.entity === "release-group"
                    ? "Canciones de una edición oficial del disco; otras ediciones pueden variar."
                    : "Autores e intérpretes documentados; la cobertura depende de los créditos disponibles."}{" "}
                Cada expansión añade hasta 12 conexiones de MusicBrainz.
              </p>
              <a
                href={`https://musicbrainz.org/${active.entity}/${encodeURIComponent(active.id)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en MusicBrainz ↗
              </a>
            </aside>
          )}
        </div>
        <div className="graph-summary">
          <span>
            {graph.nodes.length} NODOS / {displayedEdges.length} CONEXIONES
          </span>
          <button className="graph-action" onClick={() => setDetails(true)}>
            Ver información de {active.name} ↗
          </button>
        </div>
        {hiddenCount > 0 && (
          <p className="muted">
            {hiddenCount} conexiones directas omitidas porque ya existe un
            camino entre esas entidades a través de otros nodos visibles.
          </p>
        )}
        <details className="graph-accessible-list">
          <summary>Explorar nodos y relaciones en lista</summary>
          <ul>
            {graph.nodes.map((node) => (
              <li key={node.id}>
                <button
                  className="graph-action"
                  onClick={() => select(node.data.result)}
                >
                  {node.data.result.name} · {resultLabel(node.data.result)} ↗
                </button>
              </li>
            ))}
          </ul>
          <ul aria-label="Relaciones documentadas">
            {displayedEdges.map((edge) => (
              <li key={edge.id}>
                {names.get(edge.source)} →{" "}
                {String(edge.data?.relationLabel ?? edge.label)} →{" "}
                {names.get(edge.target)}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </SiteLayout>
  );
}
