# TimeService

The `TimeService` class acts as the main facade coordinating time synchronization between clients and server. It provides a stable public API and delegates to specialized components for specific functionality.

## Overview

TimeService manages time synchronization for player sessions using a ping-pong protocol with robust validation against timing exploits. It maintains smooth gameplay while providing anti-cheat protection through monotonic validation, rate limiting, and drift detection.

The service operates on player sessions rather than players directly, allowing sessions to disconnect and reconnect while preserving player state.

## Architecture

TimeService is implemented as a coordinating facade that delegates to:
- [`SyncProfile`](./SyncProfile.md): Per-player time synchronization data
- [`PendingPingStore`](./PendingPingStore.md): PONG validation security  
- [`PingCoordinator`](./PingCoordinator.md): Ping scheduling and sending
- [`ActionValidator`](./ActionValidator.md): Timing validation and action history

## Core API

### Session Management

```typescript
addPlayerSession(playerID: number): void
```
Adds a new player session to time synchronization. Creates a SyncProfile and sends immediate ping if game is initialized.

```typescript
removePlayerSession(playerID: number): void  
```
Removes player session and cleans up all associated data across all components.

### Service Lifecycle

```typescript
start(): void
```
Initializes the service and starts the global ping coordinator. Sets the game start time baseline.

```typescript
close(): void
```
Stops ping service and cleans up all resources.

### Time Synchronization Protocol

```typescript
handlePong(playerID: number, clientTime: number, originalServerTime: number): void
```
Processes PONG responses from clients. Validates against pending pings and updates sync profiles with measured offset and RTT.

### Action Validation

```typescript
assessTiming(playerID: number, clientTime: number): number
```
Validates action timing against sync-only rules (no gameplay cooldowns).

**Returns:**
- Non-negative integer: Estimated server time (valid)
- Negative value: TimeValidationReason error code

```typescript
updateLastActionTime(playerID: number, action: PlayerActions, clientTime: number): number
```
Commits successful action to history and returns current server time for broadcasting.

### Utility Methods

```typescript
getPlayerPing(playerID: number): number
```
Returns current RTT for a player (0 if no sync profile exists).

```typescript
estimateServerTime(playerID: number, clientTime: number): number
```
Estimates server time for given client time, clamped to be monotonic per player.

## Configuration Constants

The service re-exports important constants for backward compatibility:

```typescript
static readonly MAX_ACTION_HISTORY_COUNT = ActionValidator.MAX_ACTION_HISTORY_COUNT;
static readonly PING_INTERVAL = PingCoordinator.PING_INTERVAL;
static readonly MAX_PING_AGE = PendingPingStore.MAX_PING_AGE;
```

## Integration Example

Typical usage pattern from game logic:

```typescript
// 1. Validate timing and get estimated server time
const estServerTime = timeService.assessTiming(playerID, clientTime);
if (estServerTime < 0) {
  // Handle validation error (TimeValidationReason)
  return;
}

// 2. Apply game logic using estimated server time
const success = gameState.performAction(action, estServerTime);
if (!success) {
  return; // Game logic rejected action
}

// 3. Commit action on success
const serverTime = timeService.updateLastActionTime(playerID, action, clientTime);
broadcastAction(action, serverTime);
```

## Error Handling

`assessTiming()` returns negative values for validation failures:

- `TimeValidationReason.NO_SYNC_PROFILE (-1)`: No synchronization data available
- `TimeValidationReason.MONOTONIC_VIOLATION (-2)`: Non-monotonic client timestamp
- `TimeValidationReason.RATE_LIMIT (-3)`: Rate limit exceeded  
- `TimeValidationReason.DRIFT_EXCEEDED (-4)`: Cumulative drift threshold exceeded

## Internal Implementation

### Server Time Calculation

Server time is monotonic and starts from 0 at game initialization:

```typescript
private getServerTime(): number {
  return Math.floor(globalThis.performance.now()) - this.startTimeMs;
}
```

Uses `globalThis.performance.now()` for Jest fake timer compatibility in tests.

### Component Coordination

TimeService creates and coordinates the specialized components:

```typescript
constructor(room: RoomModel) {
  this.pingCoordinator = new PingCoordinator(
    room,
    this.syncProfiles,
    this.pendingPings,
    () => this.getServerTime(),
    () => this.hasInitialised
  );
}
```

## Security Considerations

- Server time is authoritative for all game decisions
- Ping validation prevents replay attacks via PendingPingStore
- Multiple validation layers make exploitation difficult
- Median filtering in SyncProfile reduces jitter impact

## Testing Notes

- Uses `globalThis.performance.now()` for Jest fake timer support
- Avoid importing `node:perf_hooks.performance` in testable code
- Comprehensive test coverage in `timeservice.spec.ts`

## See Also

- [PingCoordinator](./PingCoordinator.md) - Ping scheduling and sending
- [ActionValidator](./ActionValidator.md) - Timing validation and history
- [PendingPingStore](./PendingPingStore.md) - PONG validation security
- [SyncProfile](./SyncProfile.md) - Per-player synchronization data
