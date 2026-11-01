import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MusicSearch } from "./music-search";
import { useMusicSearch } from "./use-music-search";
import { fetchResults } from "./search-api";
import type { SearchResult } from "../../../shared/search";

vi.mock("./search-api", () => ({ fetchResults: vi.fn() }));
const artist: SearchResult = {
  id: "yes",
  name: "Yes",
  entity: "artist",
  kind: "Group",
  country: "GB",
  languages: [],
  disambiguation: "English progressive rock band",
};
const song: SearchResult = {
  ...artist,
  id: "work",
  entity: "work",
  kind: "Song",
  country: null,
  disambiguation: "Composition",
};
function Harness() {
  return <MusicSearch search={useMusicSearch()} />;
}
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Yes" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("separates entities and navigates to the last category page", async () => {
  vi.mocked(fetchResults).mockImplementation(async (query) =>
    query.type === "all"
      ? {
          query,
          results: [artist, song],
          total: 22,
          limit: 10,
          partial: true,
          groups: [
            { type: "artists", total: 21, results: [artist] },
            { type: "song", total: 1, results: [song] },
          ],
        }
      : {
          query,
          results: [artist],
          total: 21,
          limit: 20,
          partial: !query.offset,
        },
  );
  setup();
  const artists = await screen.findByRole("region", {
    name: "Artistas y bandas",
  });
  expect(within(artists).getByText("Banda")).toBeTruthy();
  expect(
    within(
      screen.getByRole("region", { name: "Canciones · composiciones" }),
    ).getByText("Composición"),
  ).toBeTruthy();
  fireEvent.click(within(artists).getByRole("button", { name: "Ver todos" }));
  await screen.findByText("Página 1");
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  await screen.findByText("Página 2");
  expect(fetchResults).toHaveBeenLastCalledWith(
    { name: "Yes", type: "artists", offset: 20 },
    expect.any(AbortSignal),
  );
  expect(
    (screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  await screen.findByText("Página 1");
});

it("does not describe a failed source as an empty search", async () => {
  vi.mocked(fetchResults).mockImplementation(async (query) => ({
    query,
    results: [],
    total: 0,
    limit: 10,
    partial: true,
    groups: [
      {
        type: "artists",
        total: null,
        results: [],
        error: "Fuente temporalmente indisponible",
      },
      { type: "song", total: 0, results: [] },
    ],
  }));
  setup();
  await screen.findByText(/Resultados incompletos/);
  expect(screen.queryByText(/No encontramos coincidencias/)).toBeNull();
  expect(
    screen.getByRole("button", { name: "Reintentar categoría" }),
  ).toBeTruthy();
});

