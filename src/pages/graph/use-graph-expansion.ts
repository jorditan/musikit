import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicEdge as Edge, NodePositionChange } from "./graph-types";
import type { SearchResult } from "../../../shared/search";
import { entityKey, type RelationsResponse } from "../../../shared/explore";
import {
  initialNode,
  mergeNodes,
  mergeEdges,
  syncNodePositions,
} from "./graph-data";

export function useGraphExpansion(root: SearchResult) {
  const [nodes, setNodes] = useState([initialNode(root)]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const onNodesChange = useCallback(
    (changes: NodePositionChange[]) => {
      setNodes((current) => syncNodePositions(current, changes));
    },
    [setNodes],
  );
  const [pages, setPages] = useState<
    Record<string, { nextOffset: number | null; total: number }>
  >({});
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function expand(result: SearchResult, category?: "members") {
    const key = entityKey(result) + (category ? `:${category}` : "");
    if (controller.current || pages[key]?.nextOffset === null) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(key);
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      const params = new URLSearchParams({
        entity: result.entity,
        id: result.id,
        offset: String(pages[key]?.nextOffset ?? 0),
      });
      if (category) params.set("category", category);
      const response = await fetch(`/api/relations?${params}`, {
        signal: request.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "No pudimos cargar las conexiones.");
      if (request.signal.aborted) return;
      const data = body as RelationsResponse;
      setNodes((current) =>
        mergeNodes(
          current.map((node) =>
            data.subject && node.id === entityKey(data.subject)
              ? { ...node, data: { ...node.data, result: data.subject } }
              : node,
          ),
          entityKey(result),
          data,
        ),
      );
      setEdges((current) => mergeEdges(current, data));
      setPages((current) => ({
        ...current,
        [key]: { nextOffset: data.nextOffset, total: data.total },
      }));
    } catch (error) {
      if (!request.signal.aborted)
        setErrors((current) => ({
          ...current,
          [key]:
            error instanceof Error
              ? error.message
              : "No pudimos cargar las conexiones.",
        }));
    } finally {
      if (!request.signal.aborted) setBusy(null);
      controller.current = null;
    }
  }
  return { nodes, edges, onNodesChange, pages, busy, errors, expand };
}
