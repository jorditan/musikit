import { motion, useReducedMotion } from "motion/react";
import { Music2, Grip } from "lucide-react";
import type { Node, NodeProps } from "@xyflow/react";
import type { SearchResult } from "../../../shared/search";
import { resultLabel } from "@/components/music-search/result-metadata";
import { ResultMetadata } from "@/components/music-search/result-metadata-view";

export type MusicNode = Node<{ result: SearchResult }, "music">;
export function MusicGraphNode({ data, selected }: NodeProps<MusicNode>) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      className={`music-node${selected ? " is-selected" : ""}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="music-node-top">
        <Music2 size={20} aria-hidden="true" />
        <span>{resultLabel(data.result)}</span>
        <Grip size={18} aria-hidden="true" />
      </div>
      <h2>{data.result.name}</h2>
      <ResultMetadata result={data.result} />
      <span className="music-node-caption">PUNTO DE PARTIDA / 01</span>
    </motion.article>
  );
}
