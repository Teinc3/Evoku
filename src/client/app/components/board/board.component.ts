import {
  Component, EventEmitter, Output, signal, HostListener, type OnInit, type OnDestroy
} from '@angular/core';

import SudokuCellComponent from '../cell/cell.component';
import UtilityAction from '../../../types/utility';
import CursorDirectionEnum from '../../../types/cursor-direction.enum';
import ClientBoardModel from '../../../models/Board';

import type { WritableSignal } from '@angular/core';
import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-board-model',
  standalone: true,
  imports: [SudokuCellComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export default class BoardModelComponent implements OnInit, OnDestroy {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  public readonly model: ClientBoardModel;
  public isNoteMode = false;

  @Output()
  selectedIndexChange = new EventEmitter<number>();

  // Flat indices 0..80 for a 9x9 board
  readonly indices: number[];
  readonly selected: WritableSignal<number | null>;
  readonly globalCooldownPercentage = signal<number | null>(null);
  private updateInterval?: number;

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
      this.parseNumberKey(num);
      return;
    }

    // Handle other actions
    switch (key) {
      case 'Backspace':
      case '0':
        this.parseNumberKey(0);
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

    // Update global cooldown percentage every 20ms for smoother animation
    this.updateInterval = window.setInterval(() => {
      this.globalCooldownPercentage.set(this.calculateGlobalCooldownPercentage());
    }, 20);
    // Initial update
    this.globalCooldownPercentage.set(this.calculateGlobalCooldownPercentage());
  }

  ngOnDestroy(): void {
    if (this.updateInterval !== undefined) {
      clearInterval(this.updateInterval);
    }
  }

  private calculateGlobalCooldownPercentage(): number | null {
    const endTime = this.model.getDisplayGlobalCooldownEnd();
    if (!endTime || endTime <= performance.now()) {
      return null;
    }
    const remaining = endTime - performance.now();
    const total = 5000; // BaseBoardModel.GLOBAL_COOLDOWN_DURATION
    return Math.max(0, Math.min(1, remaining / total));
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

  public parseNumberKey(num: number) {
    const i = this.selected();
    if (i === null) {
      return;
    }

    // See if we have notes to clear
    if (num === 0 && this.getCellModel(i).wipeNotes()) {
      return;      
    }

    // Otherwise, treat as normal
    if (this.isNoteMode) {
      this.model.toggleNote(i, num);
    } else {
      this.model.setPendingCell(i, num, performance.now());
    }
  }

  public onUtilityAction(action: UtilityAction) {
    switch (action) {
      case UtilityAction.CLEAR:
        this.parseNumberKey(0);
        break;
      case UtilityAction.NOTE:
        this.isNoteMode = !this.isNoteMode;
        // We can add some visual feedback for the note button here
        break;
    }
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
    if (i === null) {
      return false;
    }
    return this.model.setPendingCell(i, value, time);
  }

  /** Server confirmation for the currently selected cell */
  public confirmSelected(time?: number): boolean {
    const i = this.selected();
    if (i === null) {
      return false;
    }
    const pv = this.getCellModel(i).pendingCellState?.pendingValue;
    if (pv === undefined) {
      return false;
    }
    return this.model.confirmCellSet(i, pv, time);
  }
  
  /** Rejects the pending value for the currently selected cell */
  public rejectSelected(): void {
    const i = this.selected();
    if (i === null) {
      return;
    }
    this.model.rejectCellSet(i);
  }
}
