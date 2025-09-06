# Setup & Configuration

Documentation for application configuration, environment setup, and deployment.

## Configuration System

The project uses a modern JSON-based configuration system with strict separation between secrets and non-secret configuration.

### Core Documentation

- **[Environment Variables](Environment.md)** - Runtime secrets and `.env` file usage
- **[Configuration System](Config.md)** - JSON configuration files, dependency injection, and TypeScript integration

### Quick Reference

| Concern | File | Purpose |
|---------|------|---------|
| Runtime secrets | `.env` (ignored) | Database credentials, API keys, production overrides |
| Server config | `config/server.json` | Port defaults, feature flags, non-secret server settings |
| Client + shared config | `config/client.json` | API endpoints, scrambler seeds, client-side configuration |

### Key Principles

1. **Secrets vs. Configuration** - Secrets in `.env` (ignored), everything else in versioned JSON
2. **Type Safety** - JSON imports provide full TypeScript typing via `resolveJsonModule`
3. **Dependency Injection** - Shared utilities receive configuration explicitly, no hidden globals
4. **Immutability** - Client configuration is frozen at bootstrap to prevent runtime mutations

### Migration Notes

This project recently migrated from a multi-file environment variable system to JSON-based configuration. Legacy environment variables (`BACKEND_PORT`, `NG_APP_PACKET_SCRAMBLER_SEED`, `NG_APP_WEBSOCKET_URL`) have been replaced by their JSON equivalents.

For detailed implementation examples and usage patterns, see [Config.md](Config.md).