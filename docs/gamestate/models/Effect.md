# BaseEffectModel

Abstract base class for temporal effects that modify cell and board behavior in Evoku games.

## Overview

`BaseEffectModel` provides the foundation for all effect implementations in Evoku.
Effects are time-based modifications that can alter how cells behave during validation,
progress tracking, and other game mechanics. This enables features like power-ups,
penalties, and special game modes.

## Class Declaration

```typescript
abstract class BaseEffectModel implements ICellEffectState
```

## Key Features

- **Time-based Duration**: Effects have start times and optional end times
- **Value Change Control**: Can block or allow cell value modifications
- **Progress Modification**: Can prevent cells from contributing to completion
- **State Hashing**: Provides hash computation for synchronization
- **Extensible Design**: Abstract base allows for diverse effect implementations

## Constructor

```typescript
constructor(startedAt: number, lastUntil?: number)
```

Creates a new effect with specified timing.

**Parameters:**
- `startedAt` - Timestamp when the effect began
- `lastUntil` - Optional timestamp when the effect ends (permanent if undefined)

## Properties

### Instance Properties

- `startedAt: number` - Timestamp when the effect started
- `lastUntil?: number` - Optional timestamp when the effect ends

## Core Methods

### validateSetValue(time?)

Determines if the effect allows setting a new cell value.

```typescript
public validateSetValue(time?: number): boolean
```

**Parameters:**
- `time` - Optional current timestamp for duration checking

**Returns:** `boolean` - Whether the effect allows value changes

**Default Behavior:**
- Returns `true` if no end time is set (permanent effect allows changes)
- Returns `true` if current time is past the end time (effect expired)
- Returns `true` if no time is provided (no temporal validation)

**Override Pattern:**
Effects that block value changes should override this method:

```typescript
public validateSetValue(time?: number): boolean {
  // Block changes while effect is active
  return time === undefined || (this.lastUntil !== undefined && time >= this.lastUntil);
}
```

### blockSetProgress(time?)

Determines if the effect blocks a cell from contributing to progress.

```typescript
public blockSetProgress(time?: number): boolean
```

**Parameters:**
- `time` - Optional current timestamp for duration checking

**Returns:** `boolean` - Whether the effect blocks progress contribution

**Default Behavior:**
- Returns `false` if no time or end time provided
- Returns `true` if current time is before the end time (effect active)
- Returns `false` if current time is past the end time (effect expired)

### computeHash()

Generates a hash of the effect's current state.

```typescript
public computeHash(): number
```

**Returns:** `number` - 32-bit integer hash of effect state

**Hash Components:**
- Start time (`startedAt`)
- End time (`lastUntil`)

**Implementation:**
Uses a 31-based rolling hash algorithm with proper int32 conversion
to ensure consistent hash values across platforms.

## Usage Examples

### Basic Effect Creation

```typescript
// Permanent effect (no end time)
const permanentEffect = new CustomEffect(1000);

// Temporary effect (5 second duration)
const temporaryEffect = new CustomEffect(1000, 6000);

// Effect that started in the past, ends in future
const ongoingEffect = new CustomEffect(500, 2000);
```

### Time-based Validation

```typescript
const effect = new BlockingEffect(1000, 5000); // Active from 1000 to 5000

// Check at different times
console.log(effect.validateSetValue(500));  // true (before start)
console.log(effect.validateSetValue(3000)); // false (during effect)
console.log(effect.validateSetValue(6000)); // true (after end)

// Without time parameter (no temporal validation)
console.log(effect.validateSetValue()); // true
```

### Progress Blocking

```typescript
const progressBlocker = new ProgressBlockingEffect(1000, 4000);

const currentTime = 2000; // During effect
console.log(progressBlocker.blockSetProgress(currentTime)); // true

const laterTime = 5000; // After effect
console.log(progressBlocker.blockSetProgress(laterTime)); // false
```

### State Hashing

```typescript
const effect1 = new CustomEffect(1000, 5000);
const effect2 = new CustomEffect(1000, 5000);
const effect3 = new CustomEffect(1000, 6000);

// Same state produces same hash
console.log(effect1.computeHash() === effect2.computeHash()); // true

// Different state produces different hash
console.log(effect1.computeHash() === effect3.computeHash()); // false
```

## Effect Implementation Patterns

### Blocking Effect

Effect that prevents cell value changes while active:

```typescript
class FreezeEffect extends BaseEffectModel {
  public validateSetValue(time?: number): boolean {
    // Block changes while effect is active
    if (time !== undefined && this.lastUntil !== undefined) {
      return time >= this.lastUntil;
    }
    return true; // No temporal validation
  }
}
```

### Progress Blocking Effect

Effect that prevents progress contribution while active:

```typescript
class ConfusionEffect extends BaseEffectModel {
  public blockSetProgress(time?: number): boolean {
    // Block progress while effect is active
    return time !== undefined && 
           this.lastUntil !== undefined && 
           time < this.lastUntil;
  }
}
```

### Enhancement Effect

Effect that modifies behavior but doesn't block actions:

