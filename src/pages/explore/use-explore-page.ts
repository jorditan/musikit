import { useMusicSearch } from "@/components/music-search/use-music-search";
export function useExplorePage() {
  const search = useMusicSearch();
  return { search, hasSearched: search.submitted !== null };
}
