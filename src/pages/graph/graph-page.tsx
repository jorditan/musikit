import { useEffect, useRef, useState } from "react";
import { ReactFlow, Background, Controls, useNodesState } from "@xyflow/react";
import { ArrowLeft, X } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { ResultMetadata } from "@/components/music-search/result-metadata-view";
import { resultLabel } from "@/components/music-search/result-metadata";
import type { SearchResult } from "../../../shared/search";
import { MusicGraphNode, type MusicNode } from "./music-graph-node";
import "@xyflow/react/dist/style.css";

const nodeTypes = { music: MusicGraphNode };
export function GraphPage({
  result,
  onBack,
}: {
  result: SearchResult;
  onBack: () => void;
}) {
  const [nodes, , onNodesChange] = useNodesState<MusicNode>([
    {
      id: `${result.entity}:${result.id}`,
      type: "music",
      position: { x: 0, y: 0 },
      data: { result },
      draggable: true,
      deletable: false,
      ariaLabel: `${resultLabel(result)}: ${result.name}. Usá las flechas para mover el nodo.`,
    },
  ]);
  const [details, setDetails] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <SiteLayout>
      <section className="graph-page" aria-labelledby="graph-title">
        <div className="graph-toolbar">
          <button className="graph-action" onClick={onBack}>
            <ArrowLeft size={17} aria-hidden="true" />
            Volver a buscar
          </button>
          <span>EXPLORADOR / 001</span>
        </div>
        <h1 ref={titleRef} tabIndex={-1} id="graph-title">
          {result.name}
        </h1>
        <p className="graph-instructions">
          Arrastrá el nodo para moverlo. Seleccionalo para ver su información.
        </p>
        <div className="graph-workspace">
          <div className="graph-canvas" aria-label="Lienzo del grafo musical">
            <ReactFlow<MusicNode>
              nodes={nodes}
              edges={[]}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={() => setDetails(true)}
              onPaneClick={() => setDetails(false)}
              nodesConnectable={false}
              deleteKeyCode={null}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.4 }}
              minZoom={0.35}
              maxZoom={1.8}
              aria-label="Grafo musical interactivo"
            >
              <Background gap={24} size={1} color="var(--muted)" />
              <Controls
                showInteractive={false}
                aria-label="Controles del grafo"
              />
            </ReactFlow>
          </div>
          {details && (
            <aside className="graph-details" aria-label="Información del nodo">
              <div className="graph-detail-heading">
                <span>{resultLabel(result)}</span>
                <button
                  className="graph-action"
                  onClick={() => setDetails(false)}
                  aria-label="Cerrar información"
                >
                  <X size={18} />
                </button>
              </div>
              <h2>{result.name}</h2>
              <ResultMetadata result={result} />
              {result.kind && <p>Tipo en la fuente: {result.kind}</p>}
              <a
                href={`https://musicbrainz.org/${result.entity}/${encodeURIComponent(result.id)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en MusicBrainz ↗
              </a>
              <p className="muted">
                Las conexiones se incorporarán en la próxima entrega.
              </p>
            </aside>
          )}
        </div>
        <div className="graph-summary">
          <span>1 NODO / 0 CONEXIONES</span>
          <button className="graph-action" onClick={() => setDetails(true)}>
            Ver información de {result.name} ↗
          </button>
        </div>
      </section>
    </SiteLayout>
  );
}
