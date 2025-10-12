# Environment

Single `.env` (ignored) for runtime secrets only; versioned JSON handles all non-secret config.

## Environment Files

| File | Purpose | Tracked in Git |
|------|---------|----------------|
| `.env` | Secrets only (ignored) | ❌ No |
| `.env.example` | Secrets schema (no secrets) | ✅ Yes |

## Loading
Server loads `.env` via `import 'dotenv/config'`. No cascading precedence.

## Variable Types
Only secrets (tokens, credentials, secret DB URIs) go in `.env`.
Everything else lives in JSON config and is typed.

## Setup
Copy `.env.example` to `.env` if secrets are needed and fill them in.
