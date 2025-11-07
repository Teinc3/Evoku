# Time Synchronization System

This directory contains documentation for Evoku's time synchronization system, which maintains accurate timing between clients and server for anti-cheat validation and smooth gameplay.

## Overview

The time synchronization system uses a ping-pong protocol with robust validation against timing exploits. It operates on player sessions rather than players directly, allowing sessions to disconnect and reconnect while preserving timing state.

## Component Documentation

### [TimeCoordinator](./TimeCoordinator.md)
The main facade coordinating time synchronization. Provides a stable public API and delegates to specialized components.

**Key Responsibilities:**
- Session lifecycle management
- Public API coordination  
- Component integration
- Backward compatibility

### [PingCoordinator](./PingCoordinator.md)
Manages ping scheduling and sending for time synchronization.

**Key Responsibilities:**
- Global ping interval management
- Immediate pings for reconnections
- Anti-spam protection
- Session integration

### [PendingPingStore](./PendingPingStore.md)  
Provides PONG validation security and prevents replay attacks.

**Key Responsibilities:**
- Pending ping tracking
- PONG response validation
- Replay attack prevention
- Automatic cleanup

### [ActionValidator](./ActionValidator.md)
Validates action timing and maintains action history for anti-cheat purposes.

**Key Responsibilities:**
- Monotonic timestamp validation
- Rate limiting enforcement
- Drift detection
- Action history management

### [SyncProfile](./SyncProfile.md)
Per-player time synchronization data and conversions.

**Key Responsibilities:**
- Offset and RTT tracking
- Time conversion between client/server
- Drift calculation
- Noise filtering

## Quick Start

### Basic Integration

```typescript
// 1. Create service
const timeService = new TimeCoordinator(room);

// 2. Start when game initializes  
timeService.start();

// 3. Add player sessions
timeService.addPlayerSession(playerID);

// 4. Validate actions
const estServerTime = timeService.assessTiming(playerID, clientTime);
if (estServerTime >= 0) {
  // Apply game logic
  const serverTime = timeService.updateLastActionTime(playerID, action, clientTime);
}

// 5. Handle PONG responses
timeService.handlePong(playerID, clientTime, originalServerTime);
```

### Error Handling

```typescript
const result = timeService.assessTiming(playerID, clientTime);
switch (result) {
  case TimeValidationReason.NO_SYNC_PROFILE:
    // No sync data yet, may need to wait for PONG
    break;
  case TimeValidationReason.MONOTONIC_VIOLATION: 
    // Client timestamp went backwards - potential cheating
    break;
  case TimeValidationReason.RATE_LIMIT:
    // Too many actions too quickly - spam protection
    break;
  case TimeValidationReason.DRIFT_EXCEEDED:
    // Clock drift too large - potential manipulation
    break;
  default:
    // Valid - result is estimated server time
    const serverTime = result;
}
```

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐     ┌─────────────────┐
│ Game Logic  │────│ TimeCoordinator  │─────│ PingCoordinator │
└─────────────┘    │   (Facade)   │     └─────────────────┘
                   └──────────────┘              │
                          │                      │
                          │                      ▼
                   ┌───────────────┐    ┌─────────────────┐
                   │ActionValidator│    │PendingPingStore │  
                   └───────────────┘    └─────────────────┘
                          │
                          │
                   ┌──────────────┐
                   │ SyncProfile  │
                   │ (per player) │
                   └──────────────┘
```

## Configuration Reference

| Constant | Value | Purpose |
|----------|-------|---------|
| `PING_INTERVAL` | 2000ms | Global ping frequency |
| `MIN_PING_INTERVAL` | 500ms | Anti-spam protection |
| `MAX_PENDING_PINGS` | 10 | Circuit breaker threshold |
| `PING_SAMPLE_SIZE` | 5 | RTT median sample size |
| `MAX_ACTION_HISTORY_COUNT` | 30 | Action history limit |
| `MAX_CUMULATIVE_DRIFT` | 50ms | Drift detection threshold |
| `MIN_ACTION_INTERVAL` | 5 actions/500ms | Rate limiting |

## Security Features

- **Replay Protection**: PendingPingStore prevents PONG replay attacks
- **Monotonic Validation**: ActionValidator ensures timestamps never go backwards  
- **Rate Limiting**: Prevents action spam attacks
- **Drift Detection**: Catches clock manipulation attempts
- **Circuit Breaker**: Stops pinging laggy players to prevent resource exhaustion
- **Server Authority**: Server time is authoritative for all decisions

## Testing Notes

- Uses `globalThis.performance.now()` for Jest fake timer compatibility
- Avoid importing `node:perf_hooks.performance` in testable code
- Comprehensive coverage in `timeservice.spec.ts`

## File Structure

```
src/server/game/time/
├── index.ts              # TimeCoordinator facade
├── PingCoordinator.ts    # Ping scheduling  
├── PendingPingStore.ts   # PONG validation
└── ActionValidator.ts    # Timing validation

src/server/models/networking/
└── SyncProfile.ts        # Per-player sync data
```
