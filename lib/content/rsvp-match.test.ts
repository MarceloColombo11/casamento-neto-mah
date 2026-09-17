import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRsvpTarget } from "./rsvp-match.ts";

const marceloHenrique = {
  id: "g1",
  nameNormalized: "marcelo henrique colombo",
};
const mariaA = { id: "g2", nameNormalized: "maria silva" };
const mariaB = { id: "g3", nameNormalized: "maria silva" };

describe("resolveRsvpTarget", () => {
  it("links guestId when the typed name matches that guest", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Henrique Colombo", guestId: "g1" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.target, { kind: "guest", id: "g1" });
  });

  it("does not use guestId if the typed name does not match that person", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Colombo", guestId: "g1" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.target.kind, "unmatched");
      if (result.target.kind === "unmatched") {
        assert.equal(result.target.nameNormalized, "marcelo colombo");
      }
    }
  });

  it("links a unique exact normalized name without guestId", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Henrique Colombo" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.target, { kind: "guest", id: "g1" });
  });

  it("keeps homonyms unmatched without guestId", () => {
    const result = resolveRsvpTarget({ name: "Maria Silva" }, [mariaA, mariaB]);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.target.kind, "unmatched");
  });

  it("rejects a single-word name", () => {
    const result = resolveRsvpTarget({ name: "Marcelo" }, [marceloHenrique]);
    assert.equal(result.ok, false);
  });
});
