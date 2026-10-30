import { createServer } from "node:http";
import {
  createMusicBrainzClient,
  parseSearch,
  SearchError,
} from "./musicbrainz.ts";

const search = createMusicBrainzClient({
  userAgent:
    process.env.MUSICBRAINZ_USER_AGENT || "MusiKit/0.1.0 (local development)",
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
    if (url.pathname !== "/api/search") {
      send(404, { error: "Ruta no encontrada." });
      return;
    }
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      send(405, { error: "Método no permitido." });
      return;
    }
    send(200, await search(parseSearch(url.searchParams), controller.signal));
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
