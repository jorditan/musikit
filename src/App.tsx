import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ExplorePage } from "@/pages/explore/explore-page";
import { GraphPage } from "@/pages/graph/graph-page";
import { useGraphNavigation } from "@/pages/graph/use-graph-navigation";
import { useMusicSearch } from "@/components/music-search/use-music-search";

export default function App() {
  const search = useMusicSearch();
  const { result, openGraph, backToSearch } = useGraphNavigation();
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={result ? `graph:${result.entity}:${result.id}` : "search"}
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduced ? 0 : -12 }}
        transition={{ duration: reduced ? 0 : 0.22 }}
      >
        {result ? (
          <GraphPage result={result} onBack={backToSearch} />
        ) : (
          <ExplorePage search={{ ...search, selectResult: openGraph }} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
