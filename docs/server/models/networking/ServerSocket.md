# ServerSocket

Path: [src/server/models/networking/ServerSocket.ts](/src/server/models/networking/ServerSocket.ts)

The ServerSocket class is a wrapper around Node.js's `ws` WebSocket implementation,
providing automatic packet encoding/decoding functionality.
It is platform-specific and cannot be used on the browser (client-side).

## Overview

ServerSocket abstracts the low-level WebSocket operations and integrates with the
shared packet systemto provide a clean interface for sending and receiving typed actions.
It handles binary packet encoding/decoding automatically using the PacketIO utility.

## Features

- **Automatic Packet Encoding/Decoding**: Converts between action objects and binary packets
- **Type-Safe Communication**: Uses TypeScript generics for action type safety
- **Error Handling**: Gracefully handles malformed packets and connection errors
- **Connection Management**: Provides proxy methods for WebSocket state management

## API Reference

### Constructor

Creates a new ServerSocket wrapper around an existing WebSocket connection.

**Example**
```typescript
this.wss.on('connection', ws => {
  // ws is from the ws library, not native
  const socket = new ServerSocket(ws);
});
```

### Methods

#### `send<GenericAction extends ActionEnum>(action, data)`

Sends a typed action as a binary packet to the client.

**Parameters:**
- `action`: The action type enum value
- `data`: The action payload matching the action type

**Example:**
```typescript
socket.send(ProtocolActions.PING, { serverTime: Date.now(), clientPing: 50 });
```

#### `setListener(handler)`

Attaches a packet handler that receives all incoming decoded packets.

**Parameters:**
- `handler`: Function that receives decoded action objects

**Features:**
- Automatically removes existing listeners to prevent duplicates
- Only processes binary messages (closes connection for text messages)
- Handles decode errors gracefully without crashing

**Example:**
```typescript
socket.setListener((action) => {
  switch (action.type) {
    case ProtocolActions.PONG:
      handlePong(action.payload);
      break;
    // ... other actions
  }
});
```

#### `close()`

Closes the WebSocket connection and removes all event listeners.

**Features:**
- Safely removes all listeners before closing
- Only attempts to close if the socket is in OPEN state
- Cleans up resources properly

#### `readyState` (getter)

Returns the current WebSocket ready state.

**Returns:** WebSocket ready state constant (CONNECTING, OPEN, CLOSING, CLOSED)

## Usage Patterns

### Basic Server Setup

```typescript
import WebSocket from 'ws';
import ServerSocket from './ServerSocket';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  const serverSocket = new ServerSocket(ws);
  
  serverSocket.setListener((action) => {
    // Handle incoming actions
    console.log('Received action:', action.type);
  });
  
  // Send welcome message
  serverSocket.send(ProtocolActions.WELCOME, { message: 'Connected!' });
});
```

### Error Handling

The ServerSocket automatically handles common error scenarios:

- **Malformed Packets**: Decode errors are caught and ignored
- **Text Messages**: Non-binary messages trigger connection closure
- **Connection State**: Only sends/closes when appropriate

### Resource Management

Always ensure proper cleanup:

```typescript
// In session cleanup
socket.close(); // Removes listeners and closes connection
```

## Implementation Notes

### Packet Format

ServerSocket uses the shared PacketIO system for binary serialization:
- All packets are binary (ArrayBuffer)
- Text messages are rejected and close the connection
- Encoding/decoding is handled transparently

### Memory Management

- Event listeners are properly cleaned up on close
- Buffer slicing ensures proper ArrayBuffer handling for different data types
- No memory leaks from duplicate listeners (automatically removed)

### Error Recovery

The socket handles decode errors silently to prevent DoS attacks from malformed packets. Consider adding logging in production environments for monitoring.

## Testing

ServerSocket includes comprehensive unit tests covering:
- Packet encoding/decoding
- Event listener management
- Error handling scenarios
- Connection state management
- Resource cleanup

See [`ServerSocket.spec.ts`](/src/server/models/networking/ServerSocket.spec.ts) for detailed test coverage.