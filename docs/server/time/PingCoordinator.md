# PingCoordinator

The `PingCoordinator` class manages ping scheduling and sending for time synchronization. It coordinates between regular interval pings and immediate pings for reconnecting players.

## Overview

PingCoordinator handles the timing and delivery of PING packets to maintain accurate client-server time synchronization. It operates a single global interval for all players while preventing ping spam through minimum interval enforcement.

## Architecture

The coordinator manages:
- A single global ping interval for all active sessions
- Immediate ping capability for reconnecting players  
- Anti-spam protection via minimum ping intervals
- Integration with room session management

## Core API

### Service Lifecycle

```typescript
startPingService(): void
```
Starts the global ping service with immediate ping to existing sessions, then establishes regular interval.

```typescript
stop(): void
```
Stops the global ping interval and cleans up resources.

### Immediate Pings

```typescript
sendImmediatePing(playerID: number): void
```
Sends immediate ping to specific player (typically for reconnections). Respects game initialization state and minimum interval constraints.

## Configuration

```typescript
static readonly PING_INTERVAL = 2000      // ms - Global ping interval
static readonly MIN_PING_INTERVAL = 500   // ms - Does not send pings more frequently than this
```

## Implementation Details

### Global Ping Strategy

Uses a single `setInterval` for all players rather than per-player intervals:

```typescript
this.globalPingInterval = setInterval(() => {
  this.performGlobalPing();
}, PingCoordinator.PING_INTERVAL);
```

**Benefits:**
- Reduced timer overhead
- Synchronized ping timing across players
- Simplified cleanup and management

### Anti-Spam Protection

Prevents sending pings too frequently to the same player:

```typescript
const lastPing = this.pendingPings.getLastPingTime(playerID);
if (lastPing && currentServerTime - lastPing < PingCoordinator.MIN_PING_INTERVAL) {
  continue; // Skip this player, continue with others
}
```

**Key Points:**
- Checks against unconsumed pending pings to determine last ping time
- Allows immediate pings to bypass interval if minimum time has passed

### Ping Delivery

The coordinator integrates with the room system to deliver pings:

```typescript
private sendPingToPlayer(playerID: number, serverTime: number): void {
  const sessionUUID = this.room.getSessionIDFromPlayerID(playerID);
  const session = this.room.participants.get(sessionUUID);
  
  // Track for PONG validation
  this.pendingPings.addPendingPing(playerID, serverTime);
  
  // Send PING with current RTT
  const clientPing = syncProfile?.getRtt() ?? 0;
  session.forward(ProtocolActions.PING, {
    serverTime,
    clientPing
  });
}
```

## Integration Points

### Dependencies

- **RoomModel**: Session lookup and packet delivery
- **SyncProfile Map**: Active player tracking and RTT data
- **PendingPingStore**: Ping tracking for PONG validation
- **Server Time Function**: Monotonic time source
- **Game State Function**: Initialization check

### Initialization Timing

Pings are only sent after game initialization:

```typescript
if (!this.isGameInitialised()) {
  return; // Don't send pings before game initialization
}
```

This prevents premature synchronization attempts before the game state is ready.

## Timing Behavior

### Startup Sequence

1. `startPingService()` called when game initializes
2. Immediate ping sent to all existing player sessions
3. Regular interval established for ongoing pings

### Regular Operation

- Global ping every 2000ms to all active players
- Individual players may be skipped if within 500ms minimum interval
- Immediate pings for reconnecting players (subject to minimum interval)

### Session Lifecycle

- New sessions receive immediate ping when added (if game initialized)
- Removed sessions automatically excluded from future pings
- No explicit cleanup needed per player

## Security Considerations

- Minimum interval prevents ping flooding
- Server time is authoritative in all ping content
- Integration with PendingPingStore ensures replay protection
- Session validation prevents pings to invalid/disconnected players

## Error Handling

The coordinator gracefully handles:
- Missing player sessions (returns early)
- Disconnected sessions (returns early)  
- Uninitialized game state (returns early)
- Missing sync profiles (uses default RTT of 0)

## Testing Considerations

- Uses constructor-injected dependencies for testability
- Global interval can be controlled via Jest fake timers
- Server time function can be mocked for predictable timing
- Room and session state can be mocked for isolation

## See Also

- [TimeService](./TimeService.md) - Main coordination facade
- [PendingPingStore](./PendingPingStore.md) - Ping tracking and validation
- [SyncProfile](./SyncProfile.md) - Per-player synchronization data
- [ActionValidator](./ActionValidator.md) - Timing validation
