import { createServer } from "node:http";
import {
  createMusicBrainzClient,
  parseSearch,
  SearchError,
} from "./musicbrainz.ts";
import { createArtworkClient } from "./artwork.ts";
import { parseEntity, loadRelations } from "./relations.ts";

const search = createMusicBrainzClient({
  userAgent:
    process.env.MUSICBRAINZ_USER_AGENT || "MusiKit/0.1.0 (local development)",
});
const artwork = createArtworkClient(search.lookup, {
  apiKey: process.env.THEAUDIODB_API_KEY || "123",
});
const port = Number(process.env.API_PORT || 3001);
const server = createServer(async (request, response) => {
  const controller = new AbortController();
  response.on("close", () => controller.abort());
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  const send = (status: number, body: unknown) => {
    if (response.destroyed) return;
    response.writeHead(status);
    response.end(JSON.stringify(body));
  };
  try {
    const url = new URL(request.url || "/", "http://localhost");
    if (
      !["/api/search", "/api/artwork", "/api/relations"].includes(url.pathname)
    ) {
      send(404, { error: "Ruta no encontrada." });
      return;
    }
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      send(405, { error: "Método no permitido." });
      return;
    }
    if (url.pathname === "/api/search") {
      send(200, await search(parseSearch(url.searchParams), controller.signal));
    } else {
      const ref = parseEntity(url.searchParams);
      if (url.pathname === "/api/artwork") {
        send(200, { artwork: await artwork(ref) });
      } else {
        const offset = Number(url.searchParams.get("offset") ?? 0);
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
          throw new SearchError(400, "Página de relaciones inválida.");
        send(
          200,
          await loadRelations(
            ref,
            offset,
            url.searchParams.get("category") === "members",
            search.lookup,
            search.browse,
          ),
        );
      }
    }
  } catch (error) {
    send(error instanceof SearchError ? error.status : 500, {
      error:
        error instanceof SearchError
          ? error.message
          : "No pudimos completar la búsqueda.",
    });
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`MusiKit API: http://127.0.0.1:${port}`),
);
