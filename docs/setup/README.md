# Setup & Configuration

Documentation for application configuration, environment setup, and deployment.

## Configuration System

The project uses a JSON-based configuration system with a clear separation between secrets and non-secret configuration.
The repository now uses `config/shared/*` for client/shared values and `config/server/*` for server runtime values, with small per-environment override files.

### Core Documentation

- **[Environment Variables](Environment.md)** - Runtime secrets and `.env` file usage
- **[Configuration System](Config.md)** - JSON configuration files, per-environment overrides, server loader, and CI validation

### Quick Reference

| Concern | File / Location | Purpose |
|---------|---------------|---------|
| Runtime secrets | `.env` (ignored) | Database credentials, API keys, production-only secrets |
| Shared/client config | `config/shared/base.json` + `config/shared/{dev,prod}.json` | API endpoints, scrambler seeds, client-side configuration (use minimal per-env overrides)
| Server config | `config/server/base.json` + `config/server/{dev,prod}.json` | Port defaults, feature flags, server runtime settings

### Key Principles

1. Secrets go to `.env`. Do not commit secrets into JSON files.
2. Keep `base.json` authoritative; per-env files should only list values that change.
3. The server performs runtime validation (Zod) of merged configs and fails fast on invalid shapes.
4. The client uses Angular `fileReplacements` to supply environment-specific overrides at build time; we avoid bundling Zod into the client.

See [Config.md](Config.md) for detailed examples and the CI validation approach.