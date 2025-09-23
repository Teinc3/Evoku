import { Component, EventEmitter, Output, signal, Input, HostListener } from '@angular/core';


import SudokuCellComponent from '../cell/cell.component';
import CursorDirectionEnum from '../../../types/cursor-direction.enum';
import ClientBoardModel from '../../../models/Board';

import type { WritableSignal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-sudoku-board-model',
  standalone: true,
  imports: [SudokuCellComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export default class BoardModelComponent implements OnInit {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  public readonly model: ClientBoardModel;

  @Input() isNoteMode = false;
  
  @Output()
  selectedIndexChange = new EventEmitter<number>();

  // Flat indices 0..80 for a 9x9 board
  readonly indices: number[];
  readonly selected: WritableSignal<number | null>;

  constructor() {
    this.model = new ClientBoardModel();
    this.indices = Array.from({ length: 81 }, (_, i) => i);
    this.selected = signal<number | null>(null);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key;

    // Handle number inputs (1-9)
    if (key >= '1' && key <= '9') {
      const num = parseInt(key, 10);
      if (this.isNoteMode) {
        this.toggleNoteSelected(num);
      } else {
        this.setPendingSelected(num, performance.now());
      }
      return;
    }

    // Handle other actions
    switch (key) {
      case 'Backspace':
      case '0':
        this.clearSelected();
        break;
      // Movement keys
      case 'w':
      case 'ArrowUp':
        this.moveSelection(CursorDirectionEnum.UP);
        break;
      case 's':
      case 'ArrowDown':
        this.moveSelection(CursorDirectionEnum.DOWN);
        break;
      case 'a':
      case 'ArrowLeft':
        this.moveSelection(CursorDirectionEnum.LEFT);
        break;
      case 'd':
      case 'ArrowRight':
        this.moveSelection(CursorDirectionEnum.RIGHT);
        break;
    }
  }

  ngOnInit(): void {
    // Initialize with 81 empty cells only if nothing has been loaded yet.
    if (this.model.board.length === 0) {
      this.initBoard([]);
    }
  }

  /** Initialize the board with a given set of values */
  public initBoard(values: ReadonlyArray<number>): void {
    // Initialize board with provided puzzle, marking non-zero as fixed
    for (let i = 0; i < 81; i++) {
      const v = values[i] ?? 0;
      this.model.board[i] = new this.model.CellModelClass(v, v !== 0);
    }
  }

  /** Load/overwrite a puzzle at any time (expected length: 81). */
  public loadPuzzle(values: ReadonlyArray<number>): void {
    if (!Array.isArray(values) || values.length !== 81) {
      return;
    }
    this.initBoard(values);
  }

  /** Moves the selection on the board */
  public moveSelection(direction: CursorDirectionEnum): void {
    const currentSelection = this.selected();
    if (currentSelection === null) {
      // If nothing is selected, select the center cell
      this.onCellSelected(40);
      return;
    }

    let newIndex = currentSelection;
    const currentRow = Math.floor(currentSelection / 9);
    const currentCol = currentSelection % 9;

    switch (direction) {
      case CursorDirectionEnum.UP:
        if (currentRow > 0) {
          newIndex -= 9;
        } else {
          newIndex += 72; // Wrap to bottom row
        }
        break;
      case CursorDirectionEnum.DOWN:
        if (currentRow < 8) {
          newIndex += 9;
        } else {
          newIndex -= 72; // Wrap to top row
        }
        break;
      case CursorDirectionEnum.LEFT:
        if (currentCol > 0) {
          newIndex -= 1;
        } else {
          newIndex += 8; // Wrap to rightmost column
        }
        break;
      case CursorDirectionEnum.RIGHT:
        if (currentCol < 8) {
          newIndex += 1;
        } else {
          newIndex -= 8; // Wrap to leftmost column
        }
        break;
    }

    this.onCellSelected(newIndex);
  }

  /** Provides access to the cell model for a given index */
  public getCellModel(idx: number): ClientCellModel {
    // Fallback: if board entry is missing, initialize to empty cell to keep template safe
    if (!this.model.board[idx]) {
      this.model.board[idx] = new this.model.CellModelClass(0, false);
    }
    return this.model.board[idx];
  }

  /** Handler when cell is clicked */
  public onCellSelected(i: number): void {
    this.selected.set(i);
    this.selectedIndexChange.emit(i);
  }

  /** Sets a pending value for the currently selected cell */
  public setPendingSelected(value: number, time?: number): boolean {
    const i = this.selected();
    if (i == null) {
      return false;
    }
    const cell = this.model.board[i];
    // Don't set if it matches current pending or dynamic value
    // I THINK THIS NEEDS TO BE MOVED TO THE MODEL FOR PROCESSING
    if (cell.pendingCellState?.pendingValue === value || cell.value === value) {
      return false;
    }
    return this.model.setPendingCell(i, value, time);
  }

  /** Server confirmation for the currently selected cell */
  public confirmSelected(time?: number): boolean {
    const i = this.selected();
    if (i == null) {
      return false;
    }
    const pv = this.model.board[i].pendingCellState?.pendingValue;
    if (pv === undefined) {
      return false;
    }
    return this.model.confirmCellSet(i, pv, time);
  }
  
  /** Rejects the pending value for the currently selected cell */
  public rejectSelected(): void {
    const i = this.selected();
    if (i == null) {
      return;
    }
    this.model.rejectCellSet(i);
  }

  /** Toggles a note for the currently selected cell */
  public toggleNoteSelected(value: number): boolean {
    const i = this.selected();
    if (i == null) {
      return false;
    }
    return this.model.toggleNote(i, value);
  }

  /** Clears the currently selected cell */
  public clearSelected(time?: number): void {
    const i = this.selected();
    if (i == null) {
      return;
    }
    if (this.isNoteMode) {
      // In notes mode, clear notes
      const cell = this.model.board[i];
      cell.notes = [];
    } else {
      // In normal mode, set pending 0 (deletion)
      this.setPendingSelected(0, time);
    }
  }

  /** Sets up the board for the demo page */
  public setupDemoBoard(): void {
    // Showcase cells: notes (2-3), pending (2-3), dynamic placed (2-3)
    // Pick some indices that are empty in the seed puzzle
    const notesCells = [2, 16, 74];
    const pendingCells = [6, 28, 48];
    const dynamicCells = [3, 24, 60];

    // Notes: add candidate numbers
    for (const i of notesCells) {
      const cell = this.model.board[i];
      cell.notes = Array.from({ length: 9 }, (_, n) => n + 1).filter(
        () => Math.round(Math.random()) === 0
      );
    }

    // Pending: set optimistic pending values
    for (const i of pendingCells) {
      const v = (i % 9) + 1;
      this.model.setPendingCell(i, v, performance.now());
    }

    // Dynamic values (non-fixed): place values as if user set them
    for (const i of dynamicCells) {
      const v = (i % 9) + 1;
      // Avoid violating validation (e.g., cooldown): use update directly for demo visuals
      this.model.board[i].update(v, undefined);
    }

    // Place a visible cursor at row 4, col 6 (index 42)
    this.selected.set(42);
  }
}
