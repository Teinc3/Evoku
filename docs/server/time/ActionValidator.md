# ActionValidator

The `ActionValidator` class validates action timing and maintains action history for anti-cheat purposes. It handles monotonic validation, rate limiting, and drift detection.

## Overview

ActionValidator provides the core timing validation logic for player actions. It enforces strict timing rules to prevent cheating while maintaining smooth gameplay experience. The validator operates independently of game-specific cooldowns, focusing purely on timing security.

## Validation Pipeline

The validator implements a multi-layer validation approach:

1. **Monotonic Validation**: Ensures client timestamps always increase
2. **Rate Limiting**: Prevents action spam within short time windows  
3. **Drift Detection**: Detects excessive time drift that may indicate manipulation
4. **History Management**: Maintains bounded action history per player

## Core API

### Primary Validation

```typescript
assessTiming(
  playerID: number,
  clientTime: number, 
  currentServerTime: number,
  syncProfile: SyncProfile | undefined,
  fallbackServerTime: number
): number
```

Validates action timing against all security rules.

**Returns:**
- Non-negative integer: Estimated server time (valid)
- Negative value: `TimeValidationReason` error code

**Validation Sequence:**
1. Check for sync profile existence
2. Validate monotonic client time increase
3. Check rate limiting rules
4. Validate cumulative drift (if sync established)
5. Return estimated server time if all checks pass

### Server Time Estimation

```typescript
estimateServerTime(
  playerID: number,
  clientTime: number,
  syncProfile: SyncProfile | undefined, 
  fallbackServerTime: number
): number
```

Estimates server time for given client time with monotonic clamping.

**Clamping Behavior:**
- Uses sync profile conversion if available
- Falls back to provided server time if no sync
- Clamps to last action's server time (monotonic guarantee)
- Never returns negative values

### Action Commitment

```typescript
updateLastActionTime(
  playerID: number,
  action: PlayerActions,
  clientTime: number, 
  serverTime: number
): number
```

Commits successful action to history and returns server time for broadcasting.

**History Management:**
- Adds action with timestamps to player history
- Enforces `MAX_ACTION_HISTORY_COUNT` limit
- Removes oldest actions when limit exceeded

## Validation Rules

### Monotonic Validation

Ensures client timestamps strictly increase:

```typescript
if (clientTime <= lastAction.clientTime) {
  return TimeValidationReason.MONOTONIC_VIOLATION;
}
```

**Purpose**: Prevents timestamp manipulation and replay attacks
**Scope**: Per-player across all action types

### Rate Limiting

Prevents action spam within short time windows:

```typescript
static readonly MIN_ACTION_INTERVAL = {
  actions: 5,    // Maximum actions
  interval: 500  // Within time window (ms)
};
```

**Algorithm:**
1. Get last 5 actions from history
2. Filter actions within last 500ms (server time)
3. Reject if 5+ actions found in window

**Benefits:**
- Prevents automated spam attacks
- Allows burst actions for legitimate gameplay
- Uses server time for authoritative validation

### Drift Detection

Monitors cumulative time drift to detect manipulation:

```typescript
static readonly MAX_CUMULATIVE_DRIFT = 50; // ms
```

**Algorithm:**
1. Calculate cumulative drift via SyncProfile
2. Compare against threshold (50ms)
3. Reject if absolute drift exceeds limit

**Important**: Only applied after initial sync (PONG) is established

## Configuration Constants

```typescript
static readonly MAX_ACTION_HISTORY_COUNT = 30    // Per-player action limit
static readonly MAX_CUMULATIVE_DRIFT = 50        // ms - Drift threshold  
static readonly MIN_ACTION_INTERVAL = {          // Rate limiting
  actions: 5,
  interval: 500
}
```

## Implementation Details

### Action History Storage

```typescript
private playerActions = new Map<number, PlayerActionData[]>();
```

**Structure:**
```typescript
interface PlayerActionData {
  action: PlayerActions;
  clientTime: number;
  serverTime: number;
}
```

**Benefits:**
- Chronological ordering for monotonic checks
- Server time for rate limiting validation

### Monotonic Clamping

Server time estimates are clamped to ensure monotonic behavior:

```typescript
const lastActionServerTime = actionHistory?.length > 0 
  ? actionHistory[actionHistory.length - 1].serverTime 
  : 0;

return Math.max(estimated, lastActionServerTime, 0);
```

**Purpose**: Prevents server time from going backwards even if sync profile suggests it

### History Pruning

Action history is bounded:

```typescript
if (actionHistory.length > ActionValidator.MAX_ACTION_HISTORY_COUNT) {
  actionHistory.splice(0, actionHistory.length - ActionValidator.MAX_ACTION_HISTORY_COUNT);
}
```

**Strategy**: Remove oldest actions first (FIFO)

## Error Conditions

### TimeValidationReason Values

```typescript
enum TimeValidationReason {
  NO_SYNC_PROFILE = -1,     // No synchronization data available
  MONOTONIC_VIOLATION = -2, // Non-monotonic client timestamp  
  RATE_LIMIT = -3,          // Rate limit exceeded
  DRIFT_EXCEEDED = -4       // Cumulative drift threshold exceeded
}
```

### Error Handling Strategy

- **Early Return**: Validation stops at first failure
- **Detailed Errors**: Specific reason codes for different failures
- **State Preservation**: Failed actions don't modify history
- **Graceful Degradation**: Continues operation after individual failures

## Integration Points

### SyncProfile Integration

```typescript
// Drift calculation
const newCumulativeDrift = syncProfile.calculateCumulativeDrift(clientTime, currentServerTime);

// Time conversion  
const estimated = syncProfile.clientToServerTime(clientTime);
```

### TimeCoordinator Integration

```typescript
// Validation pathway
const result = this.actionValidator.assessTiming(playerID, clientTime, now, syncProfile, now);

// Commitment pathway
const serverTime = this.actionValidator.updateLastActionTime(playerID, action, clientTime, now);
```

## Security Analysis

### Attack Mitigation

**Timestamp Manipulation**: Monotonic validation prevents backdating
**Action Spam**: Rate limiting prevents automated flooding  
**Clock Drift Attacks**: Drift detection catches excessive time manipulation
**Replay Attacks**: Combined with PendingPingStore prevents action replay

### Timing Windows

- **Rate Limit Window**: 500ms provides burst tolerance
- **Drift Threshold**: 50ms accommodates network jitter

## Lifecycle Management

### Player Addition

No explicit initialization required - histories created on-demand.

### Player Removal

```typescript
removePlayer(playerID: number): void
```
Cleans up action history when player disconnects.

### Service Shutdown

```typescript
clear(): void  
```
Removes all action histories during service shutdown.

## Testing Considerations

- **Deterministic**: No external dependencies or randomness
- **Isolated**: Pure validation logic without side effects
- **Mockable**: Sync profile dependency can be mocked
- **Edge Cases**: Handles missing data and boundary conditions

## See Also

- [TimeCoordinator](./TimeCoordinator.md) - Main coordination facade
- [SyncProfile](./SyncProfile.md) - Time synchronization and drift calculation
- [PingCoordinator](./PingCoordinator.md) - Ping scheduling and sending  
- [PendingPingStore](./PendingPingStore.md) - PONG validation security
