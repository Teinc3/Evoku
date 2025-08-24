# PendingPingStore

The `PendingPingStore` class manages pending ping timestamps for PONG validation security. It prevents replay attacks and manages cleanup of old ping data.

## Overview

PendingPingStore provides security for the ping-pong synchronization protocol by tracking serverTime values sent to clients and validating incoming PONG responses. This prevents clients from replaying old PONG responses or spoofing arbitrary serverTime values.

## Security Model

### Replay Attack Prevention

The store tracks every serverTime sent in PING packets:

1. **Track**: `addPendingPing()` stores serverTime when PING is sent
2. **Validate**: `validateAndConsumePing()` checks incoming PONG serverTime
3. **Consume**: Valid PONG responses are removed (single-use)
4. **Reject**: Subsequent PONGs with same serverTime are invalid

### Circuit Breaker for Laggy Connections

The store uses a circuit breaker approach:

```typescript
static readonly MAX_PENDING_PINGS = 10
```

When a player reaches the maximum pending ping limit, new pings are not sent to that player. This prevents:
- Memory exhaustion from laggy mobile connections
- Network congestion from ping spam to unresponsive clients  
- Connection breakdown during long lagspikes (10+ seconds)

**Key Benefits:**
- Accommodates extreme mobile network conditions
- Maintains synchronization for responsive players
- Automatic recovery when laggy player starts responding

## Core API

### Ping Tracking

```typescript
addPendingPing(playerID: number, serverTime: number): void
```
Records a new pending ping for the specified player. Automatically enforces maximum count limits to serve as a circuit breaker.

**Cleanup Behavior:**
- Enforces `MAX_PENDING_PINGS` limit (drops oldest)
- No age-based cleanup (accommodates long mobile lagspikes)
- Serves as circuit breaker for laggy connections

```typescript
canReceivePing(playerID: number): boolean
```
Checks if a player can receive new pings (not at the pending limit). Used by PingCoordinator as a circuit breaker.

### PONG Validation

```typescript
validateAndConsumePing(playerID: number, serverTime: number): boolean
```
Validates incoming PONG response and consumes the pending ping if valid.

**Returns:**
- `true`: Valid serverTime found and consumed
- `false`: No matching pending ping (replay attempt or invalid)

### Query Interface

```typescript
getLastPingTime(playerID: number): number | undefined
```
Returns the most recent unconsumed ping timestamp for a player.

**Use Cases:**
- Anti-spam interval checking
- Debugging and monitoring
- Rate limiting decisions

## Configuration

```typescript
static readonly MAX_PENDING_PINGS = 10     // Circuit breaker threshold
```

## Implementation Details

### Storage Structure

Uses a Map of player ID to serverTime arrays:

```typescript
private pendingPings = new Map<number, number[]>();
```

**Benefits:**
- O(1) player lookup
- Array preserves chronological order
- Efficient cleanup from array ends

### Size-Based Circuit Breaker

```typescript
// Enforce maximum pending size (drop oldest) to prevent memory exhaustion
while (pending.length > PendingPingStore.MAX_PENDING_PINGS) {
  pending.shift();
}
```

Prevents memory exhaustion and serves as a circuit breaker for laggy connections.

### PONG Consumption

```typescript
const index = pending.indexOf(serverTime);
if (index === -1) {
  return false; // Server time not found
}
pending.splice(index, 1); // Remove consumed ping
return true;
```

**Key Points:**
- Allows out-of-order PONG responses
- Single-use: each ping can only be consumed once
- Preserves other pending pings

## Security Considerations

### Attack Mitigation

**Replay Attacks**: Prevented by single-use consumption
- Attacker cannot reuse captured PONG responses
- Each serverTime can only validate once

**Flooding**: Limited by max pending count and circuit breaker
- Prevents memory exhaustion from ping spam
- Stops sending new pings to unresponsive clients
- Automatic recovery when client starts responding

**Spoofing**: Requires knowledge of recent serverTime
- Attacker must know exact serverTime values sent
- Age limits reduce window of opportunity

### Timing Windows

The system balances security with mobile network realities:
- No age limits accommodate extreme lagspikes (10+ seconds)
- Circuit breaker prevents resource exhaustion
- Out-of-order tolerance for packet reordering
- Immediate consumption prevents replay races

## Integration Points

### PingCoordinator Integration

```typescript
// Check circuit breaker before sending
if (!this.pendingPings.canReceivePing(playerID)) {
  continue; // Skip laggy player
}

// Track ping when sending
this.pendingPings.addPendingPing(playerID, serverTime);

// Check last ping for anti-spam
const lastPing = this.pendingPings.getLastPingTime(playerID);
```

### TimeService Integration

```typescript
// Validate incoming PONG
if (!this.pendingPings.validateAndConsumePing(playerID, originalServerTime)) {
  console.warn(`Player ${playerID} sent PONG with invalid serverTime`);
  return;
}
```

## Cleanup and Lifecycle

### Player Removal

```typescript
removePlayer(playerID: number): void
```
Removes all pending pings for a player when they disconnect.

### Service Shutdown

```typescript
clear(): void
```
Clears all pending pings during service shutdown.

## Error Scenarios

The store handles various error conditions gracefully:

- **Missing Player**: Returns `false` for validation, `undefined` for queries
- **Empty Pending**: Returns `false` for validation, `undefined` for queries  
- **Invalid ServerTime**: Returns `false` for validation
- **Stale Pings**: Automatically cleaned up during normal operation

## Testing Considerations

- **Deterministic**: Uses game time for age calculations
- **Mockable**: No external dependencies
- **Isolated**: Pure data structure operations

## See Also

- [TimeService](./TimeService.md) - Main coordination facade
- [PingCoordinator](./PingCoordinator.md) - Ping scheduling and sending
- [SyncProfile](./SyncProfile.md) - Per-player synchronization data
- [ActionValidator](./ActionValidator.md) - Timing validation
