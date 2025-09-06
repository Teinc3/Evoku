# PacketScrambler

**Path:** `src/shared/networking/security/scramble.ts`

While not a primary security mechanism, scrambling provides:
- **Analysis Resistance:** Makes packet reverse engineering more difficult
- **Development Protection:** Hides internal packet structure from observation
- **Environment Separation:** Different scrambling per deployment environment

The PacketScrambler provides runtime packet identifier obfuscation to enhance security
by making packet analysis more difficult for potential attackers. It uses
seeded randomization to create consistent but unpredictable ID mappings.

## Overview

PacketScrambler implements a security-through-obscurity mechanism that:
- **ID Obfuscation:** Maps development packet IDs to scrambled network IDs
- **Reversible Mapping:** Provides bidirectional translation between ID spaces
- **Seeded Randomization:** Uses environment-based seed for consistent mappings
- **Optional Security:** Gracefully degrades when no seed is provided

## Core Responsibilities

### ID Scrambling
- **Development to Network:** Converts static development IDs to scrambled IDs
- **Network to Development:** Reverses scrambled IDs back to original values
- **Bijective Mapping:** Ensures one-to-one correspondence between ID spaces
- **Range Preservation:** Maintains byte-range constraints (-128 to 127)

### Seed Management
- **Environment Integration:** Uses `NG_APP_PACKET_SCRAMBLER_SEED` environment variable
- **Deterministic Generation:** Same seed produces identical mappings
- **Graceful Degradation:** No scrambling when seed unavailable
- **Security Isolation:** Seed-based separation between environments

## Design Principles

### Security Through Obscurity
While not a primary security mechanism, scrambling provides:
- **Analysis Resistance:** Makes packet reverse engineering more difficult
- **Development Protection:** Hides internal packet structure from observation
- **Environment Separation:** Different scrambling per deployment environment

## API Reference

### Constructor
```typescript
constructor()
```

Creates a new PacketScrambler instance and initializes mappings if seed available.

**Environment Variable:**
- `NG_APP_PACKET_SCRAMBLER_SEED` - String seed for deterministic random mapping

**Initialization Behavior:**
- **Seed Present:** Creates scramble/unscramble mapping tables
- **No Seed:** Maps remain null, IDs pass through unchanged

### Scrambling Operations

#### scrambleID(devID: ActionEnum): number
Converts a development packet ID to its scrambled network equivalent.

**Parameters:**
- `devID` - The internal, static packet ID from development

**Returns:** The scrambled packet ID for network transmission

**Example:**
```typescript
import scrambler from '@shared/networking/security/scramble';

// Scramble a packet ID before sending
const devID = ProtocolActions.PING; // e.g., 42
const networkID = scrambler.scrambleID(devID); // e.g., -73

// networkID is sent over the network instead of devID
```

**Behavior:**
- **With Seed:** Returns mapped scrambled ID
- **Without Seed:** Returns original ID unchanged
- **Unknown ID:** Logs warning and returns original ID

#### unscrambleID(scrambledID: number): ActionEnum
Converts a scrambled network ID back to the original development ID.

**Parameters:**
- `scrambledID` - The external, scrambled packet ID from network

**Returns:** The original static packet ID for internal processing

**Example:**
```typescript
import scrambler from '@shared/networking/security/scramble';

// Unscramble received packet ID
const receivedID = -73; // From network
const devID = scrambler.unscrambleID(receivedID); // 42 (ProtocolActions.PING)

// Use devID for internal packet processing
```

**Behavior:**
- **With Seed:** Returns mapped original ID
- **Without Seed:** Returns scrambled ID unchanged  
- **Unknown ID:** Logs warning and returns scrambled ID

## Implementation Details

### BiMap Usage
The scrambler uses a bidirectional map (BiMap) to maintain one-to-one correspondence between development and scrambled IDs:

```typescript
private map: BiMap<ActionEnum> | undefined;
```

This allows efficient forward (scramble) and reverse (unscramble) lookups without maintaining separate maps.

### Mapping Generation
The scrambler creates bijective mappings using Fisher-Yates shuffle through the BiMap library:

```typescript
private initializeMaps(seed: string): void {
  this.map = new BiMap();

  const prng = seedrandom(seed);

  // Define the pool of all possible IDs (for a Byte, -128 to 127)
  const originalIds = Array.from({ length: 256 }, (_, i) => i - 128);
  const shuffledIds = [...originalIds];

  // Shuffle with the seeded PRNG
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }

  // Create the 1-to-1 forward and reverse mappings
  for (let i = 0; i < originalIds.length; i++) {
    const devID = originalIds[i];
    const scrambledID = shuffledIds[i];

    this.map.set(devID.toString(), scrambledID);
  }
}
```

