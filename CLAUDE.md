# AI-Driven Developer Certification — Exercises

This repo contains hands-on exercises for the **Certified AI-Driven Developer** program. Each module lives in its own subfolder and is a self-contained Node.js + TypeScript project.

## Repo Layout

| Folder | Module | What to build |
|--------|--------|---------------|
| `module-0-weather-api/` | 0: Zero to Running | Weather dashboard API — `/health`, `/weather/:city`, `/forecast/:city`, HTML dashboard |
| `module-1-taskmaster/` | 1: AI-Powered Feature | Add priority field to a pre-built CLI task manager (CRISP prompting practice) |
| `module-1-commitgen/` | 1: AI-Powered Feature | Git commit message generator CLI tool |
| `module-2-debugger/` | 2: Debug & Understand | Find and fix 3 intentional bugs in an Express API |
| `module-3-url-shortener/` | 3: Build with Confidence | URL shortener built via Red-Green-Refactor TDD with Vitest |
| `module-4-legacy-rescue/` | 4: Real-World Complexity | Modernize callback-style Node.js code to async/await |
| `module-5-blog-auth/` | 5: Plan Before You Build | Add JWT auth to a blog API (use Plan Mode first) |
| `module-6-ai-toolkit/` | 6: Multiply Your Power | Build `.claude/` commands, skills, and hooks around an Express API |

## Common Tech Stack

- **Runtime:** Node.js 18+ with TypeScript (tsx for dev, tsc for build)
- **Web framework:** Express 4
- **Test framework:** Vitest (where tests exist)
- **No external API keys** — all data is mocked

## Code Style (apply across all modules)

- `async/await` only — no callbacks or raw Promise chains
- Functional style — no classes
- 2-space indentation
- Strict TypeScript (`"strict": true` in tsconfig)

## Common Scripts

Each module's `package.json` follows this convention:

```bash
npm run dev        # tsx watch — hot reload
npm run build      # tsc — compile to dist/
npm run typecheck  # tsc --noEmit
npm test           # vitest (where applicable)
```

## Working in This Repo

- Each module is independent — `cd` into the module folder before running anything
- Each module has (or should have) its own `CLAUDE.md` with module-specific goals
- Commit work per module; git history is part of the learning record
- `package-lock.json` files are intentionally gitignored at the root level
