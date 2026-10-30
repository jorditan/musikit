import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SearchRequest, SearchResult } from "../../../shared/search";
import { fetchResults } from "./search-api";

export function useMusicSearch() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState<SearchRequest | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [validation, setValidation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["music-search", submitted],
    queryFn: ({ signal }) => fetchResults(submitted!, signal),
    enabled: submitted !== null && selected === null,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!name.trim() || selected) return;
    const timer = setTimeout(
      () => setSubmitted({ name: name.trim(), type: "all" }),
      650,
    );
    return () => clearTimeout(timer);
  }, [name, selected]);

  function invalidatePreview() {
    void client.cancelQueries({ queryKey: ["music-search"] });
    setSubmitted(null);
    setSelected(null);
    setValidation("");
  }
  function changeName(value: string) {
    invalidatePreview();
    setName(value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidation("Ingresá un nombre para buscar.");
      return;
    }
    setValidation("");
    setSelected(null);
    if (submitted?.name === trimmed) void query.refetch();
    else setSubmitted({ name: trimmed, type: "all" });
  }
  function selectResult(result: SearchResult) {
    setSelected(result);
  }
  return {
    name,
    submitted,
    selected,
    validation,
    query,
    submit,
    changeName,
    selectResult,
    inputRef,
  };
}
export type MusicSearchController = ReturnType<typeof useMusicSearch>;
