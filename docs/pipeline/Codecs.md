# Codecs Documentation

Codecs are classes that serialize and deserialize different data types (DTypes) from/to binary buffers.

Codecs are stored in the [`/src/shared/networking/codecs/`](/src/shared/networking/codecs/) directory.

Every codec class must extend the base
[`AbstractCodec`](/src/shared/networking/codecs/AbstractCodec.ts) class and implement the
`encode` and `decode` methods, which are specified in the interface
[`ICodec`](/src/shared/types/networking/ICodec.ts).

## Codec Types

### Primitive Codecs

Primitive codecs are used for basic data types like numbers, strings, and booleans.
A list of all exported primitive codecs can be found
[here](/src/shared/networking/codecs/primitive/index.ts).

- `BoolCodec` - Codes a boolean value (0 or 1)
- `ByteCodec` - Codes a 8-bit signed integer
- `ShortCodec` - Codes a 16-bit signed integer
- `IntCodec` - Codes a 32-bit signed integer
- `FloatCodec` - Codes a 32-bit floating point number
- `StringCodec` - Codes a UTF-8 string, with an initial 4-byte length prefix.

### Example Usage in Packets

For the GameOver packet, the ID of the winning player as well as
the reason for the game ending are transmitted from the server to the client.

```ts
export default createPacket(Lifecycle.GAME_OVER, {
    winnerID: ByteCodec,
    reason: ByteCodec
})
```

### Custom Codecs

Custom codecs (also known as composite codecs) are used to serialize and deserialize
complex, nested data structures. Custom codecs have a readonly `codecMap` attribute
that defines how to encode and decode each field within the internal data structure.

All Custom Codecs extend the [`CustomCodec`](/src/shared/networking/codecs/CustomCodec.ts) ABC.

#### Example Custom Codec
```ts
export default class PlayerInfoCodec extends CustomCodec<PlayerInfoContract> implements ICustomCodec<PlayerInfoContract> {
    readonly codecMap = {
        playerID: ByteCodec,
        username: StringCodec
    }
}
```

Note that Custom Codecs can also be nested within one another.

### Array Codecs

Array codecs are used to serialize and deserialize arrays of specific data types.

To create an array codec, you can use the
[`createArrayCodec`](/src/shared/networking/factory/createArrayCodec.ts) factory function.

#### Example Array Codec
```ts
// GameInit.ts
export default createPacket(Lifecycle.GAME_INIT, {
    cellValues: createArrayCodec(ByteCodec)
})
```

The use of an array codec corresponds to the following contract:
```ts
export default interface GameInitContract extends IDataContract {
    cellValues: number[];
}
```

### JSON Codec (To be Implemented)

For highly complex data structures that do not fit well within the constraints of custom codecs,
the JSON codec can be used as a more flexible alternative. It allows for the serialization and
deserialization of arbitrary JavaScript objects to and from JSON format, which is encoded as a UTF-8 string.


## Codec Guidelines

### Naming Conventions
- **Classes**: `{DType}Codec` (e.g., `IntCodec`, `PlayerInfoCodec`)
- **Fields**: inherited from contract naming conventions
- **Factory Functions**: `create{Type}Codec` (e.g., `createArrayCodec`)

### Best Practices
- Use the smallest appropriate codec for each field type (e.g., `ByteCodec` for small integers)
- Avoid deeply nested structures in custom codecs to simplify serialization
- Declare codecs for automatic injection in [`INJECTABLE_CODECS`](/src/shared/networking/codecs/custom/InjectableCodecs.ts)
- Reuse codecs if possible by storing the declaration in a shared file