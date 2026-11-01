import { Search, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MusicSearchController } from "./use-music-search";
import { SearchPreview, SelectedResult } from "./search-preview";

export function MusicSearch({ search }: { search: MusicSearchController }) {
  const {
    name,
    submitted,
    selected,
    validation,
    query,
    submit,
    browse,
    changeName,
    selectResult,
    inputRef,
  } = search;
  const showResults = submitted && !selected && !query.isFetching;
  return (
    <section
      className="search-section"
      id="buscar"
      aria-labelledby="search-title"
    >
      <h2 id="search-title">Buscá tu punto de partida</h2>
      <p className="muted" id="search-help">
        Escribí un nombre y elegí una coincidencia.
      </p>
      <form
        className="search-form"
        onSubmit={submit}
        aria-describedby="search-help"
      >
        <div className="search-name">
          <label htmlFor="search-name">Nombre</label>
          <input
            ref={inputRef}
            id="search-name"
            name="name"
            value={name}
            onChange={(event) => changeName(event.target.value)}
            maxLength={200}
            placeholder="Por ejemplo, Yes"
            aria-invalid={!!validation}
            aria-describedby={validation ? "search-validation" : undefined}
          />
        </div>

        <Button
          type="submit"
          disabled={query.isFetching}
          className="search-button"
        >
          {query.isFetching ? (
            <LoaderCircle className="loading-icon" aria-hidden="true" />
          ) : (
            <Search aria-hidden="true" />
          )}
          {query.isFetching ? "Buscando…" : "Buscar"}
        </Button>
      </form>
      {validation && (
        <p id="search-validation" role="alert" className="search-error">
          {validation}
        </p>
      )}
      {submitted && (
        <nav className="search-categories" aria-label="Categorías de búsqueda">
          {(
            [
              ["all", "Todo"],
              ["artists", "Artistas y bandas"],
              ["song", "Canciones"],
            ] as const
          ).map(([type, label]) => (
            <button
              type="button"
              key={type}
              aria-pressed={submitted.type === type}
              onClick={() => browse(type)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      <div
        className="search-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {name.trim() && !submitted && <p>Preparando búsqueda…</p>}
        {submitted && query.isFetching && !selected && (
          <p>Buscando en MusicBrainz…</p>
        )}
        {showResults && query.isSuccess && (
          <p>
            {query.data.groups?.some((group) => group.error)
              ? `Resultados incompletos para «${submitted.name}». Podés reintentar la categoría que falló.`
              : query.data.results.length
                ? `${query.data.results.length} coincidencias para «${submitted.name}». Elegí una para continuar.`
                : `No encontramos coincidencias para «${submitted.name}». Probá otro nombre.`}
          </p>
        )}
        {selected && (
          <p>
            Seleccionaste {selected.name}. Podés cambiar la búsqueda o vaciar el
            campo para volver al inicio.
          </p>
        )}
      </div>
      {showResults && query.isError && (
        <div role="alert" className="search-error">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Reintentar búsqueda
          </Button>
        </div>
      )}
      {showResults && query.isSuccess && (
        <>
          {query.data.groups ? (
            query.data.groups.map((group) => (
              <section
                className="result-group"
                key={group.type}
                aria-label={
                  group.type === "artists"
                    ? "Artistas y bandas"
                    : "Canciones · composiciones"
                }
              >
                <div className="result-group-heading">
                  <h3>
                    {group.type === "artists"
                      ? "Artistas y bandas"
                      : "Canciones · composiciones"}{" "}
                    <span>{group.total?.toLocaleString("es-AR") ?? "—"}</span>
                  </h3>
                  {!!group.total && (
                    <Button
                      variant="outline"
                      onClick={() => browse(group.type)}
                    >
                      Ver todos
                    </Button>
                  )}
                </div>
                {group.error ? (
                  <div role="alert">
                    <p>{group.error}</p>
                    <Button
                      variant="outline"
                      onClick={() => browse(group.type)}
                    >
                      Reintentar categoría
                    </Button>
                  </div>
                ) : group.results.length ? (
                  <SearchPreview
                    results={group.results}
                    onSelect={selectResult}
                  />
                ) : (
                  <p className="muted">Sin coincidencias en esta categoría.</p>
                )}
              </section>
            ))
          ) : (
            <>
              <p className="muted results-note">
                {query.data.results.length
                  ? (submitted.offset ?? 0) +
                    1 +
                    "–" +
                    ((submitted.offset ?? 0) + query.data.results.length) +
                    " de " +
                    query.data.total +
                    " coincidencias"
                  : "Sin coincidencias en esta página."}
              </p>
              <SearchPreview
                results={query.data.results}
                onSelect={selectResult}
              />
              <nav
                className="search-pagination"
                aria-label="Páginas de resultados"
              >
                <Button
                  variant="outline"
                  disabled={!submitted.offset}
                  onClick={() =>
                    browse(
                      submitted.type,
                      Math.max(0, (submitted.offset ?? 0) - query.data.limit),
                    )
                  }
                >
                  Anterior
                </Button>
                <span>
                  Página{" "}
                  {Math.floor((submitted.offset ?? 0) / query.data.limit) + 1}
                </span>
                <Button
                  variant="outline"
                  disabled={!query.data.partial}
                  onClick={() =>
                    browse(
                      submitted.type,
                      (submitted.offset ?? 0) + query.data.limit,
                    )
                  }
                >
                  Siguiente
                </Button>
              </nav>
            </>
          )}
        </>
      )}
      {selected && (
        <SelectedResult
          key={`${selected.entity}:${selected.id}`}
          result={selected}
        />
      )}
    </section>
  );
}
