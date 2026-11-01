import type { NodeObject, LinkObject } from "force-graph";
import type { MusicNode } from "./graph-types";

export type CanvasNode = NodeObject & {
  id: string;
  result: MusicNode["data"]["result"];
  root?: boolean;
};
export type CanvasLink = LinkObject<CanvasNode> & { id: string };
export const endpointId = (endpoint: CanvasLink["source"]) =>
  typeof endpoint === "object" ? endpoint.id : String(endpoint);

// force-graph mutates its simulation objects; never give it React's domain data.
export function reconcileNodes(
  previous: CanvasNode[],
  nodes: MusicNode[],
): CanvasNode[] {
  const existing = new Map(previous.map((node) => [node.id, node]));
  return nodes.map((node) => {
    const active = existing.get(node.id);
    if (active) {
      active.result = node.data.result;
      return active;
    }
    return {
      id: node.id,
      result: node.data.result,
      root: node.data.root,
      x: node.position.x,
      y: node.position.y,
    };
  });
}
