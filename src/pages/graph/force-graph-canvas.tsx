import { useEffect, useEffectEvent, useRef } from "react";
import ForceGraph from "force-graph";
import { useReducedMotion } from "motion/react";
import type { MusicNode, MusicEdge, NodePositionChange } from "./graph-types";
import { nodeCategory } from "./node-presentation";
import { resultLabel } from "@/components/music-search/result-metadata";
import {
  reconcileNodes,
  type CanvasNode,
  type CanvasLink,
} from "./force-graph-model";

type Props = {
  nodes: MusicNode[];
  edges: MusicEdge[];
  selectedId: string;
  onSelect: (result: MusicNode["data"]["result"]) => void;
  onBackgroundClick: () => void;
  onPositionsChange: (changes: NodePositionChange[]) => void;
};
const colors = {
  artist: "#748fe8",
  band: "#c18aee",
  album: "#dfab4b",
  song: "#65bc9b",
};

function paintIcon(
  ctx: CanvasRenderingContext2D,
  category: keyof typeof colors,
) {
  ctx.strokeStyle = "#16191e";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (category === "album") {
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.moveTo(2, 0);
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
  } else if (category === "song") {
    ctx.moveTo(-2, 4);
    ctx.lineTo(-2, -5);
    ctx.lineTo(5, -7);
    ctx.lineTo(5, 2);
    ctx.moveTo(-2, 4);
    ctx.ellipse(-4, 4, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.moveTo(5, 2);
    ctx.ellipse(3, 2, 2, 1.5, 0, 0, Math.PI * 2);
  } else {
    const centers = category === "band" ? [-4, 4] : [0];
    for (const x of centers) {
      ctx.moveTo(x + 2.5, -3);
      ctx.arc(x, -3, 2.5, 0, Math.PI * 2);
      ctx.moveTo(x - 4, 6);
      ctx.bezierCurveTo(x - 4, 0, x + 4, 0, x + 4, 6);
    }
  }
  ctx.stroke();
}

export function ForceGraphCanvas({
  nodes,
  edges,
  selectedId,
  onSelect,
  onBackgroundClick,
  onPositionsChange,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<ForceGraph<CanvasNode, CanvasLink> | null>(null);
  const palette = useRef({ foreground: "#232722", link: "#60665c" });
  const reduced = useReducedMotion();
  const select = useEffectEvent((node: CanvasNode) => onSelect(node.result));
  const backgroundClick = useEffectEvent(() => onBackgroundClick());
  const savePositions = useEffectEvent(() => {
    const data = instance.current?.graphData();
    if (data)
      onPositionsChange(
        data.nodes.map((node) => ({
          id: node.id,
          type: "position",
          position: { x: node.x ?? 0, y: node.y ?? 0 },
        })),
      );
  });
  const draw = useEffectEvent(
    (node: CanvasNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const category = nodeCategory(node.result);
      const radius = node.root ? 16 : 13;
      ctx.save();
      ctx.translate(node.x ?? 0, node.y ?? 0);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors[category];
      ctx.fill();
      if (node.id === selectedId) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = colors[category];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      paintIcon(ctx, category);
      const fontSize = Math.min(15, Math.max(10, 11 / scale));
      ctx.font = `${fontSize}px "Space Grotesk Variable", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = palette.current.foreground;
      const label =
        node.result.name.length > 25
          ? `${node.result.name.slice(0, 24)}…`
          : node.result.name;
      ctx.fillText(label, 0, radius + 8);
      ctx.restore();
    },
  );
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const graph = new ForceGraph<CanvasNode, CanvasLink>(element)
      .minZoom(0.15)
      .maxZoom(3)
      .nodeRelSize(15)
      .nodeCanvasObject((node, ctx, scale) => draw(node, ctx, scale))
      .nodePointerAreaPaint((node, color, ctx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect((node.x ?? 0) - 75, (node.y ?? 0) + 15, 150, 26);
      })
      .nodeLabel((node) => {
        const label = document.createElement("span");
        label.textContent = `${node.result.name} · ${resultLabel(node.result)}`;
        return label;
      })
      .linkWidth(1)
      .linkColor(() => palette.current.link)
      .onNodeClick((node) => {
        savePositions();
        select(node);
      })
      .onBackgroundClick(() => backgroundClick())
      .onNodeDragEnd(() => savePositions())
      .onEngineStop(() => savePositions());
    // Keep space for icons/labels; use native drag, damping, charge and centering.
    graph.d3Force("link")?.distance(100);
    instance.current = graph;
    const resize = () =>
      graph.width(element.clientWidth).height(element.clientHeight);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const refreshTheme = () => {
      const styles = getComputedStyle(element);
      palette.current = {
        foreground: styles.getPropertyValue("--foreground").trim() || "#232722",
        link: styles.getPropertyValue("--muted").trim() || "#60665c",
      };
      graph.nodeCanvasObject((node, ctx, scale) => draw(node, ctx, scale));
      graph.linkColor(() => palette.current.link);
    };
    refreshTheme();
    const theme = new MutationObserver(refreshTheme);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => {
      observer.disconnect();
      theme.disconnect();
      instance.current = null;
      graph._destructor();
      element.replaceChildren();
    };
  }, []);
  useEffect(() => {
    const graph = instance.current;
    if (!graph) return;
    const previous = graph.graphData();
    const next = reconcileNodes(previous.nodes, nodes);
    const changed =
      previous.nodes.length !== next.length ||
      next.some((node, index) => node !== previous.nodes[index]) ||
      previous.links.length !== edges.length ||
      previous.links.some((link, index) => link.id !== edges[index]?.id);
    graph.warmupTicks(reduced ? 100 : 0).cooldownTicks(reduced ? 0 : Infinity);
    if (changed) {
      graph.graphData({
        nodes: next,
        links: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      });
    }
    graph.nodeCanvasObject((node, ctx, scale) => draw(node, ctx, scale));
  }, [nodes, edges, selectedId, reduced]);
  return (
    <div className="force-graph-shell">
      <div
        ref={host}
        className="force-graph-host"
        role="img"
        aria-label="Grafo musical. Usá la lista de nodos debajo del lienzo para explorar con teclado."
      />
      <div className="force-graph-controls" aria-label="Controles del grafo">
        <button
          className="graph-action"
          aria-label="Acercar"
          onClick={() => {
            const graph = instance.current;
            if (graph) graph.zoom(graph.zoom() * 1.3, reduced ? 0 : 180);
          }}
        >
          +
        </button>
        <button
          className="graph-action"
          aria-label="Alejar"
          onClick={() => {
            const graph = instance.current;
            if (graph) graph.zoom(graph.zoom() / 1.3, reduced ? 0 : 180);
          }}
        >
          −
        </button>
        <button
          className="graph-action"
          onClick={() => instance.current?.zoomToFit(reduced ? 0 : 250, 60)}
        >
          Centrar
        </button>
        <button
          className="graph-action"
          onClick={() => {
            const graph = instance.current;
            if (!graph) return;
            for (const node of graph.graphData().nodes) {
              delete node.fx;
              delete node.fy;
            }
            graph.graphData(graph.graphData()).d3ReheatSimulation();
          }}
        >
          Reacomodar
        </button>
      </div>
    </div>
  );
}
