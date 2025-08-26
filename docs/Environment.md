# Environment Configuration

This project uses environment-specific configuration files to manage different deployment scenarios.

## Environment Files

| File | Purpose | Tracked in Git |
|------|---------|----------------|
| `.env` | Default fallback values | ✅ Yes |
| `.env.development` | Development environment | ✅ Yes |
| `.env.production` | Production environment | ✅ Yes |
| `.env.local` | Local overrides (any environment) / Sensitive Info | ❌ No |
| `.env.*.local` | Environment-specific local overrides | ❌ No |

## Loading Precedence

Environment variables are loaded in this order (highest precedence wins):

1. `.env.[environment].local` (e.g., `.env.development.local`)
2. `.env.local`
3. `.env.[environment]` (e.g., `.env.development`)
4. `.env`

## Variable Types

### Client Variables (Angular)
- **Prefix**: `NG_APP_*`
- **Scope**: Injected into the browser bundle at build time
- **Example**: `NG_APP_WEBSOCKET_URL=ws://localhost:8745/ws`

### Shared Variables
- **Prefix**: `NG_APP_*`
- **Scope**: Available to both Angular client (injected at build time) and Node.js server (runtime)
- **Example**: `NG_APP_PACKET_SCRAMBLER_SEED=my-shared-seed`

### Server Variables (Node.js)
- **Prefix**: No prefix required
- **Scope**: Available only in Node.js runtime
- **Example**: `BACKEND_PORT=8745`

## Setup for Development

1. **Copy example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your local values**:
   ```bash
   # .env.local
   NG_APP_WEBSOCKET_URL=ws://localhost:8745/ws
   NG_APP_PACKET_SCRAMBLER_SEED=your-local-dev-seed
   BACKEND_PORT=8745
   ```

3. **Validate configuration**:
   ```bash
   npm run validate-env development
   ```

## Usage by Environment

### Development
```bash
# Start development servers
npm run dev

# Environment loaded: .env.development + .env.local + .env.development.local
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Environment loaded: .env.production + .env.local + .env.production.local
```

## Environment Variables Reference

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| `NG_APP_WEBSOCKET_URL` | Client | WebSocket server URL for the client | ✅ |
| `NG_APP_PACKET_SCRAMBLER_SEED` | Shared | Seed for packet scrambling (client & server) | ❌ |
| `BACKEND_PORT` | Server | Port for the HTTP/WebSocket server | ✅ |

## Deployment Notes

### Development
- Uses HTTP and unencrypted WebSocket (`ws://`)
- Port 8745 to avoid conflicts with other services
- Scrambler seed for predictable development behavior

### Production
- Should use HTTPS and encrypted WebSocket (`wss://`)
- Standard port 8080 or behind a reverse proxy
- Strong scrambler seed for security

## Troubleshooting

### Client Variables Not Available
- Ensure variables start with `NG_APP_`
- Rebuild the Angular application after changing client variables
- Check browser dev tools → Sources → webpack → environment for injected values

### Shared Variables
- Shared variables use `NG_APP_` prefix and are available to both client and server
- The same seed value is used for packet scrambling on both sides
- Changes require rebuilding the client and restarting the server
