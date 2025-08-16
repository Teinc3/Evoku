# Time Synchronization System

This document outlines the time synchronization system used in Evoku to maintain accurate timing between clients and server for anti-cheat validation and smooth gameplay.

## Overview

The TimeService manages client-server time synchronization using a ping-pong protocol with drift detection and anti-spam measures. It provides timing validation for player actions while remaining separate from game-specific cooldown logic.

The system operates on player sessions rather than players directly, as sessions can disconnect and reconnect while the player remains in the game.

## Architecture

The time synchronization system consists of:

- **TimeService**: Core synchronization and validation logic
- **Ping-Pong Protocol**: Establishes and maintains time offset measurements with individual intervals per session
- **Action Timing Validation**: Prevents timing exploits and ensures fair gameplay
- **Monotonic Time Enforcement**: Ensures logical consistency in action ordering

## Key Components

### Time Synchronization Protocol

The system uses individual ping-pong exchanges for each player session to maintain accurate time synchronization:

1. **Server sends PING**: Individual intervals per session (every 2 seconds) with current server timestamp
2. **Client responds PONG**: Returns server timestamp + client timestamp  
3. **Server calculates offset**: Determines time difference and network latency
4. **Median filtering**: Uses last 5 samples to reduce noise from network jitter

### Session Management

Player sessions are managed independently with immediate ping synchronization:
- **Session Addition**: Immediately sends initial ping when game is initialized
- **Individual Intervals**: Each session has its own ping interval for optimal timing
- **Graceful Reconnection**: New sessions receive immediate sync without waiting for global interval

### Validation Layers

The TimeService provides multiple validation layers for incoming actions:

#### 1. Sync Data Validation
- Ensures player session has established time synchronization
- Returns `TimeValidationReason.NO_SYNC_PROFILE` if no sync data exists

#### 2. Monotonic Client Time
- Prevents replay attacks by requiring increasing client timestamps
- Returns `TimeValidationReason.MONOTONIC_VIOLATION` if client time is not monotonic

#### 3. Rate Limiting  
- Prevents spam by limiting actions to 5 per 500ms window
- Returns `TimeValidationReason.RATE_LIMIT` if rate limit exceeded

#### 4. Cumulative Drift Detection
- Detects clients with inconsistent time progression
- Returns `TimeValidationReason.DRIFT_EXCEEDED` if drift exceeds 50ms over match lifecycle

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

// Time conversion utilities
clientToServerTime(playerID: number, clientTime: number): number
serverToClientTime(playerID: number, serverTime: number): number
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

## Configuration

### Time Constants

```typescript
MAX_CUMULATIVE_DRIFT = 50        // Maximum allowed drift (ms)
MAX_ACTION_HISTORY_COUNT = 30    // Actions to retain per player
PING_INTERVAL = 2000            // Ping frequency (ms)
PING_SAMPLE_SIZE = 5            // Samples for median filtering
MIN_ACTION_INTERVAL = {
  actions: 5,                   // Maximum actions
  interval: 500                 // Within timeframe (ms)
}
```

## Integration with Game Logic

The TimeService focuses solely on client-server synchronization. Game-specific timing (cooldowns, durations) is handled by game state models:

```typescript
// 1. Validate synchronization
const estServerTime = timeService.assessTiming(playerID, clientTime);
if (estServerTime < 0) {
  return { result: false }; // Sync failure
}

// 2. Apply game logic with estimated time
const success = gameState.performAction(action, estServerTime);
if (!success) {
  return { result: false }; // Game rule failure (e.g., cooldown)
}

// 3. Commit action if both validations pass
const serverTime = timeService.updateLastActionTime(playerID, action, clientTime);
```

## Security Considerations

### Anti-Cheat Measures

- **Monotonic enforcement**: Prevents replay attacks
- **Drift detection**: Identifies time manipulation attempts  
- **Rate limiting**: Prevents action spam/flooding
- **Median filtering**: Reduces impact of network manipulation

### Timing Attack Prevention

- Server time is authoritative for all game decisions
- Client timestamps used only for validation, not game logic
- Estimated server time includes anti-regression safeguards
- Network latency variations handled gracefully

## Performance Characteristics

### Memory Usage
- O(sessions) for synchronization data
- O(actions) for recent action history (capped at 30 per session)
- Individual ping intervals per session for optimal timing
- Automatic cleanup when sessions disconnect

### Network Overhead
- 2-second ping interval per session (individual timing)
- Immediate ping on session addition after game initialization
- Minimal payload (timestamps only)
- No additional synchronization during normal gameplay

### Computational Complexity
- O(1) for most timing operations
- O(log n) for median calculation (n = 5 samples)
- O(k) for rate limit checking (k = recent actions, max 5)

## Monitoring and Debugging

### Key Metrics
- Player ping/RTT values
- Cumulative drift measurements
- Rate limit violations per player
- Sync establishment success rate

### Common Issues
- **High ping**: Affects time conversion accuracy
- **Clock drift**: Client/server time divergence over long sessions  
- **Network jitter**: Causes temporary sync accuracy reduction
- **Malicious clients**: Trigger validation failures and get rejected
