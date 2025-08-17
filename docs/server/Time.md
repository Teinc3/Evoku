# Time Synchronization System

This document describes Evoku's time synchronization system used to maintain accurate timing
between clients and server for anti-cheat validation and smooth gameplay.

## Overview

The TimeService coordinates client-server time synchronization using a ping–pong protocol, 
with drift detection, rate-limiting, and anti-spam measures.
It provides timing validation for player actions while remaining separate from game-specific cooldown logic.

The system operates on player sessions rather than players directly,
as sessions can disconnect and reconnect while the player remains in the game.

## Modular Architecture

The system is implemented as a set of focused components:

- `TimeService` (src/server/game/time/index.ts): a facade coordinating the subsystems and exposing the public API
- `SyncProfile` (src/server/models/networking/SyncProfile.ts): per-player synchronization data and conversions  
- `PendingPingStore.ts`: pending ping storage and PONG validation (replay protection)
- `PingCoordinator.ts`: global ping scheduling and sending
- `ActionValidator.ts`: action timing validation and action history management

### File structure

```
src/server/game/time/
├── index.ts              # Main TimeService facade
├── PendingPingStore.ts   # PONG validation security
├── PingCoordinator.ts    # Ping scheduling and sending
└── ActionValidator.ts    # Timing validation and action history

src/server/models/networking/
└── SyncProfile.ts        # Per-player time synchronization
```

## Component Responsibilities

- TimeService (Facade)
  - Provides a stable public API
  - Coordinates the components and lifecycle (add/remove session, start/stop)
  - Maintains backward compatibility by re-exporting important constants

- SyncProfile (src/server/models/networking/SyncProfile.ts)
  - Stores per-player sync data (offset, RTT, samples)
  - Computes median offset for noise resilience
  - Converts between client and server time
  - Computes cumulative drift since first sync
  - See [SyncProfile.md](./SyncProfile.md) for detailed documentation

- PendingPingStore
  - Tracks pending serverTime values sent to clients
  - Validates and consumes PONG responses to prevent replay
  - Removes old pings by age and enforces max stored count

- PingCoordinator
  - Manages a single global ping interval for all sessions
  - Ensures a minimum interval between pings to the same player (anti-simultaneous ping)
  - Sends immediate pings for reconnecting players when appropriate

- ActionValidator
  - Enforces monotonic client timestamps
  - Implements rate limiting (e.g., 5 actions within 500ms)
  - Maintains per-player action history (capped)
  - Checks cumulative drift against a configured threshold

## Time Synchronization Protocol

1. PingCoordinator sends a PING (serverTime) to a session.
2. Client returns PONG containing the serverTime and the client's timestamp.
3. PendingPingStore validates the incoming PONG serverTime (prevent replay).
4. SyncProfile is updated with the measured offset and RTT; median filtering reduces jitter.
5. ActionValidator uses SyncProfile to validate action timings (monotonicity, rate limits, drift).

## API Reference

### Core Methods

```typescript
// Add player session to time synchronization
addPlayerSession(playerID: number): void

// Remove player session from time synchronization
removePlayerSession(playerID: number): void

// Initialize ping service (called when game starts)
startPingService(): void

// Handle client PONG response
handlePong(playerID: number, clientTime: number, originalServerTime: number): void

// Validate action timing (sync-only)
assessTiming(playerID: number, clientTime: number): number

// Commit successful action
updateLastActionTime(playerID: number, action: PlayerActions, clientTime: number): number

// Get current ping (RTT) for a player
getPlayerPing(playerID: number): number

// Stop the ping service and clean up
close(): void
```

### Return Values

The `assessTiming()` method returns:
- **Non-Negative Integer**: Estimated server time (action valid)
- **`TimeValidationReason.NO_SYNC_PROFILE`**: No synchronization data available  
- **`TimeValidationReason.MONOTONIC_VIOLATION`**: Non-monotonic client timestamp
- **`TimeValidationReason.RATE_LIMIT`**: Rate limit exceeded
- **`TimeValidationReason.DRIFT_EXCEEDED`**: Cumulative drift threshold exceeded

### TimeValidationReason Enum

```typescript
enum TimeValidationReason {
  NO_SYNC_PROFILE = -1,    // No established synchronization profile
  MONOTONIC_VIOLATION = -2, // Client timestamp not monotonically increasing  
  RATE_LIMIT = -3,         // Rate limit for actions exceeded
  DRIFT_EXCEEDED = -4      // Cumulative delta drift exceeded threshold
}
```

## Configuration Constants

Key configuration values are re-exported by the facade for backward compatibility:

- PING_INTERVAL = 2000 (ms)
- PING_SAMPLE_SIZE = 5
- MAX_PENDING_PINGS = 10
- MAX_PING_AGE = 10000 (ms)
- MIN_PING_INTERVAL = 500 (ms)
- MIN_ACTION_INTERVAL = { actions: 5, interval: 500 } (ms)
- MAX_CUMULATIVE_DRIFT = 50 (ms)
- MAX_ACTION_HISTORY_COUNT = 30

## Integration Example

Typical usage from game logic:

1. Validate synchronization and estimate server time:

```ts
const estServerTime = timeService.assessTiming(playerID, clientTime);
if (estServerTime < 0) {
  // handle validation error
}
```

2. Apply game logic using the estimated server time and on success commit the action:

```ts
const success = gameState.performAction(action, estServerTime);
if (success) {
  const serverTime = timeService.updateLastActionTime(playerID, action, clientTime);
}
```

## Security Considerations

- Server time is authoritative for all game decisions.
- PendingPingStore prevents replay and simple spoofing of serverTime values.
- Median filtering in SyncProfile reduces impact from transient jitter.
- Multiple validation layers make timestamp manipulation and spam difficult to exploit.

## Performance Characteristics

- Memory:
  - O(sessions) for SyncProfile instances;
  - O(actions) per player bounded by MAX_ACTION_HISTORY_COUNT;
  - O(pending) bounded per player.
- Network: a single global ping tick reduces timer overhead; 
per-player pings remain frequent enough for accurate sync but are rate-limited.
- Complexity: median calculation is trivial for small sample sizes; action checks operate on bounded windows.

## Testing

- `timeservice.spec.ts` tests the facade end-to-end (ping/pong path, validation, timing conversions).
- Individual components can be unit-tested independently (recommended for future work).

## File Reference / Quick Links

- `src/server/game/time/index.ts` — facade (TimeService)
- `src/server/models/networking/SyncProfile.ts` — per-player state ([docs](./SyncProfile.md))
- `src/server/game/time/PendingPingStore.ts` — pong validation
- `src/server/game/time/PingCoordinator.ts` — ping scheduling
- `src/server/game/time/ActionValidator.ts` — action validation

## Notes

- TimeService uses globalThis.performance.now() to ensure Jest fake timers advance server time in tests.
Avoid importing node:perf_hooks.performance directly in code that needs to be testable with Jest timers.
