import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMusicSearch } from "./use-music-search";
import { fetchResults } from "./search-api";
import type { SearchResponse, SearchResult } from "../../../shared/search";

vi.mock("./search-api", () => ({ fetchResults: vi.fn() }));
const result: SearchResult = {
  id: "yes-mbid",
  entity: "artist",
  name: "Yes",
  kind: "Group",
  country: "GB",
  disambiguation: "English progressive rock band",
  languages: [],
};
const response: SearchResponse = {
  query: { name: "Yes", type: "all" },
  results: [result],
  total: 1,
  limit: 10,
  partial: false,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderHook(() => useMusicSearch(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("search preview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchResults).mockReset();
    vi.mocked(fetchResults).mockResolvedValue(response);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("debounces typing and searches all categories", async () => {
    const hook = setup();
    act(() => {
      hook.result.current.changeName("Ye");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    act(() => hook.result.current.changeName("Yes"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(649);
    });
    expect(fetchResults).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchResults).toHaveBeenCalledTimes(1);
    expect(fetchResults).toHaveBeenCalledWith(
      { name: "Yes", type: "all" },
      expect.any(AbortSignal),
    );
  });

  it("preserves selection and clears it when changing the search", () => {
    const hook = setup();
    act(() => hook.result.current.selectResult(result));
    expect(hook.result.current.selected?.id).toBe("yes-mbid");
    act(() => hook.result.current.changeName("Genesis"));
    expect(hook.result.current.selected).toBeNull();
    expect(hook.result.current.submitted).toBeNull();
  });

  it("cancels pending debounce when clearing and restores the initial screen", async () => {
    const hook = setup();
    act(() => {
      hook.result.current.changeName("Yes");
    });
    act(() => hook.result.current.changeName(""));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchResults).not.toHaveBeenCalled();
    expect(hook.result.current.name).toBe("");
    expect(hook.result.current.submitted).toBeNull();
  });

  it("aborts an active query and ignores its late response after clearing", async () => {
    let resolve!: (data: SearchResponse) => void;
    vi.mocked(fetchResults).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const hook = setup();
    act(() => hook.result.current.changeName("Yes"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });
    const signal = vi.mocked(fetchResults).mock.calls[0][1];
    act(() => hook.result.current.changeName(""));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(response);
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(hook.result.current.submitted).toBeNull();
    expect(hook.result.current.query.data).toBeUndefined();
    expect(hook.result.current.selected).toBeNull();
  });
});
