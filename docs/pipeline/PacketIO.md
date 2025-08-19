# PacketIO

**Path:** `src/shared/networking/utils/PacketIO.ts`

PacketIO is the core serialization utility that handles encoding and decoding of game packets
between binary format and TypeScript objects. It provides type-safe packet transformation
using the codec system and packet registry.

## Overview

PacketIO serves as the primary interface for packet serialization, providing:
- **Type-Safe Encoding:** Converts TypeScript objects to binary packets
- **Reliable Decoding:** Transforms binary data back to typed objects  
- **Registry Integration:** Uses PacketRegistry for packet type resolution
- **Codec Coordination:** Leverages the codec system for data transformation

## Core Responsibilities

### Packet Encoding
- **Object to Binary:** Converts typed data contracts to binary format
- **Action Resolution:** Maps action enums to appropriate packet types
- **Buffer Generation:** Produces ArrayBuffer for network transmission
- **Type Safety:** Ensures compile-time type checking for packet data

### Packet Decoding  
- **Binary to Object:** Reconstructs typed objects from binary data
- **Action Extraction:** Identifies packet type from binary header
- **Data Validation:** Ensures packet structure matches expected format
- **Error Handling:** Graceful handling of malformed packets

### System Integration
- **Registry Coordination:** Uses PacketRegistry for packet type mapping
- **Codec System:** Integrates with codec hierarchy for data transformation
- **Buffer Management:** Efficient binary data handling via PacketBuffer

## API Reference

### Constructor
```typescript
constructor()
```

Creates a new PacketIO instance for packet serialization operations.

**Note:** Currently no configuration parameters, but designed for future security module integration.

### Encoding

#### encodePacket<GenericAction, GenericContract>(action, dataContract): ArrayBuffer
Encodes a typed data contract into binary packet format.

**Type Parameters:**
- `GenericAction extends ActionEnum` - The action type identifier
- `GenericContract extends ActionMap[GenericAction]` - The data contract type

**Parameters:**
- `action` - Action enum identifying the packet type
- `dataContract` - Typed data object matching the action's contract

**Returns:** `ArrayBuffer` containing the serialized packet

**Example:**
```typescript
const packetIO = new PacketIO();

// Encode a PING packet
const pingData = {
  serverTime: Date.now(),
  clientPing: 45
};

const buffer = packetIO.encodePacket(ProtocolActions.PING, pingData);
// buffer: ArrayBuffer ready for network transmission
```

**Process:**
1. **Registry Lookup:** Resolve packet class from action enum
2. **Packet Creation:** Instantiate packet with action and data
3. **Serialization:** Convert packet to binary via wrap() method
4. **Buffer Extraction:** Return raw ArrayBuffer for transmission

### Decoding

#### decodePacket(buffer: ArrayBuffer): PacketData
Decodes a binary packet back into a typed object structure.

**Parameters:**
- `buffer` - ArrayBuffer containing the serialized packet

**Returns:** Decoded packet data object with `type` and `payload` properties

**Example:**
```typescript
const packetIO = new PacketIO();

// Decode received binary data
const receivedBuffer = new ArrayBuffer(64); // From network
const packet = packetIO.decodePacket(receivedBuffer);

// packet.type: ActionEnum (e.g., ProtocolActions.PONG)
// packet.payload: Typed data (e.g., { clientTime: number, serverTime: number })
```

**Process:**
1. **Buffer Setup:** Create PacketBuffer wrapper for binary data
2. **Action Extraction:** Use ActionCodec to read packet type header
3. **Registry Lookup:** Resolve packet class from extracted action
4. **Deserialization:** Use packet's unwrap() method to decode data
5. **Object Return:** Provide typed result object

## Type Safety

### Generic Constraints
PacketIO enforces type safety through generic constraints:

```typescript
encodePacket<
  GenericAction extends ActionEnum,
  GenericContract extends ActionMap[GenericAction]
>(action: GenericAction, dataContract: GenericContract)
```

This ensures:
- **Action Validity:** Only valid action enums accepted
- **Contract Matching:** Data must match the action's expected structure
- **Compile-Time Checking:** TypeScript validates packet structure

### ActionMap Integration
```typescript
// Example ActionMap structure
interface ActionMap {
  [ProtocolActions.PING]: { serverTime: number; clientPing: number };
  [ProtocolActions.PONG]: { clientTime: number; serverTime: number };
  [MechanicsActions.SET_CELL]: { clientTime: number; cellIndex: number; value: number };
}
```

