import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  guestStatusTag,
  unmatchedAttendanceTag,
} from "./guest-status.ts";

describe("guestStatusTag", () => {
  it("uses short labels and pastel colors", () => {
    assert.deepEqual(guestStatusTag("confirmed"), {
      label: "Confirmou",
      className: "bg-[#E4F0E2] text-[#3D5C3A]",
    });
    assert.deepEqual(guestStatusTag("pending"), {
      label: "Pendente",
      className: "bg-[#F7EFD0] text-[#7A5C14]",
    });
    assert.deepEqual(guestStatusTag("declined"), {
      label: "Não vai",
      className: "bg-[#F6E0E0] text-[#7A3B3B]",
    });
  });
});

describe("unmatchedAttendanceTag", () => {
  it("maps vou / não vai to the same pastel pair", () => {
    assert.equal(unmatchedAttendanceTag(true).label, "Vou");
    assert.equal(unmatchedAttendanceTag(false).label, "Não vai");
    assert.equal(
      unmatchedAttendanceTag(true).className,
      guestStatusTag("confirmed").className,
    );
    assert.equal(
      unmatchedAttendanceTag(false).className,
      guestStatusTag("declined").className,
    );
  });
});
