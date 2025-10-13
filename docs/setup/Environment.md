# Environment

Single `.env` (ignored) for runtime secrets only; versioned JSON handles all non-secret config.

## Environment Files

| File | Purpose | Tracked in Git |
|------|---------|----------------|
| `.env` | Secrets only (ignored) | ❌ No |
| `.env.example` | Secrets schema (no secrets) | ✅ Yes |

## Loading
Server loads `.env` via `dotenv/config` preloaded using `NODE_OPTIONS='-r dotenv/config'` so environment variables are available before the server bootstrap and the tsconfig-paths loader runs.
This ensures runtime selection and any loader logic can depend on `process.env` at startup.

If your platform does not support `NODE_OPTIONS` in npm scripts (Windows shells), consider using the library `cross-env`.

## Variable Types
Only secrets (tokens, credentials, secret DB URIs) go in `.env`.
Everything else lives in JSON config and is typed.

## Setup
Copy `.env.example` to `.env` if secrets are needed and fill them in.
