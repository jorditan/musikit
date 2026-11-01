import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ForceGraphCanvas } from "./force-graph-canvas";
import { initialNode } from "./graph-data";
import type { CanvasNode } from "./force-graph-model";

const mocks = vi.hoisted(() => ({
  instances: [] as Record<string, unknown>[],
  reduced: false,
  disconnect: vi.fn(),
}));
vi.mock("motion/react", () => ({ useReducedMotion: () => mocks.reduced }));
vi.mock("force-graph", () => ({
  default: class {
    constructor() {
      const state: Record<string, unknown> = {
        data: { nodes: [], links: [] },
        handlers: {},
        _destructor: vi.fn(),
        d3ReheatSimulation: vi.fn(),
        zoomToFit: vi.fn(),
      };
      const graph = new Proxy(state, {
        get(target, name: string) {
          if (name === "graphData")
            return (data?: unknown) => {
              if (data === undefined) return target.data;
              target.data = data;
              return graph;
            };
          if (name === "d3Force")
            return () => ({
              distance: () => ({ strength: vi.fn() }),
              strength: vi.fn(),
            });
          if (name === "_destructor") return target[name];
          return (...args: unknown[]) => {
            if (name === "zoom" && !args.length) return 1;
            (target.handlers as Record<string, unknown>)[name] = args[0];
            if (typeof target[name] === "function")
              (target[name] as (...args: unknown[]) => void)(...args);
            return graph;
          };
        },
      });
      mocks.instances.push(state);
      return graph;
    }
  },
}));
beforeEach(() => {
  mocks.instances.length = 0;
  mocks.reduced = false;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = mocks.disconnect;
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const result = {
  id: "cerati",
  entity: "artist" as const,
  name: "Gustavo Cerati",
  kind: "Person",
  country: null,
  disambiguation: null,
  languages: [],
};
const origin = initialNode(result);
const child = initialNode({ ...result, id: "album", entity: "release-group" });
const edge = { id: "link", source: origin.id, target: child.id };
const props = {
  nodes: [origin, child],
  edges: [edge],
  selectedId: origin.id,
  onSelect: vi.fn(),
  onBackgroundClick: vi.fn(),
  onPositionsChange: vi.fn(),
};

it("preserves simulation identity and positions across selections and expansions, and cleans up", () => {
  const view = render(<ForceGraphCanvas {...props} />);
  const state = mocks.instances[0];
  const node = (state.data as { nodes: CanvasNode[] }).nodes[0];
  node.x = 55;
  node.y = 72;
  node.fx = 55;
  view.rerender(
    <ForceGraphCanvas
      {...props}
      selectedId={child.id}
      nodes={[...props.nodes, initialNode({ ...result, id: "third" })]}
    />,
  );
  expect(mocks.instances).toHaveLength(1);
  expect((state.data as { nodes: CanvasNode[] }).nodes[0]).toBe(node);
  expect(node.x).toBe(55);
  expect(origin.position).toEqual({ x: 0, y: 0 });
  view.unmount();
  expect(state._destructor).toHaveBeenCalledOnce();
  expect(mocks.disconnect).toHaveBeenCalled();
});

it("leaves drag and neighbor motion to the native simulation without pinning on release", () => {
  render(<ForceGraphCanvas {...props} />);
  const state = mocks.instances[0];
  const handlers = state.handlers as Record<
    string,
    (...args: unknown[]) => void
  >;
  const [node, neighbor] = (state.data as { nodes: CanvasNode[] }).nodes;
  act(() => handlers.onNodeClick(node));
  expect(props.onSelect).toHaveBeenCalledWith(result);
  expect(handlers.onNodeDrag).toBeUndefined();
  expect(handlers.d3VelocityDecay).toBeUndefined();
  expect(handlers.cooldownTicks).toBe(Infinity);
  node.x = 25;
  node.y = 10;
  act(() => handlers.onNodeDragEnd(node, { x: 25, y: 10 }));
  expect(node.fx).toBeUndefined();
  expect(neighbor.fx).toBeUndefined();
  expect(neighbor.x).toBe(0);
  expect(props.onPositionsChange).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reacomodar" }));
  expect(neighbor.fx).toBeUndefined();
  expect(state.d3ReheatSimulation).toHaveBeenCalledOnce();
});

it("settles the graph offscreen for reduced motion and keeps zoom controls immediate", () => {
  mocks.reduced = true;
  render(<ForceGraphCanvas {...props} />);
  const handlers = mocks.instances[0].handlers as Record<string, unknown>;
  expect(handlers.warmupTicks).toBe(100);
  expect(handlers.cooldownTicks).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Centrar" }));
  expect(mocks.instances[0].zoomToFit).toHaveBeenCalledWith(0, 60);
});
