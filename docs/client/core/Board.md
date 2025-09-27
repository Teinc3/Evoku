# Board (Client)

The Board layer is composed of two parts working together:

- BoardModelComponent (`src/client/app/components/board/board.component.ts`)
- ClientBoardModel (`src/client/models/Board.ts`) extending the shared `BaseBoardModel`

It renders a 9×9 Sudoku grid as a semantic CSS grid, manages selection, and orchestrates pending/confirm/reject flows through the model. 
Styling is handled via CSS variables for per-edge borders to achieve classic 3×3 thick separators.

See also:
- Cell docs: `docs/client/core/Cell.md`
- Networking & pipelines: `docs/pipeline/README.md`

## Composition & Data Flow

- BoardModelComponent creates and owns a `ClientBoardModel` instance.
- The template iterates a flat index list 0..80 and renders one `app-cell-model` per index:
  - Supplies a `ClientCellModel` from `model.board[i]` via the `getCellModel(i)` accessor.
  - Passes the numeric `index`.
  - Listens for the cell `(selected)` output and updates board selection.
- The model exposes methods to set/confirm/reject pending cell values and computes board-wide progress/cooldowns via the shared base class.

### Rendering

- 9×9 grid using CSS Grid in `board.component.scss`.
- Outer border is a thick black frame; 3×3 sub-grid separators are produced using nth-child selectors that set per-edge CSS variables consumed by cell styles.
- Cell components render their own content (value/pending/notes) and pick up the border variables.

### Selection

- Board tracks a `selected` signal (index | null).
- When a child cell emits `(selected)` with its index:
  - Board updates `selected` and emits `selectedIndexChange`.
  - The template applies `[class.selected]="selected() === i"` on each `app-cell-model` so selection is purely declarative (no direct access to child instances).
- The selected cell gets a visual outline via the `.selected` class applied by the parent binding.

### Initialization & Seeding

- The `@Input() puzzle` uses a setter: when it receives 81 entries, the board seeds with those values as fixed cells (non-zero become fixed).
- If no puzzle is provided, `ngOnInit` seeds 81 empty (0, not fixed) cells so that every child always receives a defined model.
- The `getCellModel(i)` accessor is defensive and lazily creates a default empty cell if needed.

### Pending / Confirm / Reject

Board methods delegate to `ClientBoardModel`:

- `setPendingSelected(value: number, time?: number)`
  - Validates and sets `pendingValue` on the selected cell model.
  - Updates `pendingGlobalCooldownEnd` on success.
- `confirmSelected(time?: number)`
  - Confirms a pending value on the selected cell.
  - Updates global cooldown and clears pending global state.
- `rejectSelected()`
  - Rejects the selected cell’s pending changes and clears global pending.

These methods combine with server-side validation/confirmation in real gameplay as described in `docs/pipeline/PacketIO.md` and `docs/pipeline/Actions.md`.

### Accessibility

- The board container includes `role="grid"` and `aria-rowcount="9"`/`aria-colcount="9"`.
- Cells are buttons, making them keyboard-focusable and discoverable by screen readers with minimal extra work.

## Minimal Usage

```html
<app-board-model [puzzle]="puzzle" (selectedIndexChange)="onSelect($event)"></app-board-model>
```

```ts
// Component TS
puzzle: number[] = [... 81 entries ...];

onSelect(i: number) {
  // update UI, controls, etc.
}
```

## Key APIs

- BoardModelComponent
  - Inputs: `puzzle: ReadonlyArray<number>`
  - Outputs: `selectedIndexChange: EventEmitter<number>`
  - Methods for gameplay wiring:
    - `setPendingSelected(value: number, time?: number): boolean`
    - `confirmSelected(time?: number): boolean`
    - `rejectSelected(): void`

- ClientBoardModel (extends shared BaseBoardModel)
  - `setPendingCell(cellIndex: number, value: number, time?: number): boolean`
  - `confirmCellSet(cellIndex: number, value: number, time?: number): boolean`
  - `rejectCellSet(cellIndex: number): void`
  - `getDisplayGlobalCooldownEnd(): number`
  - `hasPendingChanges(): boolean`

## Internals & Links

- Component: `src/client/app/components/board/board.component.ts`
- Template: `src/client/app/components/board/board.component.html`
- Styles: `src/client/app/components/board/board.component.scss`
- Model (client): `src/client/models/Board.ts`
- Model (shared base): `src/shared/models/Board.ts`
- Cell pair: `docs/client/core/Cell.md`
