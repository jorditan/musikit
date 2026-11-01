import type {
  MusicEdge as Edge,
  MusicNode,
  NodePositionChange,
} from "./graph-types";
import { entityKey, type RelationsResponse } from "../../../shared/explore";
import type { SearchResult } from "../../../shared/search";

export function initialNode(result: SearchResult): MusicNode {
  return {
    id: entityKey(result),
    position: { x: 0, y: 0 },
    data: { result, root: true },
  };
}
export function mergeNodes(
  current: MusicNode[],
  parentId: string,
  response: RelationsResponse,
): MusicNode[] {
  const existing = new Set(current.map((node) => node.id));
  const origin = current.find((node) => node.id === parentId)?.position ?? {
    x: 0,
    y: 0,
  };
  const fresh = response.nodes.filter((node) => !existing.has(entityKey(node)));
  const occupied = current.map((node) => node.position);
  return [
    ...current,
    ...fresh.map((result, index) => {
      const angle =
        -Math.PI / 2 + (index * Math.PI * 2) / Math.max(fresh.length, 1);
      let radius = 120;
      let position = {
        x: origin.x + Math.cos(angle) * radius,
        y: origin.y + Math.sin(angle) * radius,
      };
      // Place new branches around their parent without moving nodes the user dragged.
      while (
        occupied.some(
          (point) =>
            Math.abs(point.x - position.x) < 150 &&
            Math.abs(point.y - position.y) < 90,
        )
      ) {
        radius += 40;
        position = {
          x: origin.x + Math.cos(angle) * radius,
          y: origin.y + Math.sin(angle) * radius,
        };
      }
      occupied.push(position);
      return {
        ...initialNode(result),
        position,
        data: { result, root: false },
      };
    }),
  ];
}

export function syncNodePositions(
  current: MusicNode[],
  changes: NodePositionChange[],
): MusicNode[] {
  const positions = new Map(
    changes
      .filter((change) => change.position)
      .map((change) => [change.id, change.position!]),
  );
  return current.map((node) => {
    const position = positions.get(node.id);
    return position ? { ...node, position } : node;
  });
}
export function mergeEdges(
  current: Edge[],
  response: RelationsResponse,
): Edge[] {
  const existing = new Set(current.map((edge) => edge.id));
  return [
    ...current,
    ...response.edges
      .filter((edge) => !existing.has(edge.id))
      .map((edge) => ({
        ...edge,
        type: "straight",
        data: { relationLabel: edge.label, relationType: edge.type },
        label: undefined,
        ariaLabel: edge.label,
        style: { stroke: "var(--muted)", strokeWidth: 1, opacity: 0.35 },
      })),
  ];
}

// Reduce visible connections by reachability, independently of entity/credit type.
// Original edges and every node remain in state. Process endpoint pairs together
// so parallel credits cannot hide each other. Sequential removal preserves paths
// even when the musical graph contains cycles (and is not a strict partial order).
export function visibleEdges(edges: Edge[]): Edge[] {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    const targets = adjacency.get(edge.source) ?? new Set<string>();
    targets.add(edge.target);
    adjacency.set(edge.source, targets);
  }
  function reachable(source: string, target: string) {
    const pending = [source];
    const visited = new Set<string>();
    while (pending.length) {
      const current = pending.pop()!;
      if (current === target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) pending.push(next);
      }
    }
    return false;
  }
  // Stable order makes the result independent of the order of expansion.
  for (const source of [...adjacency.keys()].sort()) {
    const targets = adjacency.get(source)!;
    for (const target of [...targets].sort()) {
      targets.delete(target);
      if (!reachable(source, target)) targets.add(target);
    }
  }
  return edges.filter((edge) => adjacency.get(edge.source)?.has(edge.target));
}
