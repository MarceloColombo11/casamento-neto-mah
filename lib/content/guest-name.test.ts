import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePersonName,
  validateGuestFullName,
} from "./guest-name.ts";

describe("normalizePersonName", () => {
  it("lowercases, strips accents and collapses spaces", () => {
    assert.equal(
      normalizePersonName("  Marcelo   HENRIQUE Colombo "),
      "marcelo henrique colombo",
    );
    assert.equal(normalizePersonName("José da Silva"), "jose da silva");
  });
});

describe("validateGuestFullName", () => {
  it("accepts two or more words up to 120 chars", () => {
    const result = validateGuestFullName("Marcelo Henrique Colombo");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value, "Marcelo Henrique Colombo");
      assert.equal(result.normalized, "marcelo henrique colombo");
    }
  });

  it("rejects empty, one word, and oversize", () => {
    assert.equal(validateGuestFullName("").ok, false);
    assert.equal(validateGuestFullName("Marcelo").ok, false);
    assert.equal(validateGuestFullName("A ".repeat(70) + "B").ok, false);
  });
});
