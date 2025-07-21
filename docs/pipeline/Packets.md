# Packets Documentation

Packets are wrapper classes that encapsulate data contracts into a linear
binary array buffer for efficient serialization and transmission over the network.

Each Packet is bound by a specific contract, and wraps from/unwraps binary data
into an object adhering to that contract's specifications.

Packets can either be manually extended from the base
[`AbstractPacket`](/src/shared/networking/packets/AbstractPacket.ts) class,
or created using any factory function that returns a packet instance.


## Packet Creation

### Basic Packet Factory

To create a basic packet with no automatic injection, you can use the
[`createPacket`](/src/shared/networking/factory/createPacket.ts) factory function.

The shape of the codec map required is determined by the contract associated with the action enum.

```ts
export const Ping = createPacket(Networking.PING, {
    serverTime: IntCodec,
    clientPing: IntCodec
});
```

### Action Packet Factory
For player action packets that share common fields, you can use the
[`createActionPacket`](/src/shared/networking/factory/createActionPacket.ts) factory.

This function automatically detects any extendable fields once the action parameter is provided,
allowing the user to feed in a list of keys to index and inject them into the packet automatically.
The list of keys do not need to be provided in any specific order,
as the factory will sort them based on the codec map provided.

Codecs for other custom fields need to be provided explicitly in the `codecMap` parameter,
otherwise the TypeScript compiler will throw an error.

Example:
```ts
export const SetCell = createActionPacket(
    Gameplay.SET_CELL,
    ['clientTime', 'actionID', 'cellIndex', 'value'],
    {}
);

export const CellSet = createActionPacket(
    Gameplay.CELL_SET,
    ['serverTime', 'playerID', 'actionID', 'cellIndex', 'value'],
    {}
);
```

## ID Scrambling
During serialisation, packet IDs are scrambled to prevent static network analysis.
This is done using the [`PacketScrambler`](/src/shared/utils/PacketScrambler.ts) utility,
which provides a consistent way to obfuscate action IDs across the network.

## Network Protocol

### Packet Structure
```
[Scrambled Action ID][Field 1][Field 2]...[Field N]
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