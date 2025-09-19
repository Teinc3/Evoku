# Cell (Client)

The Cell layer is composed of:

- SudokuCellComponent (`src/client/app/components/cell/cell.component.ts`)
- ClientCellModel (`src/client/models/Cell.ts`) extending the shared `BaseCellModel`

It renders a single Sudoku cell and exposes events for selection. The client model supports optimistic updates via a small pending state.

See also:
- Board docs: `docs/client/core/Board.md`
- Shared models: `src/shared/models/Cell.ts`

## Composition & Data Flow

- `SudokuCellComponent` receives two inputs:
  - `model: ClientCellModel` (required)
  - `index: number`
- Emits `selected: EventEmitter<number>` when clicked.
- HostBinding `class.selected` reflects visual selection controlled by the Board.

### Rendering Logic

Template logic chooses one of three modes:

1) Notes mode (3×3 mini-grid)
   - Shown when `model.value === 0` and `model.notes?.length > 0`.
   - Displays digits 1–9 based on `notes` membership.

2) Pending mode
   - When `model.hasPending()` is true and `pendingValue` is present.
   - Shows the pending value with a `.pending` style.

3) Value mode
   - Fallback: shows `model.getDisplayValue()` (pending value if present; otherwise actual).
   - Colors: dynamic (blue), fixed (black), pending (gray) via CSS classes.

### Selection Behavior

- On click:
  - Sets `isSelected = true` locally and emits `selected(index)`.
  - The Board manages global deselection and ensures only one cell is visually selected.

### ClientCellModel Pending State

`ClientCellModel` augments the shared base with `pendingCellState` and optional `notes`.

- `setPending(value: number, time?: number): boolean`
  - Validates against base rules (integers 0..9, not fixed, cooldown, effect blocks).
  - Sets `pendingValue` and optionally a `pendingCooldownEnd` based on `time + CELL_COOLDOWN_DURATION`.

- `confirmSet(value: number, time?: number): boolean`
  - Clears pending and applies the value via `update(value, time)`.

- `rejectPending(): void`
  - Clears all pending state.

- `getDisplayValue(): number`
  - Returns `pendingValue` if available, else `value`.

- `hasPending(): boolean`
  - True when any of `pendingValue`, `pendingCooldownEnd`, or `pendingEffects` exists.

### Styling & Borders

- The cell uses per-edge CSS custom properties `--b-top|right|bottom|left` for borders set by the Board, defaulting to a thin gray line.
- Selection overlay is a host `.selected` pseudo-element outline.
- Value colors:
  - Dynamic (default): `#1E88E5`
  - Fixed: `#000000`
  - Pending: `#808080`

### Minimal Usage (inside a Board)

```html
<app-sudoku-cell [model]="cell(i)" [index]="i" (selected)="onCellSelected($event)"></app-sudoku-cell>
```

### Internals & Links

- Component: `src/client/app/components/cell/cell.component.ts`
- Template: `src/client/app/components/cell/cell.component.html`
- Styles: `src/client/app/components/cell/cell.component.scss`
- Model (client): `src/client/models/Cell.ts`
- Model (shared base): `src/shared/models/Cell.ts`
- Board pair: `docs/client/core/Board.md`
