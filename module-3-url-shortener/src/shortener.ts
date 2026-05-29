import { customAlphabet } from "nanoid";

const generateCode = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
);

const codeToUrl = new Map<string, string>();
const urlToCode = new Map<string, string>();

function validate(url: string): void {
  if (url == null || typeof url !== "string") {
    throw new Error("URL must be a string");
  }
  if (url.trim().length === 0) {
    throw new Error("URL must not be empty or whitespace");
  }
  if (url.length > 2048) {
    throw new Error("URL must not exceed 2048 characters");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }
  if (!parsed.hostname) {
    throw new Error("URL must have a hostname");
  }
}

export function shorten(url: string, codeLength = 6): string {
  validate(url);
  const existing = urlToCode.get(url);
  if (existing !== undefined) return existing;
  const code = generateCode(codeLength);
  codeToUrl.set(code, url);
  urlToCode.set(url, code);
  return code;
}

export function resolve(code: string): string | null {
  return codeToUrl.get(code) ?? null;
}
