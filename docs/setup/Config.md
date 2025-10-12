# Configuration System

Non-secret configuration lives in version-controlled JSON files; secrets must live only in `.env` (ignored). The repo now uses a small, explicit set of JSON files for configuration plus a shared Zod schema to validate merged results in CI.

## Files and layout
| File | Purpose |
|------|---------|
| `config/shared/base.json` | Canonical shared configuration (client + shared runtime defaults). Keep most non-secret shared values here.
| `config/server/base.json` | Canonical server runtime defaults (non-secret).
| `config/shared/*.json` | Small per-environment overrides for shared/client (e.g. `dev.json`, `prod.json`).
| `config/server/*.json` | Small per-environment server overrides (e.g. `dev.json`, `prod.json`).

Notes:
- Do not put secrets in the JSON files. Use `.env` for all secrets and read them at server bootstrap.
- Keep per-environment override files minimal; prefer a single `base.json` and only list values that change per environment.

## Client (build-time) behavior
- The client bundle does not run Zod or runtime validation to keep bundles small.
- During client builds we use Angular's `fileReplacements` to swap a small override file into the bundle (for example, `config/shared/override.json` replaced with `config/shared/dev.json` during a dev build). 
This keeps the client build static and avoids shipping the entire validation library.

## Server (runtime) behavior
- The server loader reads `config/server/base.json` synchronously at startup, then looks for a per-environment override file (selected via `NODE_ENV` or a dedicated `EVOKU_ENV`) under `config/server/{env}.json`. 
If present, the loader deep-merges the override on top of `base.json` (override wins).

## Validation & CI
- We validate merged configs (base + override + env overlays) in CI using a small Jest test that imports the shared Zod schema and parses each environment's merged result.
If any environment's merged config fails the schema check, the CI job fails.
- This gives us typed guarantees and prevents broken runtime configs from deploying.

## Usage examples
Client import (build-time file replacement):

```ts
import sharedConfig from '@shared/types/config';
// This import receives the merged, frozen config at build-time via fileReplacement.
```

Server loader (runtime):

```ts
import ServerConfig from 'src/server/config';
// ServerConfig is the typed, frozen object produced by merging base + override + envs and validated with Zod.
```

## Adding Values
1. Secret? Add a placeholder to `.env.example` and read via `process.env` at server bootstrap.
2. Shared non-secret? Add to `config/shared/base.json` and add per-env small overrides to `config/shared/{dev|prod}.json` if needed.
3. Server-only non-secret? Add to `config/server/base.json` and to per-env overrides in `config/server/` as needed.
4. For any breaking changes to the config shape, update the Zod schema under `src/shared/types/config/schema.ts` and update the CI validation tests.
