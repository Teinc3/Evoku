# Configuration System

Non-secret configuration is stored in version-controlled JSON files; secrets must live only in `.env` (ignored).
The repository now uses a base + minimal per-environment overrides pattern and a small runtime provider
so shared code can access configuration consistently across client and server.

## Files and layout
| File | Purpose |
|------|---------|
| `config/shared/base.json` | Canonical shared defaults (used by client and shared runtime code). Keep most non-secret shared values here.
| `config/shared/dev.json`, `config/shared/prod.json` | Per-environment shared overrides (minimal; only values that change per environment).
| `config/server/base.json` | Canonical server defaults (non-secret runtime defaults).
| `config/server/dev.json`, `config/server/prod.json` | Per-environment server overrides used at server startup.

Notes:
- Do not put secrets in the JSON files, load them in `.env` files instead.
- Keep per-environment files minimal; prefer a single `base.json` and list only values that differ per environment.

## Client (build-time) behaviour
- The client bundle is static. Angular's `fileReplacements` swap the shared override module/file at build time so the client receives the correct environment values without runtime branching.
- We avoid shipping runtime validation (Zod) in the client bundle to keep it small; validation runs on the server and in CI.

## Server (runtime) behaviour
- The server performs runtime merging and validation.
At startup the server loader merges `config/server/base.json` with the environment override (`config/server/{dev|prod}.json`) and validates the merged result using the shared Zod schema.
- Server code should import runtime config from `src/server/config` (the loader exports the validated, frozen object).


## Validation & CI
- CI validates merged configs (shared + server) by importing the shared Zod schema and parsing each environment's merged result.
If parsing fails, CI fails the job.

## Usage examples
Client (build-time via fileReplacement):
```ts
import sharedConfig from '@shared/config';
// The build-time replacement supplies the correct values in the bundle.
```

Server (runtime merge + validation):
```ts
import sharedConfig from '@shared/config';
import serverConfig from 'REL_PATH_TO_SERVER_CONFIG_DIR';
```

Shared library usage (runtime provider):
```ts
import sharedConfig from "REL_PATH_TO_SHARED_CONFIG_DIR"; // No @shared alias allowed within shared library.
```

## Adding values
1. Secret? Add a placeholder to `.env.example` and read it from `process.env` at server bootstrap.
2. Shared non-secret? Add to `config/shared/base.json` and add minimal per-env overrides under `config/shared/` if needed.
3. Server-only non-secret? Add to `config/server/base.json` and per-env `config/server/{dev,prod}.json`.
4. For breaking shape changes, update the Zod schema under `src/shared/types/config/schema.ts` and update CI tests.
