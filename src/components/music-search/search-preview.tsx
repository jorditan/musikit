import { motion, useReducedMotion } from "motion/react";
import { Check, ArrowUpRight } from "lucide-react";
import type { SearchResult } from "../../../shared/search";
import { resultLabel } from "./result-metadata";
import { ResultMetadata } from "./result-metadata-view";

type Props = {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
};
export function SearchPreview({ results, onSelect }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.ul
      className="search-results search-preview"
      aria-label="Coincidencias de búsqueda"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      {results.map((result) => (
        <li key={`${result.entity}:${result.id}`}>
          <button
            type="button"
            className="result-option"
            onClick={() => onSelect(result)}
          >
            <span className="result-heading">
              <span className="result-name">{result.name}</span>
              <span className="result-kind">{resultLabel(result)}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
            <span className="result-metadata">
              <ResultMetadata result={result} />
            </span>
          </button>
        </li>
      ))}
    </motion.ul>
  );
}
export function SelectedResult({ result }: { result: SearchResult }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="selected-result"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      <p className="eyebrow">
        <Check size={16} aria-hidden="true" /> PUNTO DE PARTIDA SELECCIONADO
      </p>
      <div className="result-heading">
        <h3>{result.name}</h3>
        <span>{resultLabel(result)}</span>
      </div>
      <p className="muted">
        <ResultMetadata result={result} />
      </p>
      <p className="muted">
        La exploración de conexiones estará disponible en la próxima entrega.
      </p>
    </motion.div>
  );
}
