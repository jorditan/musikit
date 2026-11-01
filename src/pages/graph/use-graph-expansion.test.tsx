import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useGraphExpansion } from "./use-graph-expansion";
import {
  initialNode,
  mergeNodes,
  mergeEdges,
  visibleEdges,
  syncNodePositions,
} from "./graph-data";
import type { SearchResult } from "../../../shared/search";
import type { RelationsResponse } from "../../../shared/explore";
const root: SearchResult = {
  entity: "work",
  id: "work",
  name: "Yesterday",
  kind: "Song",
  country: null,
  disambiguation: null,
  languages: [],
};
const writer: SearchResult = {
  ...root,
  id: "writer",
  name: "John Lennon",
  entity: "artist",
};
const batch: RelationsResponse = {
  nodes: [writer],
  edges: [
    {
      id: "edge",
      source: "artist:writer",
      target: "work:work",
      label: "es autor de",
      type: "writer",
    },
  ],
  total: 1,
  nextOffset: null,
};

it("reduces indirect connections of every type regardless of expansion order", () => {
  const connection = (source: string, target: string, type: string) => ({
    id: `${source}|${type}|${target}`,
    source,
    target,
    type,
    label: type,
  });
  const hierarchy = [
    connection("cerati", "fuerza", "album"),
    connection("fuerza", "song", "track"),
  ];
  const credits = [
    connection("cerati", "song", "artist credit"),
    connection("guest", "song", "artist credit"),
    connection("cerati", "song", "composer"),
  ];
  const page = (edges: typeof credits) => ({
    nodes: [],
    edges,
    total: edges.length,
    nextOffset: null,
  });
  for (const batches of [
    [hierarchy, credits],
    [credits, hierarchy],
  ]) {
    const all = batches.reduce(
      (edges, entries) => mergeEdges(edges, page(entries)),
      mergeEdges([], page([])),
    );
    expect(all).toHaveLength(5);
    const visible = visibleEdges(all);
    expect(visible.map((edge) => edge.id)).not.toContain(credits[0].id);
    expect(visible.map((edge) => edge.id)).toContain(credits[1].id);
    expect(visible.map((edge) => edge.id)).not.toContain(credits[2].id);
    expect(visible).toHaveLength(3);
  }
  const membership = connection("cerati", "band", "member of band");
  const all = mergeEdges(
    [],
    page([
      membership,
      connection("band", "fuerza", "album"),
      hierarchy[1],
      credits[0],
    ]),
  );
  expect(visibleEdges(all)).toHaveLength(3);
  expect(visibleEdges(mergeEdges([], page(credits)))).toHaveLength(3);
});

it("preserves direct neighbors, path direction and reachability in cycles", () => {
  const edge = (source: string, target: string) => ({
    id: `${source}-${target}`,
    source,
    target,
  });
  const direct = [edge("a", "b"), edge("a", "c")];
  expect(visibleEdges(direct)).toEqual(direct);
  const reversed = [...direct, edge("c", "b")];
  expect(visibleEdges(reversed).map((e) => e.id)).toEqual(["a-c", "c-b"]);
  const cycle = [
    edge("a", "b"),
    edge("b", "a"),
    edge("a", "c"),
    edge("b", "c"),
    edge("c", "a"),
  ];
  const reduced = visibleEdges(cycle);
  const reachable = (source: string, target: string) => {
    const pending = [source],
      visited = new Set<string>();
    while (pending.length) {
      const current = pending.pop()!;
      if (current === target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      pending.push(
        ...reduced.filter((e) => e.source === current).map((e) => e.target),
      );
    }
    return false;
  };
  for (const e of cycle) expect(reachable(e.source, e.target)).toBe(true);
  expect(
    visibleEdges([...cycle].reverse())
      .map((e) => e.id)
      .sort(),
  ).toEqual(reduced.map((e) => e.id).sort());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("stores simulated positions without imposing a second movement on neighbors", () => {
  const nodes = [initialNode(root), initialNode(writer)];
  const moved = syncNodePositions(nodes, [
    { id: nodes[0].id, type: "position", position: { x: 30, y: -20 } },
  ]);
  expect(moved[0].position).toEqual({ x: 30, y: -20 });
  expect(moved[1]).toBe(nodes[1]);
});
it("places a new connection close to its origin", () => {
  const parent = initialNode(root);
  const nodes = mergeNodes([parent], parent.id, batch);
  expect(Math.hypot(nodes[1].position.x, nodes[1].position.y)).toBe(120);
});

it("stores engine snapshots without translating connected nodes again", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(batch)));
  const hook = renderHook(() => useGraphExpansion(root));
  await act(async () => {
    await hook.result.current.expand(root);
  });
  const before = hook.result.current.nodes[1].position;
  act(() =>
    hook.result.current.onNodesChange([
      {
        id: "work:work",
        type: "position",
        position: { x: 50, y: 60 },
        dragging: true,
      },
    ]),
  );
  expect(hook.result.current.nodes[1].position).toEqual({
    x: before.x,
    y: before.y,
  });
});
it("merges repeated expansions without replacing dragged positions", () => {
  const moved = { ...initialNode(root), position: { x: 123, y: 456 } };
  const nodes = mergeNodes([moved], moved.id, batch);
  const twice = mergeNodes(nodes, moved.id, batch);
  expect(twice).toHaveLength(2);
  expect(twice[0].position).toEqual({ x: 123, y: 456 });
  expect(mergeEdges(mergeEdges([], batch), batch)).toHaveLength(1);
});