```typescript
class DoublePointsEffect extends BaseEffectModel {
  public getScoreMultiplier(time?: number): number {
    // Double points while active
    if (time !== undefined && this.lastUntil !== undefined && time < this.lastUntil) {
      return 2.0;
    }
    return 1.0;
  }
}
```

### Complex Effect

Effect with multiple behavioral modifications:

```typescript
class PowerUpEffect extends BaseEffectModel {
  public validateSetValue(time?: number): boolean {
    // Allow changes (no blocking)
    return true;
  }
  
  public blockSetProgress(time?: number): boolean {
    // Never block progress
    return false;
  }
  
  public getSpeedBonus(time?: number): number {
    // Reduce cooldown while active
    if (this.isActive(time)) {
      return 0.5; // 50% cooldown reduction
    }
    return 1.0;
  }
  
  private isActive(time?: number): boolean {
    return time !== undefined && 
           this.lastUntil !== undefined && 
           time >= this.startedAt && 
           time < this.lastUntil;
  }
}
```

## Platform-Specific Extensions

### Server Implementation

```typescript
class ServerEffectModel extends BaseEffectModel {
  public applyToCell(cell: ServerCellModel, time: number): void {
    // Server-authoritative effect application
    if (this.isActive(time)) {
      this.performServerSideEffects(cell);
    }
  }
  
  private performServerSideEffects(cell: ServerCellModel): void {
    // Server-specific effect logic
  }
}
```

### Client Implementation

```typescript
class ClientEffectModel extends BaseEffectModel {
  private visualEffect?: VisualEffect;
  
  public startVisuals(): void {
    this.visualEffect = new VisualEffect();
    this.visualEffect.play();
  }
  
  public stopVisuals(): void {
    this.visualEffect?.stop();
    this.visualEffect = undefined;
  }
}
```

## Integration with Cell Models

### Cell Validation Integration

```typescript
// In BaseCellModel.validate()
for (const effect of this.effects) {
  if (!effect.validateSetValue(time)) {
    return false; // Effect blocks the change
  }
}
```

### Cell Progress Integration

```typescript
// In BaseCellModel.progress()
for (const effect of this.effects) {
  if (effect.blockSetProgress(time)) {
    return false; // Effect blocks progress contribution
  }
}
```

### Cell Hash Integration

```typescript
// In BaseCellModel.computeHash()
for (const effect of this.effects) {
  h = (h * 31 + effect.computeHash()) | 0;
}
```

## Design Principles

### Time-Agnostic Validation

Effects should handle cases where no time is provided gracefully:

```typescript
public validateSetValue(time?: number): boolean {
  if (time === undefined) {
    return true; // No temporal validation possible
  }
  // Perform time-based validation
}
```

### Immutable State

Effect state should be considered immutable after creation:

```typescript
// ✅ Good: Create new effect for changed duration
const newEffect = new CustomEffect(startTime, newEndTime);

// ❌ Bad: Modify existing effect state
effect.lastUntil = newEndTime;
```

### Defensive Programming

Always validate time parameters and handle edge cases:

```typescript
public validateSetValue(time?: number): boolean {
  if (time !== undefined && this.lastUntil !== undefined) {
    // Ensure valid time comparison
    if (time >= this.startedAt && time < this.lastUntil) {
      return false; // Effect is active
    }
  }
  return true; // Default to allowing changes
}
```

## Best Practices

1. **Handle undefined time** - Effects should work with or without timestamps
2. **Use clear naming** - Effect classes should clearly indicate their purpose
3. **Override selectively** - Only override methods that the effect actually modifies
4. **Validate parameters** - Check time bounds and state consistency
5. **Document behavior** - Clearly document what each effect does
6. **Test edge cases** - Verify behavior at start/end boundaries
7. **Consider performance** - Hash computation is called frequently

## Common Effect Types

### Temporary Blocking Effects
- **Freeze**: Prevents all cell changes
- **Disable**: Blocks specific types of changes
- **Lock**: Temporarily makes cells behave as fixed

### Enhancement Effects
- **Speed Boost**: Reduces cooldown durations
- **Double Points**: Multiplies score for actions
- **Auto-Fill**: Automatically fills correct values

### Penalty Effects
- **Confusion**: Blocks progress contribution
- **Scramble**: Randomizes visible values
- **Time Penalty**: Increases cooldown durations

### Special Mode Effects
- **Hint Mode**: Reveals solution values
- **Challenge Mode**: Adds additional constraints
- **Cooperative Mode**: Allows multiple player input

## Future Extensibility

The effect system is designed to support:

- **Chained Effects**: Effects that trigger other effects
- **Conditional Effects**: Effects that activate based on game state
- **Player-Specific Effects**: Effects that apply to specific players
- **Board-Wide Effects**: Effects that modify entire board behavior
- **Dynamic Duration**: Effects that can extend or shorten based on actions
- **Effect Stacking**: Multiple effects of the same type with additive behavior

## Integration Points

- **Cell Models**: Effects are stored and processed by cells
- **Board Models**: Board-wide effects can be managed at board level
- **Time Service**: Effect duration relies on accurate time synchronization
- **Power-Up System**: Effects provide the foundation for power-up mechanics
- **Game Modes**: Special game modes can be implemented as effect combinations
- **Anti-Cheat**: Effect state hashing enables verification of effect authenticity