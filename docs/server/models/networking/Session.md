# Session

A **Session** represents a single connected player on the server.  
It manages the player's WebSocket connection, current room (if any), and authentication state.


## Overview

- Created by [`SessionManager`](/src/server/managers/SessionManager.ts)
  when a new WebSocket connection is established by [`WSServer`](/src/server/core/WSServer.ts).
- Stored in a global `sessions` map for efficient lookup and management.
- Responsible for:
  - Managing the player's socket lifecycle (disconnect, reconnect, destroy).
  - Tracking the player's current room.
  - Routing inbound packet data to the correct handler (system or match).
  - Updating activity timestamps for cleanup and inactivity logic.


## Lifecycle

- **Creation:**  
  When a client connects, a new `Session` is created and added to the manager.
- **Inactivity:**  
  If no packets are received for 30 seconds, the socket is disconnected.
- **Reconnection:**  
  The player may reconnect within 2 minutes to resume their session.
- **Destruction:**  
  If not reconnected within 2 minutes, the session is destroyed and removed from the manager.
  If the player is in a room, they will be removed from it, which may trigger lifecycle updates.


## Packet Handling

### Data Listener

The session attaches a `dataListener` to its [`ServerSocket`](/src/server/models/ServerSocket.ts)
upon creation or reconnection.  
This function receives every decoded packet from the client and is responsible for:
- Routing system actions to the system handler.
- Routing match actions to the room's handler (if the session is in a room).
- Updating the session's `lastActiveTime` for socket inactivity tracking.
- Disconnecting the session if the packet is invalid or cannot be handled.

You can pipe socket data into the session's listener using:
```ts
this.socketInstance.setListener(this.dataListener.bind(this));
```

### Forwarding

The `forward` method allows the server to send data to the client associated with this session.


## Example Flow

1. Client connects via WebSocket.
2. `WSServer` creates a `ServerSocket` and associates it with the session.
3. `SessionManager` creates a new `Session` and stores it.
4. Session listens for incoming packets and routes them appropriately.
5. If inactive, session is disconnected and eventually destroyed.