it("places branches around the parent without overlapping prior nodes", () => {
  const parent = initialNode(root);
  const response = {
    ...batch,
    nodes: Array.from({ length: 12 }, (_, i) => ({
      ...writer,
      id: `artist-${i}`,
    })),
  };
  const first = mergeNodes([parent], parent.id, response);
  const second = mergeNodes(first, first[1].id, {
    ...response,
    nodes: response.nodes.map((node) => ({ ...node, id: `${node.id}-next` })),
  });
  expect(second.slice(0, first.length)).toEqual(first);
  expect(first.some((node) => node.position.x < 0)).toBe(true);
  expect(first.some((node) => node.position.x > 0)).toBe(true);
  for (let i = 0; i < second.length; i++) {
    for (let j = i + 1; j < second.length; j++) {
      const a = second[i].position,
        b = second[j].position;
      expect(Math.abs(a.x - b.x) >= 150 || Math.abs(a.y - b.y) >= 90).toBe(
        true,
      );
    }
  }
});

it("keeps relationship meaning accessible without cluttering the canvas", () => {
  const [edge] = mergeEdges([], batch);
  expect(edge.type).toBe("straight");
  expect(edge.label).toBeUndefined();
  expect(edge.data?.relationLabel).toBe("es autor de");
  expect(edge.ariaLabel).toBe("es autor de");
});
it("expands only on request, keeps graph on failure, and retries the failed node", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(batch))
    .mockResolvedValueOnce(
      Response.json(
        { error: "Fuente temporalmente indisponible" },
        { status: 503 },
      ),
    )
    .mockResolvedValueOnce(Response.json({ ...batch, nodes: [root] }));
  vi.stubGlobal("fetch", fetcher);
  const hook = renderHook(() => useGraphExpansion(root));
  expect(fetcher).not.toHaveBeenCalled();
  await act(async () => {
    await hook.result.current.expand(root);
  });
  expect(hook.result.current.nodes).toHaveLength(2);
  await act(async () => {
    await hook.result.current.expand(writer);
  });
  expect(hook.result.current.nodes).toHaveLength(2);
  expect(hook.result.current.errors["artist:writer"]).toMatch(/indisponible/);
  await act(async () => {
    await hook.result.current.expand(writer);
  });
  expect(hook.result.current.errors["artist:writer"]).toBe("");
  expect(hook.result.current.edges).toHaveLength(1);
});
it("aborts expansion when leaving the graph", async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        ),
      );
    }),
  );
  const hook = renderHook(() => useGraphExpansion(root));
  act(() => {
    void hook.result.current.expand(root);
  });
  hook.unmount();
  expect(signal?.aborted).toBe(true);
});

it("keeps album and member pagination independent and refreshes artist type", async () => {
  const band = { ...writer, kind: null };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        ...batch,
        nodes: [],
        edges: [],
        subject: { ...band, kind: "Group" },
      }),
    )
    .mockResolvedValueOnce(Response.json(batch));
  vi.stubGlobal("fetch", fetcher);
  const hook = renderHook(() => useGraphExpansion(band));
  await act(async () => {
    await hook.result.current.expand(band);
  });
  expect(hook.result.current.nodes[0].data.result.kind).toBe("Group");
  await act(async () => {
    await hook.result.current.expand(band, "members");
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][0]).toContain("category=members");
  expect(hook.result.current.pages["artist:writer"].nextOffset).toBe(null);
  expect(hook.result.current.pages["artist:writer:members"].nextOffset).toBe(
    null,
  );
});
