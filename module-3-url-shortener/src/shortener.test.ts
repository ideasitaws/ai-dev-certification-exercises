import { describe, it, expect, beforeEach, vi } from "vitest";

// Reset the module registry before each test so the in-memory Maps start
// empty — prevents cross-test state leakage from the shared store.
let shorten: (url: string) => string;
let resolve: (code: string) => string | null;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("./shortener");
  shorten = mod.shorten;
  resolve = mod.resolve;
});

// ---------------------------------------------------------------------------
// URL Validation
// ---------------------------------------------------------------------------

describe("shorten — URL validation", () => {
  it("accepts a standard https URL", () => {
    expect(() => shorten("https://example.com")).not.toThrow();
  });

  it("accepts a standard http URL", () => {
    expect(() => shorten("http://example.com/path?q=1")).not.toThrow();
  });

  it("accepts a URL with path, query, and fragment", () => {
    expect(() =>
      shorten("https://example.com/a/b/c?foo=bar&baz=1#section")
    ).not.toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => shorten("")).toThrow();
  });

  it("rejects a string with no protocol", () => {
    expect(() => shorten("example.com/path")).toThrow();
  });

  it("rejects a plain word that is not a URL", () => {
    expect(() => shorten("notaurl")).toThrow();
  });

  it("rejects a URL with an unsupported protocol (ftp)", () => {
    expect(() => shorten("ftp://files.example.com")).toThrow();
  });

  it("rejects a URL where the protocol is present but host is missing", () => {
    expect(() => shorten("https://")).toThrow();
  });

  it("rejects null-ish input coerced to string (undefined cast)", () => {
    // Passing undefined coerced — guards against weak runtime typing
    expect(() => shorten(undefined as unknown as string)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Short code format
// ---------------------------------------------------------------------------

describe("shorten — short code format", () => {
  it("returns a string of exactly 6 characters", () => {
    const code = shorten("https://format-check.example.com/1");
    expect(code).toHaveLength(6);
  });

  it("returns only alphanumeric characters", () => {
    const code = shorten("https://format-check.example.com/2");
    expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
  });

  it("returns a non-empty string", () => {
    const code = shorten("https://format-check.example.com/3");
    expect(typeof code).toBe("string");
    expect(code.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// URL retrieval
// ---------------------------------------------------------------------------

describe("resolve — URL retrieval", () => {
  it("returns the original URL for a valid short code", () => {
    const url = "https://retrieval.example.com/page";
    const code = shorten(url);
    expect(resolve(code)).toBe(url);
  });

  it("returns null for an unknown short code", () => {
    expect(resolve("xxxxxx")).toBeNull();
  });

  it("returns null for an empty string code", () => {
    expect(resolve("")).toBeNull();
  });

  it("preserves query parameters in the original URL", () => {
    const url = "https://retrieval.example.com/search?q=hello+world&page=2";
    const code = shorten(url);
    expect(resolve(code)).toBe(url);
  });

  it("preserves URL fragments in the original URL", () => {
    const url = "https://retrieval.example.com/docs#section-3";
    const code = shorten(url);
    expect(resolve(code)).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe("shorten — idempotency", () => {
  it("returns the same code when the same URL is shortened twice", () => {
    const url = "https://idempotent.example.com/same";
    const first = shorten(url);
    const second = shorten(url);
    expect(first).toBe(second);
  });

  it("returns different codes for different URLs", () => {
    const code1 = shorten("https://idempotent.example.com/a");
    const code2 = shorten("https://idempotent.example.com/b");
    expect(code1).not.toBe(code2);
  });

  it("repeated calls do not create duplicate store entries", () => {
    const url = "https://idempotent.example.com/dup";
    const code = shorten(url);
    shorten(url); // second call — must not corrupt the store
    expect(resolve(code)).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("rejects a URL that is exactly 2049 characters (over the 2048-char limit)", () => {
    const base = "https://toolong.example.com/";
    const url = base + "a".repeat(2049 - base.length);
    expect(url.length).toBe(2049);
    expect(() => shorten(url)).toThrow();
  });

  it("accepts a URL that is exactly 2048 characters", () => {
    const base = "https://maxlen.example.com/";
    const url = base + "a".repeat(2048 - base.length);
    expect(url.length).toBe(2048);
    expect(() => shorten(url)).not.toThrow();
  });

  it("accepts a URL with a very long query string within 2048 chars", () => {
    const base = "https://longquery.example.com/?data=";
    const url = base + "x".repeat(2048 - base.length);
    expect(url.length).toBe(2048);
    expect(() => shorten(url)).not.toThrow();
  });

  it("rejects a URL that is only whitespace", () => {
    expect(() => shorten("   ")).toThrow();
  });

  it("rejects a URL missing the protocol scheme (www. prefix only)", () => {
    expect(() => shorten("www.example.com/path")).toThrow();
  });

  it("resolves a 2048-character URL back to the original", () => {
    const base = "https://roundtrip.example.com/";
    const url = base + "z".repeat(2048 - base.length);
    const code = shorten(url);
    expect(resolve(code)).toBe(url);
  });
});
