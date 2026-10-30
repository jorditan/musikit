import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMusicBrainzClient,
  normalize,
  parseSearch,
  searchUrl,
} from "./musicbrainz.ts";

test("rejects empty, oversized and unsupported searches", () => {
  for (const params of [
    "name=+&type=artist",
    "name=test&type=recording",
    `name=${"x".repeat(201)}&type=song`,
  ]) {
    assert.throws(() => parseSearch(new URLSearchParams(params)));
  }
  assert.deepEqual(
    parseSearch(new URLSearchParams("name=+Cerati+&type=artist")),
    { name: "Cerati", type: "artist" },
  );
});

test("builds literal Lucene searches without allowing filter injection", () => {
  const url = searchUrl({ name: 'AC/DC " OR type:person', type: "band" });
  assert.equal(url.pathname, "/ws/2/artist");
  assert.equal(
    url.searchParams.get("query"),
    'artist:"AC\\/DC \\" OR type\\:person" AND type:group',
  );
  assert.equal(
    searchUrl({ name: "Yesterday", type: "song" }).pathname,
    "/ws/2/work",
  );
  assert.match(
    searchUrl({ name: "Cerati", type: "artist" }).searchParams.get("query")!,
    /type:person$/,
  );
});

test("keeps entity IDs, nullable metadata and partial coverage", () => {
  const data = normalize(
    { count: 15, works: [{ id: "work-id", title: "Yesterday" }] },
    { name: "Yesterday", type: "song" },
  );
  assert.equal(data.results[0].entity, "work");
  assert.equal(data.results[0].id, "work-id");
  assert.equal(data.results[0].country, null);
  assert.deepEqual(data.results[0].languages, []);
  assert.equal(data.partial, true);
  assert.deepEqual(
    normalize({ count: 0, artists: [] }, { name: "Unknown", type: "band" })
      .results,
    [],
  );
  assert.throws(() =>
    normalize({ count: 0 }, { name: "Unknown", type: "band" }),
  );
});

test("serializes upstream requests, enforces spacing, and recovers after a failure", async () => {
  const starts: number[] = [];
  const client = createMusicBrainzClient({
    interval: 40,
    fetcher: async (_url, options) => {
      starts.push(Date.now());
      assert.ok(
        new Headers(options?.headers).get("User-Agent")?.includes("MusiKit"),
      );
      if (starts.length === 1) return new Response("", { status: 503 });
      return Response.json({ count: 0, artists: [] });
    },
  });
  const outcomes = await Promise.allSettled([
    client({ name: "A", type: "band" }),
    client({ name: "B", type: "band" }),
  ]);
  assert.equal(outcomes[0].status, "rejected");
  assert.equal(outcomes[1].status, "fulfilled");
  assert.ok(starts[1] - starts[0] >= 40);
});

test("unified search includes people, bands and works under the same queue", async () => {
  const urls: URL[] = [];
  const client = createMusicBrainzClient({
    interval: 0,
    fetcher: async (input) => {
      const url = new URL(String(input));
      urls.push(url);
      return Response.json(
        url.pathname.endsWith("/work")
          ? { count: 1, works: [{ id: "work", title: "Yes", type: "Song" }] }
          : {
              count: 2,
              artists: [
                { id: "band", name: "Yes", type: "Group" },
                { id: "person", name: "Yes", type: "Person" },
              ],
            },
      );
    },
  });
  const query = parseSearch(new URLSearchParams("name=Yes"));
  const data = await client(query);
  assert.equal(query.type, "all");
  assert.equal(urls.length, 2);
  assert.equal(urls[0].searchParams.get("query"), 'artist:"Yes"');
  assert.deepEqual(
    data.results.map((result) => result.id),
    ["band", "work", "person"],
  );
  assert.equal(data.total, 3);
  assert.equal(data.partial, false);
});
