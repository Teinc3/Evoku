# Client Packet Handling - Event Broadcasting Architecture

## Overview

The client-side packet handling has been refactored to use a simple, event-driven architecture based on RxJS Subjects. When packets are received and decoded via `PacketIO`, they are immediately broadcasted to subscribed components using RxJS observables.

## Architecture

### WebSocketService

The `WebSocketService` now contains an RxJS `Subject` that broadcasts all incoming packets:

```typescript
private readonly packetSubject = new Subject<{
  action: ActionEnum;
  data: ActionMap[ActionEnum];
}>();
```

### NetworkService (Angular)

The `NetworkService` provides convenient methods for Angular components to subscribe to packets:

- `getPacketStream()`: Subscribe to all packet events
- `onPacket<T>(action)`: Subscribe to packets of a specific action type

## Usage in Components

### Subscribe to Specific Packet Types

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import NetworkService from '../services/network.service';
import LobbyActions from '@shared/types/enums/actions/system/lobby';

@Component({
  selector: 'app-lobby',
  // ...
})
export class LobbyComponent implements OnInit, OnDestroy {
  private networkService = inject(NetworkService);
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Subscribe to QUEUE_UPDATE packets
    const queueSub = this.networkService
      .onPacket(LobbyActions.QUEUE_UPDATE)
      .subscribe(data => {
        console.log('Queue updated:', data.inQueue);
        // Update component state
      });

    // Subscribe to MATCH_FOUND packets
    const matchSub = this.networkService
      .onPacket(LobbyActions.MATCH_FOUND)
      .subscribe(data => {
        console.log('Match found!', data.myID, data.players);
        // Navigate to match screen
      });

    this.subscriptions.push(queueSub, matchSub);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### Subscribe to All Packets

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import NetworkService from '../services/network.service';

@Component({
  selector: 'app-debug',
  // ...
})
export class DebugComponent implements OnInit, OnDestroy {
  private networkService = inject(NetworkService);
  private subscription?: Subscription;

  ngOnInit() {
    // Subscribe to all packet events
    this.subscription = this.networkService
      .getPacketStream()
      .subscribe(packet => {
        console.log('Received packet:', packet.action, packet.data);
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### Using RxJS Operators for Advanced Filtering

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import NetworkService from '../services/network.service';
import SessionActions from '@shared/types/enums/actions/system/session';

@Component({
  selector: 'app-game',
  // ...
})
export class GameComponent implements OnInit, OnDestroy {
  private networkService = inject(NetworkService);
  private subscription?: Subscription;

  ngOnInit() {
    // Use RxJS operators to filter and transform packets
    this.subscription = this.networkService
      .getPacketStream()
      .pipe(
        filter(packet => packet.action === SessionActions.HEARTBEAT),
        map(packet => packet.data)
      )
      .subscribe(data => {
        console.log('Heartbeat received');
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

## Data Structure

### Incoming Packets

When a packet is received, it is decoded and broadcasted with the following structure:

```typescript
{
  action: ActionEnum,  // The packet ID/action type
  data: ActionMap[GenericAction]  // The contract data (no 'action' field)
}
```

**Note**: The data object is bound directly to the contract, without the extra `action` attribute (i.e., not `AugmentAction`).

### Example

For a `QUEUE_UPDATE` packet:

```typescript
// Broadcasted packet structure
{
  action: LobbyActions.QUEUE_UPDATE,
  data: {
    inQueue: true  // QueueUpdateContract
  }
}
```

When subscribing with `onPacket()`, you only receive the data portion:

```typescript
networkService.onPacket(LobbyActions.QUEUE_UPDATE).subscribe(data => {
  // data: { inQueue: boolean }
  console.log(data.inQueue);
});
```

## Benefits

1. **Simplicity**: No complex handler hierarchy to manage
2. **Type Safety**: Full TypeScript type inference for packet data
3. **Angular Integration**: Works seamlessly with Angular's dependency injection
4. **Reactive**: Leverages RxJS for powerful stream composition
5. **Performance**: Eliminates unnecessary abstraction layers
6. **Flexibility**: Components subscribe only to packets they care about

## Migration from Old Handlers

Previously, packet handlers were organized in a hierarchy:
- `ClientPacketHandler` → `UnionHandler` → `EnumHandler` → specific handlers

Now, components subscribe directly to packets:

**Before:**
```typescript
// Handler classes would process packets
class LobbyHandler extends EnumHandler<LobbyActions> {
  private handleQueueUpdate(data: AugmentAction<LobbyActions.QUEUE_UPDATE>) {
    // Handle packet
  }
}
```

**After:**
```typescript
// Components subscribe directly
this.networkService.onPacket(LobbyActions.QUEUE_UPDATE).subscribe(data => {
  // Handle packet - data is typed as QueueUpdateContract
});
```
