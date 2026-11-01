import { useEffect, useState } from "react";
import type { SearchResult } from "../../../shared/search";

function currentGraph(): SearchResult | null {
  if (!window.location.pathname.startsWith("/graph/")) return null;
  const result = window.history.state?.musikitResult as
    SearchResult | undefined;
  return result &&
    typeof result.id === "string" &&
    typeof result.name === "string" &&
    (result.entity === "work" ||
      result.entity === "artist" ||
      result.entity === "release-group" ||
      result.entity === "recording") &&
    Array.isArray(result.languages)
    ? result
    : null;
}
export function useGraphNavigation() {
  const [result, setResult] = useState(currentGraph);
  useEffect(() => {
    const onPop = () => setResult(currentGraph());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function openGraph(next: SearchResult) {
    window.history.pushState(
      { musikitResult: next },
      "",
      `/graph/${next.entity}/${encodeURIComponent(next.id)}`,
    );
    setResult(next);
    window.scrollTo({ top: 0 });
  }
  function backToSearch() {
    window.history.pushState(null, "", "/");
    setResult(null);
  }
  return { result, openGraph, backToSearch };
}
