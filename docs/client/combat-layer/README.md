# Combat Layer Documentation

## Overview
The Combat Layer provides visual feedback and UI components for powerup-based combat mechanics in Evoku. It includes threat notifications, defuse indicators, and outcome feedback.

## Components

### CombatBadgeComponent
**Location**: `src/client/app/components/hud/combat-badge/`

Compact badge component that displays incoming threats with:
- **Powerup Icon**: Visual representation of the incoming attack
- **Defuse Type Icon**: Shows the pattern required to defuse (Row/Col/Box/Global)
- **Countdown Timer**: Displays remaining time in format "X.Xs" (e.g., "3.4s", "0.5s")
- **Critical State**: Badge pulses faster and changes color when time < 3 seconds

#### Usage
```typescript
<app-combat-badge [threatData]="myThreat"></app-combat-badge>
```

#### Inputs
- `threatData: ThreatData | null` - Combat threat information or null if no active threat

#### Animation Constants
- `PULSE_NORMAL`: 1000ms - Normal pulse animation duration
- `PULSE_CRITICAL`: 500ms - Critical pulse animation duration (< 3s remaining)

### FloatingTextComponent
**Location**: `src/client/app/components/board/floating-text/`

Displays outcome notifications that float upward and fade out. Handles its own lifecycle to prevent memory leaks.

#### Text Types
- **Success (Blue)**: `REFLECTED!`, `SHATTERED!`
- **Danger (Red)**: `FROZEN!`, `LOCKED!`

#### Usage
```typescript
// Add floating text programmatically
boardComponent.addFloatingText({ type: FloatingTextType.REFLECTED });
```

#### Lifecycle
1. Component mounts and starts animation
2. After 2000ms (FLOAT_ANIMATION_DURATION), calls `onComplete` callback
3. Parent removes component from DOM via callback
4. No memory leaks - timer is cleared in ngOnDestroy

### Board Combat Feedback

#### Grid Line Pulse
Dynamic CSS overlays that pulse specific grid lines based on defuse type:
- **Row Defuse**: Horizontal lines pulse orange
- **Col Defuse**: Vertical lines pulse orange  
- **Box Defuse**: 3×3 box division lines pulse orange

Animation duration: 1.5s (defined in `$pulse-duration` SCSS variable)

#### Threat Border
Board border pulses orange when threat is active, with glowing animation.

#### Ghost Target
Semi-transparent overlay at target cell indices showing where attack will land.

## Types

### DefuseType
```typescript
enum DefuseType {
  ROW = 'row',
  COL = 'col',
  BOX = 'box',
  GLOBAL = 'global'
}
```

### FloatingTextType
```typescript
enum FloatingTextType {
  REFLECTED = 'REFLECTED',
  SHATTERED = 'SHATTERED',
  FROZEN = 'FROZEN',
  LOCKED = 'LOCKED'
}
```

### ThreatData
```typescript
interface ThreatData {
  pupIcon: string;           // Path to powerup icon
  defuseType: DefuseType;    // Required defuse pattern
  timeRemainingMs: number;   // Countdown in milliseconds
  targetIndices?: number[];  // Optional cell indices for ghost effect
}
```

### FloatingTextData
```typescript
interface FloatingTextData {
  type: FloatingTextType;    // Type of outcome
  id: number;                // Unique ID for lifecycle tracking
}
```

## SCSS Architecture

### Pulse Grid Lines Mixin
Reusable mixin for pulsing grid line overlays, eliminating code duplication:

```scss
@mixin pulse-grid-lines($direction) {
  // Creates repeating linear gradients for row/col/box patterns
}
```

**Usage**:
```scss
.pulse-row-overlay {
  @include pulse-grid-lines('horizontal');
}
```

### Animation Constants
All animation durations are defined as SCSS variables:
- `$pulse-duration`: 1.5s - Grid line pulse duration
- `$pulse-color`: rgba(255, 140, 0, 0.7) - Orange pulse color

## Integration

### In Duel HUD
CombatBadge is placed below each player's progress bar in the top HUD:

```html
<div class="player-header">
  <app-universal-progress-bar>Player Name</app-universal-progress-bar>
  <app-combat-badge [threatData]="playerThreat"></app-combat-badge>
</div>
```

### In Board Component
Combat feedback is integrated via:
1. **Threat data input**: `@Input() threatData: ThreatData | null`
2. **CSS classes**: Applied conditionally based on threat state
3. **Overlays**: Rendered when conditions match
4. **Floating texts**: Managed via array with add/remove methods

## Best Practices

### Lifecycle Management
- Always use the callback pattern for FloatingTextComponent
- Never leave floating text elements in DOM after animation
- Use window.setTimeout for animations, not magic numbers

### Animation Timing
- Sync TypeScript constants with CSS animation durations
- Use named SCSS variables instead of hardcoded values
- Export constants when needed in TypeScript

### Code Organization
- Use getters for computed values (icon paths, labels)
- Avoid nested ternaries - use switch statements or getters
- Use mixins to eliminate SCSS duplication

## Testing
All components include comprehensive unit tests covering:
- Rendering with/without data
- Timer formatting
- Critical state transitions
- Lifecycle cleanup
- Icon/label generation for all types
