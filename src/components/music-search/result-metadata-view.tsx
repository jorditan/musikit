import { Languages, MapPin } from "lucide-react";
import type { SearchResult } from "../../../shared/search";

const countries = new Intl.DisplayNames(["es"], { type: "region" });
const languages = new Intl.DisplayNames(["es"], { type: "language" });

function displayName(names: Intl.DisplayNames, code: string) {
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

const flags = import.meta.glob<string>(
  "/node_modules/flag-icons/flags/4x3/*.svg",
  { eager: true, query: "?url&no-inline", import: "default" },
);
function countryFlag(code: string) {
  return (
    flags[`/node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`] ??
    null
  );
}

export function ResultMetadata({ result }: { result: SearchResult }) {
  const flag = result.country ? countryFlag(result.country) : null;
  return (
    <span className="metadata-items">
      {result.country && (
        <span className="metadata-item">
          {flag ? (
            <img
              className="country-flag"
              src={flag}
              alt=""
              width={20}
              height={15}
            />
          ) : (
            <MapPin size={15} aria-hidden="true" />
          )}
          <span>
            <span className="sr-only">País asociado: </span>
            {displayName(countries, result.country)}
          </span>
        </span>
      )}
      {result.languages.length > 0 && (
        <span className="metadata-item">
          <Languages size={15} aria-hidden="true" />
          <span>
            <span className="sr-only">Idioma: </span>
            {result.languages
              .map((code) => displayName(languages, code))
              .join(", ")}
          </span>
        </span>
      )}
      {result.disambiguation && <span>{result.disambiguation}</span>}
      {!result.country &&
        !result.languages.length &&
        !result.disambiguation && <span>Sin metadatos adicionales</span>}
    </span>
  );
}
