import { afterEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EntityArtwork } from "./entity-artwork";
import type { SearchResult } from "../../../shared/search";

const result: SearchResult = {
  entity: "artist",
  id: "artist-id",
  name: "Yes",
  country: "GB",
  kind: "Group",
  disambiguation: null,
  languages: [],
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("loads artwork only after it becomes visible and falls back on broken images", async () => {
  let reveal!: () => void;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        reveal = () => callback([{ isIntersecting: true }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({
        artwork: {
          url: "https://example.com/yes.jpg",
          caption: "Foto de Yes · TheAudioDB",
          source: "TheAudioDB",
          sourceUrl: "https://www.theaudiodb.com",
        },
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <EntityArtwork result={result} caption />
    </QueryClientProvider>,
  );
  expect(fetcher).not.toHaveBeenCalled();
  const { act } = await import("@testing-library/react");
  act(() => reveal());
  const image = await screen.findByRole("img", {
    name: "Foto de Yes · TheAudioDB",
  });
  expect(fetcher.mock.calls[0][0]).toContain("entity=artist&id=artist-id");
  fireEvent.error(image);
  await waitFor(() => expect(screen.queryByRole("img")).toBeNull());
  expect(screen.getByRole("link", { name: /TheAudioDB/ })).toBeTruthy();
});
