# Security

Security components for the data pipeline that provide packet protection and obfuscation.

## PacketScrambler
Path: [/docs/pipeline/security/PacketScrambler.md](/docs/pipeline/security/PacketScrambler.md)

Runtime packet identifier obfuscation system that uses seeded randomization to scramble packet IDs,
making protocol analysis more difficult for potential attackers.
Provides reversible mapping between development and network packet identifiers.
