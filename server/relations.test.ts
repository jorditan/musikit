import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRelations, normalizeRelations } from "./relations.ts";

const id = (n: number) =>
  `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const band = { entity: "artist" as const, id: id(1) };
const album = { entity: "release-group" as const, id: id(2) };

test("artists expose their bands and bands expose the same membership without duplicate edges", async () => {
  const person = { entity: "artist" as const, id: id(3) };
  const forward = await loadRelations(
    person,
    0,
    true,
    async () => ({
      id: person.id,
      name: "Gustavo Cerati",
      type: "Person",
      relations: [
        {
          type: "member of band",
          direction: "forward",
          "target-type": "artist",
          artist: { id: band.id, name: "Soda Stereo" },
        },
        {
          type: "collaboration",
          direction: "forward",
          "target-type": "artist",
          artist: { id: id(9), name: "Other" },
        },
      ],
    }),
    async () => {
      throw new Error("must not browse albums");
    },
  );
  const backward = normalizeRelations(band, {
    id: band.id,
    type: "Group",
    relations: [
      {
        type: "member of band",
        direction: "backward",
        "target-type": "artist",
        artist: { id: person.id, name: "Gustavo Cerati" },
      },
    ],
  });
  assert.equal(forward.nodes.length, 1);
  assert.equal(forward.nodes[0].kind, "Group");
  assert.equal(backward.nodes[0].kind, "Person");
  assert.equal(forward.edges[0].id, backward.edges[0].id);
  assert.equal(forward.subject?.kind, "Person");
});

test("artists and bands browse albums with upstream pagination, not arbitrary relationships", async () => {
  for (const type of ["Person", "Group"]) {
    const result = await loadRelations(
      band,
      12,
      false,
      async () => ({ id: band.id, type }),
      async (entity, params) => {
        assert.equal(entity, "release-group");
        assert.deepEqual(params, {
          artist: band.id,
          type: "album",
          limit: "12",
          offset: "12",
        });
        return {
          "release-groups": [
            { id: album.id, title: "Album", "primary-type": "Album" },
          ],
          "release-group-count": 14,
        };
      },
    );
    assert.equal(result.subject?.kind, type);
    assert.equal(result.nodes[0].entity, "release-group");
    assert.equal(result.edges[0].source, `artist:${band.id}`);
    assert.equal(result.total, 14);
    assert.equal(result.nextOffset, 13);
  }
});

test("band members exclude unrelated artists and outbound memberships", () => {
  const member = {
    type: "member of band",
    direction: "backward",
    "target-type": "artist",
    artist: { id: id(3), name: "Member", type: "Person" },
  };
  const result = normalizeRelations(band, {
    id: band.id,
    type: "Group",
    relations: [
      member,
      member,
      { ...member, type: "collaboration" },
      { ...member, direction: "forward" },
    ],
  });
  assert.equal(result.edges.length, 1);
  assert.equal(result.edges[0].source, `artist:${id(3)}`);
  assert.equal(result.edges[0].target, `artist:${band.id}`);
  assert.equal(
    normalizeRelations(band, {
      id: band.id,
      type: "Person",
      relations: [member],
    }).total,
    0,
  );
});

test("albums expand one official edition in track order, across discs and pages", async () => {
  const tracks = Array.from({ length: 15 }, (_, n) => ({
    recording: { id: id(n + 10), title: `Song ${n}` },
  }));
  const lookup = async (entity: string, releaseId: string, inc: string) => {
    assert.equal(entity, "release");
    assert.equal(inc, "recordings");
    return {
      id: releaseId,
      media: [{ tracks: tracks.slice(0, 8) }, { tracks: tracks.slice(8) }],
    };
  };
  const browse = async (_entity: string, params: Record<string, string>) => {
    assert.equal(params["release-group"], album.id);
    assert.equal(params.status, "official");
    assert.equal(params.limit, "1");
    return { releases: [{ id: id(4) }] };
  };
  const first = await loadRelations(album, 0, false, lookup, browse);
  const last = await loadRelations(
    album,
    first.nextOffset!,
    false,
    lookup,
    browse,
  );
  assert.equal(first.total, 15);
  assert.equal(first.nodes.length, 12);
  assert.equal(last.nodes.length, 3);
  assert.equal(last.nodes[0].name, "Song 12");
  assert.equal(last.nextOffset, null);
  assert.ok(
    first.edges.every((edge) => edge.source === `release-group:${album.id}`),
  );
});

test("songs show authors and unique performers without adding recording or unrelated nodes", () => {
  const performer = { id: id(5), name: "Performer" };
  const performance = {
    type: "performance",
    "target-type": "recording",
    recording: { id: id(6), "artist-credit": [{ artist: performer }] },
  };
  const result = normalizeRelations(
    { entity: "work", id: id(7) },
    {
      id: id(7),
      relations: [
        {
          type: "composer",
          direction: "backward",
          "target-type": "artist",
          artist: { id: id(8), name: "Composer" },
        },
        {
          type: "dedication",
          "target-type": "artist",
          artist: { id: id(9), name: "Unrelated" },
        },
        performance,
        { ...performance, recording: { ...performance.recording, id: id(10) } },
      ],
    },
  );
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ["Composer", "Performer"],
  );
  assert.equal(result.edges.length, 2);
  assert.equal(result.edges[1].label, "interpretó una versión de");
});

test("missing editions stay empty and upstream failures stay retryable", async () => {
  const empty = await loadRelations(
    album,
    0,
    false,
    async () => {
      throw new Error("unexpected lookup");
    },
    async () => ({ releases: [] }),
  );
  assert.equal(empty.total, 0);
  await assert.rejects(
    loadRelations(
      album,
      0,
      false,
      async () => null,
      async () => {
        throw new Error("offline");
      },
    ),
    /offline/,
  );
});

test("album artwork uses the release-group cover directly", async () => {
  const { createArtworkClient } = await import("./artwork.ts");
  const client = createArtworkClient(
    async () => {
      throw new Error("unexpected lookup");
    },
    {
      fetcher: async (input) => {
        assert.equal(
          String(input),
          `https://coverartarchive.org/release-group/${album.id}`,
        );
        return Response.json({
          images: [
            {
              front: true,
              thumbnails: { "250": "https://example.com/cover.jpg" },
            },
          ],
        });
      },
    },
  );
  assert.equal((await client(album))?.source, "Cover Art Archive");
});
