import { describe, expect, it } from "vitest";

import {
  GENERIC_FAILURE,
  NETWORK_FAILURE,
  readErrorDetail,
  requestErrorMessage,
} from "../apiError";

describe("readErrorDetail", () => {
  it("passes an HTTPException's string detail straight through", () => {
    expect(readErrorDetail({ detail: "Not authenticated" })).toBe("Not authenticated");
  });

  /*
   * FastAPI sends a LIST for a Pydantic ValidationError. Handling only the
   * string case turned every 422 into the same opaque failure, so an
   * over-length answer and a server outage read identically.
   */
  it("names the field and the reason from a validation error", () => {
    const body = {
      detail: [
        { loc: ["body", "visa_other"], msg: "must be at most 50 characters" },
      ],
    };

    expect(readErrorDetail(body)).toBe("visa_other: must be at most 50 characters");
  });

  it("joins several field errors", () => {
    const body = {
      detail: [
        { loc: ["body", "move_date"], msg: "invalid date format" },
        { loc: ["body", "visa_type"], msg: "unexpected value" },
      ],
    };

    expect(readErrorDetail(body)).toBe(
      "move_date: invalid date format; visa_type: unexpected value",
    );
  });

  it("drops the useless leading 'body' segment", () => {
    expect(readErrorDetail({ detail: [{ loc: ["body"], msg: "bad" }] })).toBe("bad");
  });

  it.each([null, undefined, {}, { detail: "" }, { detail: [] }, { detail: 42 }])(
    "falls back to a generic message for %j",
    (body) => {
      expect(readErrorDetail(body)).toBe(GENERIC_FAILURE);
    },
  );
});

describe("requestErrorMessage", () => {
  it("turns the browser's network TypeError into a plain sentence", () => {
    expect(requestErrorMessage(new TypeError("Failed to fetch"), "x")).toBe(NETWORK_FAILURE);
    expect(requestErrorMessage(new TypeError("Load failed"), "x")).toBe(NETWORK_FAILURE);
  });

  it("explains a timeout", () => {
    expect(requestErrorMessage(new DOMException("t", "TimeoutError"), "x")).toMatch(/too long/);
  });

  it("keeps API error messages and falls back otherwise", () => {
    expect(requestErrorMessage(new Error("move_date: invalid"), "x")).toBe("move_date: invalid");
    expect(requestErrorMessage("??", "fallback")).toBe("fallback");
  });
});

