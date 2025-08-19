# Data Pipeline

Documentation of the Data Pipeline is organized into the following sections:

## Actions
Path: [/docs/pipeline/Actions.md](/docs/pipeline/Actions.md)

A section dedicated to documenting the unique identifiers of all game actions and events.

## ActionMap
Path: [/docs/pipeline/ActionMap.md](/docs/pipeline/ActionMap.md)

A section dedicated to documenting the type-static mapping
between action identifiers and their corresponding data contracts.

## Contracts
Path: [/docs/pipeline/Contracts.md](/docs/pipeline/Contracts.md)

A section dedicated to documenting the data contracts that enforce the structure of data within the pipeline.

## Packets
Path: [/docs/pipeline/Packets.md](/docs/pipeline/Packets.md)

A section dedicated to documenting the packet structure, creation, and data serialization process.

## Codecs
Path: [/docs/pipeline/Codecs.md](/docs/pipeline/Codecs.md)

A section dedicated to documenting the codecs used for encoding and decoding data to/from binary format.

## PacketIO
Path: [/docs/pipeline/PacketIO.md](/docs/pipeline/PacketIO.md)

Core serialization utility that handles encoding and decoding of game packets 
between binary format and TypeScript objects. Provides type-safe packet transformation
using the codec system and packet registry.

## Security
Path: [/docs/pipeline/security/README.md](/docs/pipeline/security/README.md)

Security components for the data pipeline that provide packet protection and obfuscation mechanisms.