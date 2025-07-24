# Server Architecture

This document outlines the file structure for the Evoku game server. Each directory and file has a specific, single responsibility to ensure the codebase is modular and scalable.

## File Structure

```
src/server/
├── core/
│   ├── HTTPServer.ts
│   └── WSServer.ts
├── game/
│   ├── logic/
│   │   └── index.ts
│   └── matchmaking/
│       └── index.ts
├── managers/
│   ├── SessionManager.ts
│   └── RoomManager.ts
├── handlers/
│   ├── GameplayHandler.ts
│   ├── LifecycleHandler.ts
│   └── index.ts
├── models/
│   ├── Session.ts
│   ├── Room.ts
│   └── ServerSocket.ts
├── types/
└── index.ts
```

## Directory Structure

- index.ts: The main entry point for the server. It initializes and orchestrates the HTTPServer and WSServer.

### /core

Contains the foundational components for running the application.

- HTTPServer.ts: Manages the Express.js application and handles all standard HTTP API/routing requests.

- WSServer.ts: Manages the WebSocket server, attaching to the HTTP server and handling raw WebSocket connections.

### /game

Contains all logic related to managing game state.

#### /logic

- index.ts: Contains the pure, state-agnostic game rules and logic (e.g., how to calculate scores, validate a move).

#### /matchmaking

- index.ts: Manages the queue of players waiting for a game and is responsible for creating new rooms when a match is found.

### /managers

- SessionManager.ts: The single source of truth for all active player sessions. Creates, manages, and destroys Session objects.

- RoomManager.ts: Manages the lifecycle of all active game rooms. Creates, tracks, and destroys Room objects.

### /models

Contains data models that represent the state of the certain objects in the game.

- Session.ts: Represents a single connected player, wrapping their WebSocket connection and holding their state (e.g., nickname, online status, current room).

- Room.ts: Represents a single game instance, containing the game state and the list of players in the match.

- ServerSocket.ts: A wrapper around the WebSocket connection that automatically encodes/decodes packets into Data Contracts.
It provides methods to send and receive packets, ensuring type safety.

### /handlers

- GameplayHandler.ts: Processes packets related to in-game actions (e.g., SET_CELL, USE_POWERUP).

- LifecycleHandler.ts: Processes packets related to the player's journey outside of a match (e.g., JOIN_QUEUE, LEAVE_QUEUE).

- index.ts: Exports the main DataHandler (or PacketRouter), which receives all packets and delegates them to the appropriate specialized handler.