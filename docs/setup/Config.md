# Configuration System

Non-secret configuration lives in version-controlled JSON; secrets live only in `.env` (ignored). Shared utilities receive configuration via dependency injection.

## Files
| File | Purpose |
|------|---------|
| `config/server.json` | Server default / non-secret runtime config |
| `config/client.json` | Client + shared config bundled into frontend |

## Usage
```ts
import serverConfig from '../../config/server.json' with { type: 'json' };
import clientConfig from '../../config/client.json' with { type: 'json' };
```

Client configuration is frozen and injected:
```ts
export const AppConfig = deepFreeze(configData);
export const APP_CONFIG = new InjectionToken<AppConfigType>('app.config');
```

## Adding Values
1. Secret? Add placeholder to `.env.example`, read via `process.env` in server bootstrap.
2. Shared non-secret? Add to `config/client.json` and use via DI.
3. Server-only non-secret? Add to `config/server.json`.
4. Inject into consumers—no deep JSON imports inside generic libraries.

## Migration Notes
Legacy env vars (`BACKEND_PORT`, `NG_APP_PACKET_SCRAMBLER_SEED`, `NG_APP_WEBSOCKET_URL`) replaced by JSON config.

## Future Enhancements
* Schema (zod) validation for JSON at startup.
* Build-time environment overlays if ever required.