## Error Handling

### Encoding Errors
```typescript
// Registry lookup failure
if (!Packet) {
  throw new Error(`No packet registered for action: ${action}`);
}
```

**Common Causes:**
- **Unregistered Actions:** Action not present in PacketRegistry
- **Invalid Data:** Data contract doesn't match packet expectations
- **Codec Failures:** Underlying codec encoding errors

### Decoding Errors
```typescript
// Registry lookup failure during decode
if (!Packet) {
  throw new Error(`No packet registered for action: ${action}`);
}
```

**Common Causes:**
- **Corrupted Data:** Binary buffer contains invalid packet structure
- **Unknown Actions:** Action header references unregistered packet type
- **Codec Failures:** Underlying codec decoding errors
- **Buffer Issues:** Insufficient data or malformed binary structure

## Buffer Management

### PacketBuffer Integration
PacketIO uses PacketBuffer for efficient binary operations:

```typescript
// Encoding: Create buffer and populate
const buffer = new Packet({ action, ...dataContract }).wrap().buffer;

// Decoding: Wrap ArrayBuffer for reading
const packetBuffer = new PacketBuffer(buffer.byteLength);
packetBuffer.write(buffer);
```

### Memory Efficiency
- **Direct Buffer Access:** Minimal copying during serialization
- **Streaming Operations:** PacketBuffer provides efficient read/write
- **Index Management:** Automatic position tracking for sequential operations

## Registry Coordination

### Packet Resolution
```typescript
// Get packet class from registry
const Packet = PacketRegistry.getPacket(action);
if (!Packet) {
  throw new Error(`No packet registered for action: ${action}`);
}
```

### Instantiation Patterns
```typescript
// Encoding: Create packet instance with data
const packet = new Packet({ action, ...dataContract });

// Decoding: Create empty packet for unwrapping
const packet = new Packet();
```

## Security Considerations

### Future Security Integration
The class is designed for future security module integration:

```typescript
// Commented code shows planned security features
// import type { SecurityModule } from "../security/SecurityModule";

// private security?: SecurityModule;
// constructor(security?: SecurityModule) {
//   this.security = security;
// }

// Encryption/Decryption hooks
// if (this.security) {
//   buffer = this.security.encrypt(buffer);
//   dataBuffer = this.security.decrypt(buffer);
// }
```

### Current Security Posture
- **Input Validation:** Registry checks prevent unknown packet types
- **Type Safety:** Compile-time validation reduces runtime errors
- **Error Boundaries:** Graceful handling of malformed packets



## Testing Considerations

### Unit Test Coverage
- **Encoding Scenarios:** Valid and invalid packet encoding
- **Decoding Scenarios:** Binary packet reconstruction testing
- **Error Cases:** Registry failures and malformed data handling
- **Type Safety:** Compile-time type checking validation
- **Round-Trip:** Encode→decode consistency verification

### Mock Dependencies
- **PacketRegistry:** Mock packet type resolution
- **Packet Classes:** Mock packet wrap/unwrap operations  
- **ActionCodec:** Mock action header encoding/decoding

### Test Patterns
```typescript
describe('PacketIO', () => {
  it('should encode valid packets to binary');
  it('should decode binary packets to objects');
  it('should throw on unregistered actions');
  it('should handle malformed binary data');
  it('should maintain type safety');
});
```

## Integration Patterns

### ServerSocket Integration
```typescript
// Server-side usage
class ServerSocket {
  private packetIO = new PacketIO();
  
  send(action: ActionEnum, data: any) {
    const buffer = this.packetIO.encodePacket(action, data);
    this.websocket.send(buffer);
  }
  
  setListener(handler: (packet: any) => void) {
    this.websocket.on('message', (buffer, isBinary) => {
      const packet = this.packetIO.decodePacket(buffer);
      handler(packet);
    });
  }
}
```

### Client Integration
```typescript
// Client-side usage (similar pattern)
class ClientSocket {
  private packetIO = new PacketIO();
  
  // Similar encode/decode operations for client-server communication
}
```

## Future Extensions

### Security Module Integration
- **Encryption:** Automatic packet encryption before transmission
- **Authentication:** Packet signing and verification
- **Compression:** Binary data compression for bandwidth optimization

### Protocol Evolution
- **Version Negotiation:** Support for multiple packet format versions
- **Compression:** Optional packet compression for large payloads
- **Fragmentation:** Support for packets larger than MTU limits
