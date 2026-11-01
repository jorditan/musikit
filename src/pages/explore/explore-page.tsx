import { SiteLayout } from "@/components/layout/site-layout";
import { MusicSearch } from "@/components/music-search/music-search";
import { ExploreHero } from "./explore-hero";
import type { MusicSearchController } from "@/components/music-search/use-music-search";
export function ExplorePage({ search }: { search: MusicSearchController }) {
  const hasSearched = search.submitted !== null;
  return (
    <SiteLayout compact>
      <div
        className={hasSearched ? "explore-entry has-results" : "explore-entry"}
      >
        <ExploreHero compact={hasSearched} />
        <MusicSearch search={search} />
      </div>
    </SiteLayout>
  );
}
