import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, cleanup } from "@testing-library/react";
import { useGraphNavigation } from "./use-graph-navigation";
import type { SearchResult } from "../../../shared/search";
const song: SearchResult = {
  id: "work-1",
  entity: "work",
  name: "Yesterday",
  kind: "Song",
  country: null,
  disambiguation: "original by The Beatles",
  languages: ["eng"],
};
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.history.replaceState(null, "", "/");
});
describe("graph navigation", () => {
  it("opens a separate URL with the selected song and returns to search", () => {
    const hook = renderHook(() => useGraphNavigation());
    act(() => hook.result.current.openGraph(song));
    expect(window.location.pathname).toBe("/graph/work/work-1");
    expect(hook.result.current.result).toEqual(song);
    act(() => hook.result.current.backToSearch());
    expect(window.location.pathname).toBe("/");
    expect(hook.result.current.result).toBeNull();
  });
  it("restores song metadata after remount and handles history navigation", () => {
    window.history.replaceState(
      { musikitResult: song },
      "",
      "/graph/work/work-1",
    );
    const hook = renderHook(() => useGraphNavigation());
    expect(hook.result.current.result?.languages).toEqual(["eng"]);
    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(hook.result.current.result).toBeNull();
  });
  it("does not render a graph with missing state", () => {
    window.history.replaceState(null, "", "/graph/work/work-1");
    const hook = renderHook(() => useGraphNavigation());
    expect(hook.result.current.result).toBeNull();
  });
});
