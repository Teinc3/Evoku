# API Contract Documentation

## Overview

Each internal object handled through the Packet Pipeline has an
`action` property mapping to an Enum specifying what it handles.
This is used to route the object to the correct handler.
The Enums have a union type [`ActionType`](../src/shared/types/contracts/ActionType.ts).

The data contracts of these specific objects all extend the
[`IDataContract`](../src/shared/types/contracts/IDataContract.ts). The
generic type of such objects is referred to as `GenericContract` in the codebase.

## Contract Types

### Base Contracts

#### IDataContract
```ts
export default interface IDataContract {
    action: ActionType;
}
```
All contracts must extend this base interface.

#### PlayerActionContract
Base contract for ANY action taken by a player inside a game:
```ts
export default interface PlayerActionContract extends IDataContract {
    time: number;        // Timestamp when action occurred
    playerID: number;    // Player performing the action
}
```
This unified base contract covers all player actions - from game mechanics to power-ups to chat messages.

### Action Categories

Currently implemented action types:

#### Networking Actions
```ts
export enum Networking {
    PING,    // Client-server ping
    PONG     // Server response to ping
}
```

#### Game Mechanics
```ts
export enum Mechanics {
    SETCELL  // Set cell state in game
}
```

#### PUP Actions
```ts
export enum PUPActions {
    // Currently empty - for future power-up actions
}
```

## Contract Examples

### Simple Networking Contract
```ts
import { Networking } from "@shared/types/contracts/ActionType";

export default interface PingContract extends IDataContract {
    action: Networking.PING;
    clientTime: number;
    serverTime: number;
}
```

### Player Action Contract
```ts
import { Mechanics } from "@shared/types/contracts/ActionType";

export default interface SetCellContract extends PlayerActionContract {
    action: Mechanics.SETCELL;
    index: number;        // Cell position in game grid
    value: number;        // New cell value
}
```

## Packet Creation

### Basic Packet Factory
```ts
import { createPacket } from "@shared/networking/factory/PacketFactory";

const Ping = createPacket<PingContract>(Networking.PING, {
    clientTime: IntCodec,
    serverTime: IntCodec
});
```

### Player Action Packet Factory
For player action packets that share common fields:
```ts
import { createPlayerActionPacket } from "@shared/networking/factory/createPlayerActionPacket";

const SetCell = createPlayerActionPacket<SetCellContract>(
    Mechanics.SETCELL,
    {
        index: ShortCodec,
        value: ByteCodec
    }
);
```

## Codec Mapping

### Primitive Codecs
- `IntCodec` - 32-bit signed integer
- `ByteCodec` - 8-bit unsigned integer
- `ShortCodec` - 16-bit signed integer
- `BoolCodec` - Boolean value (0 or 1)
- `StringCodec` - UTF-8 string with length prefix
- `FloatCodec` - 32-bit floating point number

### Example Usage in Packets
```ts
const codecMap = {
    time: IntCodec,     // Number -> 32-bit int
    playerID: ByteCodec,     // Number -> 8-bit int
} as const;
```

## Packet Security

### ID Scrambling (Future Feature)
Packet IDs will be scrambled using a deterministic seed to slow down reverse engineering:
```ts
export enum Networking {
    PING = scrambleID(),  // Will generate obfuscated ID
    PONG = scrambleID(),
}
```

Currently using simple integer values. Scrambling implementation is planned.

## Network Protocol

### Packet Structure
```
[Action ID][Field 1][Field 2]...[Field N]
```

### Encoding Order
1. Action field (always first)
2. Contract fields in codec map order
3. Big-endian byte order for multi-byte values

### Example Wire Format
```
PingContract { action: Networking.PING, clientTime: 1234567890, serverTime: 0 }
│
├─ Action: [0x00, 0x00, 0x00, 0x00] (PING enum value as int8)
├─ clientTime: [0x49, 0x96, 0x02, 0xD2] (1234567890 as big-endian int32)
└─ serverTime: [0x00, 0x00, 0x00, 0x00] (0 as big-endian int32)
```

## Contract Guidelines

### Naming Conventions
- **Interfaces**: `{Purpose}Contract` (e.g., `PingContract`)
- **Actions**: `{Group}.{ACTION}` (e.g., `Networking.PING`)
- **Fields**: `camelCase` (e.g., `clientTime`, `playerID`)

### Type Safety Rules
1. All contracts must extend `IDataContract`
2. Action field must match enum value exactly
3. Use appropriate codec for each field type
4. Prefer primitive types for network efficiency

### Performance Considerations
- Use smallest appropriate integer type (`ByteCodec` vs `IntCodec`)
- Group related fields into base contracts (`PlayerActionContract`)
- Avoid deeply nested objects in contracts if possible

## Testing Contracts

### Contract Validation
```ts
describe('PingContract', () => {
    it('should encode and decode correctly', () => {
        const data: PingContract = {
            action: Networking.PING,
            clientTime: Date.now(),
            serverTime: 0
        };
        
        const packet = new Ping(data);
        const buffer = packet.wrap();
        const decoded = packet.unwrap(buffer);
        
        expect(decoded).toEqual(data);
    });
});
```

### Factory Testing
```ts
describe('createPlayerActionPacket', () => {
    it('should include base action fields', () => {
        const SetCell = createPlayerActionPacket<SetCellContract>(
            Mechanics.SETCELL,
            { index: ShortCodec, value: ByteCodec }
        );
        
        // Test that base fields are included in codec map
        const codec = new SetCell.Codec();
        expect(codec.codecMap).toHaveProperty('time');
        expect(codec.codecMap).toHaveProperty('playerID');
        expect(codec.codecMap).toHaveProperty('index');
        expect(codec.codecMap).toHaveProperty('value');
    });
});
```

## Migration Guide

### Adding New Contracts
1. Define interface extending appropriate base contract
2. Add action to relevant enum
3. Create packet using factory function
4. Update routing logic if needed

### Modifying Existing Contracts
1. ⚠️ **Breaking**: Adding/removing fields requires version bump
2. ✅ **Safe**: Renaming fields (if codec map updates)
3. ✅ **Safe**: Changing field order (codec handles serialization)

### Versioning Strategy
- Major version: Breaking contract changes
- Minor version: New contracts/actions
- Patch version: Documentation/implementation fixes