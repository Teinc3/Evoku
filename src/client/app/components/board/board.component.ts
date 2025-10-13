import {
  Component,
  signal,
  HostListener,
  type OnInit,
  type DoCheck,
  type OnDestroy,
} from '@angular/core';

import CooldownAnimationHelper from '../../utils/cooldown-animation-helper';
import UtilityAction from '../../../types/utility';
import CursorDirectionEnum from '../../../types/enums/cursor-direction.enum';
import ClientBoardModel from '../../../models/Board';
import SudokuCellComponent from './cell/cell.component';

import type { WritableSignal } from '@angular/core';
import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-board-model',
  standalone: true,
  imports: [SudokuCellComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export default class BoardModelComponent implements OnInit, DoCheck, OnDestroy {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  public readonly model: ClientBoardModel;
  public isNoteMode = false;

  readonly indices: number[];
  readonly selected: WritableSignal<number | null>;
  public readonly cooldownHelper: CooldownAnimationHelper;

  constructor() {
    this.model = new ClientBoardModel();
    this.indices = Array.from({ length: 81 }, (_, i) => i);
    this.selected = signal<number | null>(null);
    this.cooldownHelper = new CooldownAnimationHelper();
  }

  ngOnInit(): void {
    // Initialize with 81 empty cells only if nothing has been loaded yet.
    if (this.model.board.length === 0) {
      this.initBoard([]);
    }
  }

  ngDoCheck(): void {
    this.cooldownHelper.checkCooldownChanges(
      this.model.pendingGlobalCooldownEnd,
      this.model.globalLastCooldownEnd
    );
  }

  ngOnDestroy(): void {
    this.cooldownHelper.destroy();
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
  }
}
