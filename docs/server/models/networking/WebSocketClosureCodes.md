# WebSocket Closure Codes Protocol

## Overview

The Evoku WebSocket protocol implements a standardized set of closure codes
to provide meaningful feedback to clients when connections are terminated.
These codes help distinguish between normal disconnections, network issues,
authentication failures, and other error conditions.

## Code Ranges

The protocol uses two ranges of closure codes:

### Standard Codes (1000-1999)
These codes follow the
[RFC 6455 specification](https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1)
and represent general WebSocket closure scenarios.

### Custom Application Codes (4000-4999)
These are Evoku-specific codes that represent application-level
disconnection reasons.

## Standard Codes

| Code | Name | Description |
|------|------|-------------|
| 1000 | NORMAL_CLOSURE | Connection successfully completed its purpose |
| 1001 | GOING_AWAY | Server failure or browser navigation |
| 1002 | PROTOCOL_ERROR | Protocol error occurred |
| 1003 | UNSUPPORTED_DATA | Received data of unsupported type |
| 1005 | NO_STATUS_RECEIVED | No status code was provided |
| 1006 | ABNORMAL_CLOSURE | Connection closed without close frame |
| 1007 | INVALID_FRAME_PAYLOAD | Message contained inconsistent data |
| 1008 | POLICY_VIOLATION | Message violates policy |
| 1009 | MESSAGE_TOO_BIG | Message too large to process |
| 1010 | MANDATORY_EXTENSION | Client expected server to negotiate extensions |
| 1011 | INTERNAL_ERROR | Server encountered unexpected condition |
| 1012 | SERVICE_RESTART | Server is restarting |
| 1013 | TRY_AGAIN_LATER | Server temporarily unavailable |
| 1014 | BAD_GATEWAY | Invalid response from upstream server |
| 1015 | TLS_HANDSHAKE_FAILED | TLS handshake failure |

## Custom Application Codes

| Code | Name | Description | Reconnect? |
|------|------|-------------|------------|
| 4000 | AUTH_TIMEOUT | Authentication timeout | Yes |
| 4001 | AUTH_FAILED | Invalid authentication credentials | No |
| 4002 | AUTH_TOKEN_EXPIRED | Authentication token expired | Yes |
| 4003 | INVALID_PACKET | Invalid or malformed packet | No |
| 4004 | RATE_LIMIT_EXCEEDED | Too many requests sent | No |
| 4005 | VERSION_MISMATCH | Client version incompatible | No |
| 4006 | QUEUE_OVERFLOW | Pre-auth packet queue exceeded | No |
| 4007 | SERVER_SHUTDOWN | Server shutting down gracefully | Yes |
| 4008 | KICKED | Kicked by admin/moderator | No |
| 4009 | BANNED | Account banned | No |
| 4010 | DUPLICATE_SESSION | Logged in from another location | No |

## Server Usage

### Basic Disconnection

```typescript
// Normal closure
session.disconnect(true, WSCloseCode.NORMAL_CLOSURE);

// With reason
session.disconnect(true, WSCloseCode.AUTH_FAILED, 'Invalid token');
```

### Common Scenarios

```typescript
// Authentication timeout
session.disconnect(true, WSCloseCode.AUTH_TIMEOUT, 'Authentication timeout');

// Invalid packet received
session.disconnect(true, WSCloseCode.INVALID_PACKET, 'Invalid packet');

// Queue overflow
session.disconnect(
  true,
  WSCloseCode.QUEUE_OVERFLOW,
  'Pre-auth packet queue overflow'
);
```

## Client Usage

### Receiving Closure Codes

```typescript
// Set disconnect callback
wsService.setDisconnectCallback((code: number, reason: string) => {
  console.log(`Disconnected: ${code} - ${reason}`);
});
```

### Message Mapping

The `WSCloseMessageMapper` utility provides user-friendly messages:

```typescript
import WSCloseMessageMapper from '@client/app/utils/ws-close-message-mapper';

// Get user-friendly message
const message = WSCloseMessageMapper.getMessage(code, reason);

// Check if reconnection is recommended
if (WSCloseMessageMapper.shouldReconnect(code)) {
  // Attempt to reconnect
}

// Check error type
if (WSCloseMessageMapper.isClientError(code)) {
  // Handle client-side error
} else if (WSCloseMessageMapper.isServerError(code)) {
  // Handle server-side error
}
```

### Helper Methods

#### `getMessage(code: number, serverReason?: string): string`
Returns a user-friendly error message for the given closure code.

#### `isClientError(code: number): boolean`
Returns `true` if the code indicates a client-side issue (4000-4999 range).

#### `isServerError(code: number): boolean`
Returns `true` if the code indicates a server-side issue.

#### `shouldReconnect(code: number): boolean`
Returns `true` if the client should attempt to reconnect after this closure.

## Best Practices

### Server-Side
- Always provide a meaningful close code
- Include a reason string for custom codes
- Use the most specific code available for the error condition

### Client-Side
- Display user-friendly messages using `WSCloseMessageMapper`
- Implement automatic reconnection for transient failures
- Log closure codes for debugging purposes

## Examples

### Server: Authentication Timeout
```typescript
private startAuthTimeout(): void {
  this.authTimeout = setTimeout(() => {
    if (!this.authenticated) {
      this.disconnect(true, WSCloseCode.AUTH_TIMEOUT, 'Authentication timeout');
    }
  }, AUTH_TIMEOUT_MS);
}
```

### Server: Invalid Packet
```typescript
if (!isValidPacket(data)) {
  session.disconnect(true, WSCloseCode.INVALID_PACKET, 'Invalid packet format');
}
```

### Client: Handle Disconnection
```typescript
wsService.setDisconnectCallback((code, reason) => {
  const message = WSCloseMessageMapper.getMessage(code, reason);
  
  if (WSCloseMessageMapper.shouldReconnect(code)) {
    showNotification(`Connection lost: ${message}. Reconnecting...`);
    scheduleReconnect();
  } else {
    showError(`Disconnected: ${message}`);
  }
});
```

## See Also

- [RFC 6455 - WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [ServerSocket Documentation](./ServerSocket.md)
- [Session Documentation](./Session.md)
