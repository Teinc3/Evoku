# SyncProfile

`SyncProfile` is a model class that manages time synchronization data for a single player session.
It handles offset calculation, RTT (Round Trip Time) tracking, and client-server time conversion.

## Overview

Each player session has its own `SyncProfile` instance that:
- Tracks the time offset between client and server clocks
- Maintains RTT measurements for latency awareness
- Uses median filtering to reduce network jitter impact
- Provides time conversion utilities between client and server time domains
- Calculates cumulative drift to detect clock discrepancies

## Location

**File:** `src/server/game/time/SyncProfile.ts`

**Category:** Networking Model - represents per-session synchronization state

## Key Properties

- **Offset**: The time difference between client and server clocks
- **RTT**: Round-trip time for ping-pong communication
- **Offset Samples**: Historical offset measurements for median filtering
- **Initial Sync Data**: Baseline measurements from first synchronization
- **Last Updated**: Timestamp of most recent synchronization update

## API Reference

### Constructor

```typescript
constructor(initialServerTime: number)
```

Creates a new sync profile with the given initial server time.

### Core Methods

```typescript
// Update synchronization data with new ping response
updateFromPong(offset: number, rtt: number, clientTime: number, serverTime: number): void

// Convert client time to server time
clientToServerTime(clientTime: number): number

// Convert server time to client time  
serverToClientTime(serverTime: number): number

// Calculate cumulative drift from initial synchronization
calculateCumulativeDrift(currentClientTime: number, currentServerTime: number): number

// Get current RTT
getRtt(): number

// Check if initial sync has been established
hasInitialSync(): boolean

// Get the underlying data (for compatibility)
getData(): PlayerTimeData
```

## Configuration

```typescript
static readonly PING_SAMPLE_SIZE = 5
```

The number of offset samples maintained for median filtering.

## Time Conversion

SyncProfile provides bidirectional time conversion:

- **Client → Server**: `clientTime - offset`
- **Server → Client**: `serverTime + offset`

The offset is calculated as: `clientTime - (serverTime + oneWayDelay)`

## Median Filtering

To reduce the impact of network jitter and transient latency spikes,
SyncProfile maintains a rolling window of the last 5 offset measurements
and uses the median value as the current offset.
This provides better stability than using the most recent measurement alone.

## Drift Detection

The `calculateCumulativeDrift()` method computes how much the client and server clocks
have drifted apart since the initial synchronization:

```typescript
const clientElapsed = currentClientTime - initialClientTime;
const serverElapsed = currentServerTime - initialServerTime;
return clientElapsed - serverElapsed;
```

Large drift values may indicate:
- Clock speed differences between client and server
- Systematic timing issues
- Potential timing manipulation attempts

## Integration

SyncProfile is used by:
- **TimeCoordinator**: Creates and manages SyncProfile instances per player session
- **ActionValidator**: Uses time conversion methods for validation
- **PingCoordinator**: Updates profiles with ping-pong response data

## Security Considerations

- Offset calculations use server-authoritative timing
- Median filtering reduces impact of spoofed latency measurements
- Drift detection helps identify potential timing exploits
- All time conversions assume server time is the authoritative source


