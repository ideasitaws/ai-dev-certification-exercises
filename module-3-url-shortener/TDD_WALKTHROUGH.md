# Module 3 — URL Shortener: TDD Walkthrough

A record of the Red-Green-Refactor cycle used to build this module from scratch.

---

## What was built

A URL shortener module (`src/shortener.ts`) with two exported functions:

| Function | Signature | Description |
|---|---|---|
| `shorten` | `(url: string, codeLength?: number) => string` | Validates a URL and returns a short alphanumeric code (default 6 chars) |
| `resolve` | `(code: string) => string \| null` | Returns the original URL for a given code, or `null` if not found |

---

## The Red-Green-Refactor Cycle

### RED — Write tests first

Tests were written in `src/shortener.test.ts` before any implementation existed. The module stubs threw `"Not implemented"` for both functions, so every test failed immediately.

**26 tests across 5 groups:**

#### 1. URL Validation (9 tests)

| Test | Input | Expected |
|---|---|---|
| accepts https URL | `https://example.com` | no throw |
| accepts http URL | `http://example.com/path?q=1` | no throw |
| accepts URL with path, query, fragment | `https://example.com/a/b?foo=1#section` | no throw |
| rejects empty string | `""` | throws |
| rejects no protocol | `"example.com/path"` | throws |
| rejects plain word | `"notaurl"` | throws |
| rejects unsupported protocol | `"ftp://files.example.com"` | throws |
| rejects protocol with no host | `"https://"` | throws |
| rejects `undefined` cast to string | `undefined as unknown as string` | throws |

#### 2. Short Code Format (3 tests)

- Code is exactly 6 characters long
- Code matches `/^[A-Za-z0-9]{6}$/` (alphanumeric only)
- Return type is `string`

#### 3. URL Retrieval (5 tests)

- `resolve(shorten(url))` returns the original URL
- `resolve("xxxxxx")` returns `null` for an unknown code
- `resolve("")` returns `null`
- Query parameters are preserved exactly (`?q=hello+world&page=2`)
- URL fragments are preserved exactly (`#section-3`)

#### 4. Idempotency (3 tests)

- Calling `shorten(url)` twice with the same URL returns the same code
- Two different URLs produce two different codes
- A second call for the same URL does not corrupt the store — `resolve` still works

#### 5. Edge Cases (6 tests)

| Test | URL length | Expected |
|---|---|---|
| exactly 2049 chars | 2049 | throws |
| exactly 2048 chars | 2048 | no throw |
| long query string within 2048 | 2048 | no throw |
| whitespace only | `"   "` | throws |
| www. prefix, no protocol | `"www.example.com/path"` | throws |
| 2048-char URL round-trip | 2048 | `resolve(shorten(url)) === url` |

**Test isolation:** Each test uses `vi.resetModules()` + a dynamic import in `beforeEach` so the in-memory Maps start empty and tests cannot leak state into one another.

---

### GREEN — Minimum implementation to pass

`src/shortener.ts` was implemented with these decisions:

**Validation (`validate` function)**
- Guards against `null`/`undefined` before any string operations
- Rejects whitespace-only input via `.trim().length === 0`
- Enforces the 2048-character hard limit before parsing
- Delegates structural parsing to `new URL(url)` — throws on malformed URLs
- Explicitly allows only `http:` and `https:` protocols after parsing

**Short code generation**
- Uses `nanoid`'s `customAlphabet` with the 62-character alphanumeric set
- No fixed size baked into the generator — size is passed per call

**Storage**
- Two `Map`s: `codeToUrl` (code → URL) and `urlToCode` (URL → code)
- `urlToCode` is the idempotency index: checked first in `shorten` before generating a new code
- `resolve` returns `null` via `?? null` rather than `undefined`

All 26 tests passed on the first run after implementation.

---

### REFACTOR — Improve without breaking

Two changes made while keeping all 26 tests green:

1. **`validate` extracted as a standalone function** — already done during the green phase as a natural separation of concerns; confirmed it remained a named, independently readable function after refactor.

2. **Configurable code length** — `shorten(url, codeLength = 6)` replaces the hardcoded `6`. The generator's size is no longer fixed at module load time; it is passed as an argument on each call. Existing call sites (including all tests) pass no second argument and continue to get 6-character codes.

```ts
// Before
const generateCode = customAlphabet("ABC...z0-9", 6);
export function shorten(url: string): string { ... generateCode() ... }

// After
const generateCode = customAlphabet("ABC...z0-9");
export function shorten(url: string, codeLength = 6): string { ... generateCode(codeLength) ... }
```

---

## Final file structure

```
src/
  shortener.ts        — implementation (49 lines)
  shortener.test.ts   — 26 Vitest tests (180 lines)
```

## Running the tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

Expected output: `26 passed`.