### Byte Range Handling
The scrambler works within the constraints of packet encoding:

**Input Range:** Action enum values (typically positive integers)
**Output Range:** Signed byte values (-128 to 127)
**Mapping:** Bijective function ensuring reversibility

### Error Handling

#### Missing Mappings
```typescript
// Scramble operation with unknown ID
const scrambled = this.scrambleMap.get(devID);
if (scrambled === undefined) {
  console.warn(`PacketScrambler: No mapping for devID ${devID}. Is it within a Byte range?`);
  return devID; // Fallback for safety
}
```

#### Range Validation
The system warns when IDs fall outside expected byte ranges:
- **Development IDs:** Should be within mappable range
- **Network IDs:** Should be valid scrambled values
- **Fallback Behavior:** Returns original ID when mapping fails

## Security Considerations

### Threat Model
PacketScrambler addresses specific attack vectors:

**Packet Analysis:** 
- **Before:** Attacker observes predictable packet ID patterns
- **After:** Packet IDs appear randomized, hindering analysis

**Reverse Engineering:**
- **Before:** Static packet IDs reveal protocol structure
- **After:** Dynamic mapping obscures internal organization

### Limitations
PacketScrambler is **not** a cryptographic security measure:
- **Security Through Obscurity:** Provides minimal actual security
- **Key Recovery:** Seed exposure compromises all scrambling
- **Statistical Analysis:** Large packet samples may reveal patterns
- **Supplementary Only:** Should complement, not replace, real security

### Best Practices
```typescript
// Environment-specific seeds
// Development: NG_APP_PACKET_SCRAMBLER_SEED=dev_seed_123
// Production: NG_APP_PACKET_SCRAMBLER_SEED=prod_seed_xyz

// Seed rotation (manual process)
// Periodically update seeds across environments
// Coordinate client/server seed updates
```



## Testing Considerations

### Unit Test Coverage
- **Bijective Mapping:** Verify scramble/unscramble round-trip consistency
- **Seed Determinism:** Same seed produces identical mappings  
- **Graceful Degradation:** Proper behavior when no seed provided
- **Error Handling:** Unknown ID warnings and fallback behavior
- **Range Coverage:** All byte values properly mapped

### Environment Testing
```typescript
describe('PacketScrambler', () => {
  beforeEach(() => {
    // Set test seed
    process.env.NG_APP_PACKET_SCRAMBLER_SEED = 'test_seed_123';
  });
  
  it('should scramble and unscramble IDs consistently');
  it('should handle missing seed gracefully');
  it('should warn on unknown IDs');
  it('should produce deterministic mappings');
});
```

### Integration Testing
- **Network Communication:** Verify scrambled packets transmit correctly
- **Client-Server Coordination:** Ensure both sides use same seed
- **Multiple Environments:** Test different seed configurations

## Usage Patterns

### Server-Side Integration
```typescript
// In packet encoding
const scrambledID = scrambler.scrambleID(action);
// Send scrambledID over network

// In packet decoding  
const originalID = scrambler.unscrambleID(receivedID);
// Process with originalID
```

### Client-Side Integration
```typescript
// Mirror server scrambling
const clientScrambler = new PacketScrambler(); // Uses same env seed
const scrambledID = clientScrambler.scrambleID(action);
```

### Development Workflow
```bash
# Set scrambling seed in environment
export NG_APP_PACKET_SCRAMBLER_SEED="development_seed_2024"

# Run application with scrambling enabled
npm start

# Disable scrambling for debugging
unset NG_APP_PACKET_SCRAMBLER_SEED
npm start
```

## Deployment Considerations

### Environment Configuration
- **Seed Management:** Secure storage and distribution of seeds
- **Synchronization:** Ensure client and server use matching seeds
- **Rotation Schedule:** Plan for periodic seed updates

### Monitoring and Debugging
- **Warning Logs:** Monitor for unknown ID warnings
- **Seed Validation:** Confirm scrambling active when expected

## Future Enhancements

### Enhanced Security
- **Key Derivation:** Use proper cryptographic key derivation functions
- **Time-Based Rotation:** Automatic seed rotation based on time windows
- **Per-Session Keys:** Unique scrambling per connection session

### Operational Features
- **Hot Reloading:** Update scrambling without restart
- **Seed Validation:** Verify seed quality and uniqueness
- **Analytics:** Track scrambling effectiveness
