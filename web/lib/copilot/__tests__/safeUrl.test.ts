import { describe, expect, it } from "vitest";

import { safeExternalUrl } from "../safeUrl";

describe("safeExternalUrl", () => {
  /*
   * React escapes text content but does NOT sanitise href. Citation URLs are
   * model output, so an unchecked href is a one-click XSS driven by whatever
   * the model emits — or by whatever a retrieved page persuaded it to emit.
   */
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)  ",
    "java\tscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("refuses %s", (hostile) => {
    expect(safeExternalUrl(hostile)).toBeNull();
  });

  it.each([
    "https://www.ontario.ca/page/renting-ontario",
    "http://example.com/a?b=c#d",
    "mailto:info@example.com",
  ])("allows %s", (safe) => {
    expect(safeExternalUrl(safe)).not.toBeNull();
  });

  // A citation names an external authority, so a relative path is not one.
  it.each(["/local/page", "../up", "example.com", "", "   "])(
    "refuses the non-absolute value %j",
    (value) => {
      expect(safeExternalUrl(value)).toBeNull();
    },
  );

  it.each([null, undefined, 42, {}, []])("refuses the non-string %j", (value) => {
    expect(safeExternalUrl(value)).toBeNull();
  });
});

