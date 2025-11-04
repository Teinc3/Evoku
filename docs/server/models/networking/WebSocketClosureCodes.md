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

| Code | Name | Description |
|------|------|-------------|
| 4000 | AUTH_TIMEOUT | Authentication timeout |
| 4001 | AUTH_FAILED | Invalid authentication credentials |
| 4002 | AUTH_TOKEN_EXPIRED | Authentication token expired |
| 4003 | AUTH_QUEUE_OVERFLOW | Pre-auth packet queue exceeded |
| 4004 | INVALID_PACKET | Invalid or malformed packet |
| 4005 | RATE_LIMIT_EXCEEDED | Too many requests sent |
| 4006 | VERSION_MISMATCH | Client version incompatible |
| 4007 | SERVER_SHUTDOWN | Server shutting down gracefully |
| 4008 | DUPLICATE_SESSION | Logged in from another location |

## Server Usage

### Basic Disconnection

```typescript
// Normal closure
session.disconnect(true, WSCloseCode.NORMAL_CLOSURE);

// With specific code (reason strings should not be used - code is self-explanatory)
session.disconnect(true, WSCloseCode.AUTH_FAILED);
```

### Common Scenarios

```typescript
// Authentication timeout
session.disconnect(true, WSCloseCode.AUTH_TIMEOUT);

// Invalid packet received
session.disconnect(true, WSCloseCode.INVALID_PACKET);

// Queue overflow
session.disconnect(true, WSCloseCode.AUTH_QUEUE_OVERFLOW);
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
```

### Helper Methods

#### `getMessage(code: number, serverReason?: string): string`
Returns a user-friendly error message for the given closure code.

## Best Practices

### Server-Side
- Always provide a meaningful close code
- The close code should be self-explanatory; avoid redundant reason strings
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
### Server: Authentication Timeout
```typescript
private startAuthTimeout(): void {
  this.authTimeout = setTimeout(() => {
    if (!this.authenticated) {
      this.disconnect(true, WSCloseCode.AUTH_TIMEOUT);
    }
  }, AUTH_TIMEOUT_MS);
}
```

### Server: Invalid Packet
```typescript
if (!isValidPacket(data)) {
  session.disconnect(true, WSCloseCode.INVALID_PACKET);
}
```

### Client: Handle Disconnection
```typescript
wsService.setDisconnectCallback((code, reason) => {
  const message = WSCloseMessageMapper.getMessage(code, reason);
  
  // Application decides whether to reconnect based on business logic
  showError(`Disconnected: ${message}`);
});
```

## See Also

- [RFC 6455 - WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [ServerSocket Documentation](./ServerSocket.md)
- [Session Documentation](./Session.md)
