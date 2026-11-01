import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { MusicNode } from "./graph-types";
import { GraphPage } from "./graph-page";

const expand = vi.hoisted(() => vi.fn());
vi.mock("./use-graph-expansion", () => ({
  useGraphExpansion: (root: MusicNode["data"]["result"]) => ({
    nodes: [
      {
        id: `artist:${root.id}`,
        data: { result: root },
        position: { x: 0, y: 0 },
      },
    ],
    edges: [],
    pages: {},
    errors: {},
    busy: null,
    expand,
    onNodesChange: vi.fn(),
  }),
}));
vi.mock("./force-graph-canvas", () => ({
  ForceGraphCanvas: ({
    nodes,
    onSelect,
  }: {
    nodes: MusicNode[];
    onSelect: (result: MusicNode["data"]["result"]) => void;
  }) => (
    <div>
      {nodes.map((node) => (
        <button key={node.id} onClick={() => onSelect(node.data.result)}>
          Seleccionar {node.data.result.name}
        </button>
      ))}
    </div>
  ),
  Controls: () => null,
}));
vi.mock("@/components/layout/site-layout", () => ({
  SiteLayout: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("@/components/music-search/entity-artwork", () => ({
  EntityArtwork: () => null,
}));
vi.mock("@/components/music-search/result-metadata-view", () => ({
  ResultMetadata: () => null,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it.each([
  ["Person", "Gustavo Cerati", "bandas"],
  ["Group", "Soda Stereo", "integrantes"],
])(
  "selects %s without expanding and exposes explicit actions",
  (kind, name, category) => {
    const result = {
      id: "artist",
      entity: "artist" as const,
      name,
      kind,
      country: null,
      disambiguation: null,
      languages: [],
    };
    render(<GraphPage result={result} onBack={() => {}} />);
    fireEvent.click(
      screen.getByRole("button", { name: `Seleccionar ${name}` }),
    );
    expect(expand).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Explorar discos" }));
    expect(expand).toHaveBeenCalledWith(result);
    fireEvent.click(
      screen.getByRole("button", { name: `Explorar ${category}` }),
    );
    expect(expand).toHaveBeenCalledWith(result, "members");
  },
);
