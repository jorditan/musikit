import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeRelations, parseEntity } from "./relations.ts";
import { createArtworkClient } from "./artwork.ts";
import { createMusicBrainzClient } from "./musicbrainz.ts";

const work = "0c80db24-389e-3620-8e0b-84dc2b7c009a";
const artist = "4d5447d7-c61c-4120-ba1b-d7f471d385b9";
const recording = "796d226c-0018-47c4-8f52-98b9d147536f";
const release = "4ffd6b33-61ca-43c6-b30c-978fefe1ed90";

test("rejects invalid entities before upstream requests", () => {
  for (const params of [
    "entity=url&id=" + artist,
    "entity=artist&id=../../secret",
    "entity=work&id=wrong",
  ]) {
    assert.throws(() => parseEntity(new URLSearchParams(params)));
  }
  assert.deepEqual(
    parseEntity(new URLSearchParams("entity=recording&id=" + recording)),
    { entity: "recording", id: recording },
  );
});

test("relationships preserve identity, direction and deduplicate repeated edges", () => {
  const relation = {
    type: "writer",
    direction: "backward",
    "target-type": "artist",
    artist: { id: artist, name: "John Lennon" },
  };
  const data = normalizeRelations(
    { entity: "work", id: work },
    {
      id: work,
      relations: [relation, relation, { type: "url", "target-type": "url" }],
    },
  );
  assert.equal(data.nodes.length, 1);
  assert.equal(data.edges.length, 1);
  assert.equal(data.edges[0].source, "artist:" + artist);
  assert.equal(data.edges[0].target, "work:" + work);
  assert.equal(data.edges[0].label, "es autor de");
  assert.equal(data.nextOffset, null);
  assert.throws(() =>
    normalizeRelations({ entity: "work", id: work }, { id: artist }),
  );
});

test("relations page in bounded batches and keep explicit recording credits", () => {
  const relations = Array.from({ length: 15 }, (_, index) => ({
    type: "writer",
    "target-type": "artist",
    artist: {
      id: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
      name: "Writer " + index,
    },
  }));
  const first = normalizeRelations(
    { entity: "work", id: work },
    { id: work, relations },
  );
  const last = normalizeRelations(
    { entity: "work", id: work },
    { id: work, relations },
    first.nextOffset!,
  );
  assert.equal(first.edges.length, 12);
  assert.equal(last.edges.length, 3);
  assert.equal(last.nextOffset, null);
  const credits = normalizeRelations(
    { entity: "recording", id: recording },
    {
      id: recording,
      "artist-credit": [{ artist: { id: artist, name: "John Lennon" } }],
    },
  );
  assert.equal(credits.edges[0].label, "interpreta");
});

test("artist images match MBID and share requests and cached results", async () => {
  let calls = 0;
  const client = createArtworkClient(async () => null, {
    interval: 0,
    fetcher: async () => {
      calls++;
      return Response.json({
        artists: [
          {
            strMusicBrainzID: artist,
            strArtist: "John Lennon",
            strArtistThumb: "https://example.com/john.jpg",
          },
        ],
      });
    },
  });
  const ref = { entity: "artist" as const, id: artist };
  const [one, two] = await Promise.all([client(ref), client(ref)]);
  assert.equal(one?.url, "https://example.com/john.jpg");
  assert.deepEqual(one, two);
  await client(ref);
  assert.equal(calls, 1);
  assert.equal(await client({ ...ref, id: work }), null);
});

test("artwork failures remain retryable rather than cached as missing", async () => {
  let calls = 0;
  const client = createArtworkClient(async () => null, {
    interval: 0,
    fetcher: async () => {
      calls++;
      return calls === 1
        ? new Response("", { status: 503 })
        : Response.json({ artists: null });
    },
  });
  const ref = { entity: "artist" as const, id: artist };
  await assert.rejects(client(ref));
  assert.equal(await client(ref), null);
  await client(ref);
  assert.equal(calls, 2);
});

test("work cover is traced through recording and release and describes the version", async () => {
  const calls: string[] = [];
  const client = createArtworkClient(
    async (entity, id) => {
      calls.push(entity + ":" + id);
      return entity === "work"
        ? {
            id: work,
            relations: [{ type: "performance", recording: { id: recording } }],
          }
        : {
            id: recording,
            "artist-credit": [{ name: "The Beatles" }],
            releases: [{ id: release, title: "Anthology 2" }],
          };
    },
    {
      fetcher: async () =>
        Response.json({
          images: [
            {
              front: true,
              thumbnails: { "250": "https://example.com/cover.jpg" },
            },
          ],
        }),
    },
  );
  const image = await client({ entity: "work", id: work });
  assert.deepEqual(calls, ["work:" + work, "recording:" + recording]);
  assert.equal(image?.recordingId, recording);
  assert.equal(image?.releaseId, release);
  assert.equal(image?.caption, "Versión: The Beatles · Anthology 2");
});

test("lookups share the search rate limiter and deduplicate concurrent lookups", async () => {
  const times: number[] = [];
  const client = createMusicBrainzClient({
    interval: 25,
    fetcher: async (input) => {
      times.push(Date.now());
      return Response.json(
        String(input).includes(work)
          ? { id: work, relations: [] }
          : { count: 0, artists: [] },
      );
    },
  });
  await Promise.all([
    client({ name: "Yes", type: "artists" }),
    client.lookup("work", work, "artist-rels"),
    client.lookup("work", work, "artist-rels"),
  ]);
  assert.equal(times.length, 2);
  assert.ok(times[1] - times[0] >= 25);
  await client.lookup("work", work, "artist-rels");
  assert.equal(times.length, 2);
});
