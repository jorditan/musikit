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
            {query.data.results.length
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
          {query.data.partial && (
            <p className="muted results-note">
              Primeras {query.data.results.length} coincidencias de{" "}
              {query.data.total}. No representan todo el catálogo.
            </p>
          )}
          <SearchPreview results={query.data.results} onSelect={selectResult} />
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
