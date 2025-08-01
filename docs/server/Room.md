# Room

A **Room** is the core unit of a multiplayer match on the server.  
It encapsulates the game state, manages participants, and routes all match-related packets.

## Overview

Rooms are created by [`RoomManager`](/src/server/managers/RoomManager.ts) when a new match is formed.  
Each room is assigned a unique `roomID` and maintains references to all participating sessions.  
Rooms are responsible for handling game logic, broadcasting updates, and cleaning up when the match ends.

## Creation and Lifecycle

### Room Creation

When a match is found, `RoomManager.createRoom()` instantiates a new RoomModel and assigns it a unique ID.  
Sessions are added to the room using `addPlayers`, which updates the participant and player maps.

### Player Management

Players (sessions) join a room via `addPlayers`.  
When a player disconnects or leaves, the `removeSession` should be called. 
This updates the room state and may trigger additional lifecycle events within the room.

### Cleanup and Closure

Rooms are periodically checked by `RoomManager` for inactivity.  
If all participants leave, the room is removed from the manager.  
The `close()` method forcibly ends the room, clearing all participants and game state.

## Packet Routing

### Handling Match Packets

Each room has its own `roomDataHandler` instance,
instantiated from [`MatchHandler`](/src/server/handlers/match/index.ts).
It routes incoming match actions to the correct game logic (gameplay, lifecycle, protocol, etc.).

```ts
// In RoomModel
public handlePacket(session: SessionModel, packet: AugmentAction<MatchActions>) {
  this.roomDataHandler.handleData(session, packet);
}
```

### Broadcasting

Rooms frequently need to send updates to all or selected participants,
such as when a game state changes due to player actions or random lifecycle events.
The `broadcast` method allows sending the same packet to all relevant sessions.

To specify which sessions to broadcast to, you can configure the `options` parameter:

```ts
export type BroadcastFilter = "all" | Array<UUID>;

type BroadcastOptions = Partial<{
  to: BroadcastFilter;
  exclude: Set<UUID>;
}>
```

Note that `to` is an array while `exclude` is a set.

Example usage to reject a player action:
```ts
room.broadcast(ProtocolActions.REJECT_ACTION, {
  actionID: 3,
  boardHash: 694208
}, { to: [uuid1] });
```


# RoomManager

The **RoomManager** orchestrates the creation, tracking, and cleanup of all active rooms.

## Overview

RoomManager maintains a global map of active rooms, keyed by `roomID`.  
It is responsible for generating unique room IDs, adding/removing rooms, and periodic cleanup.

## Room Lifecycle

Use `createRoom()` to instantiate a new room and add it to the manager.

RoomManager runs a cleanup interval (default: every 10 minutes) to remove rooms with no participants.

The `close()` method stops the cleanup timer and removes all rooms from the manager.

## Example Use Cases

To create a new room and add players:
```ts
const roomManager = new RoomManager();
const room = roomManager.createRoom();
room.addPlayers([session1, session2]);
```
