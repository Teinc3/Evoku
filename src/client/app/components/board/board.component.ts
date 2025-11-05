import {
  Component, Input, signal, HostListener,
  type DoCheck, type OnDestroy,
} from '@angular/core';

import CooldownAnimationHelper from '../../utils/cooldown-animation-helper';
import UtilityAction from '../../../types/utility';
import { CursorDirectionEnum } from '../../../types/enums';
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
export default class BoardModelComponent implements DoCheck, OnDestroy {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  @Input() public model!: ClientBoardModel;
  public isNoteMode = false;

  readonly indices: number[];
  readonly selected: WritableSignal<number | null>;
  public readonly cooldownHelper: CooldownAnimationHelper;

  constructor() {
    this.indices = Array.from({ length: 81 }, (_, i) => i);
    this.selected = signal<number | null>(null);
    this.cooldownHelper = new CooldownAnimationHelper();
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

  /** Checks if a cell is in the same row, column, or 3x3 grid as the selected cell */
  public isRelatedCell(cellIndex: number): boolean {
    const selectedIndex = this.selected();
    if (selectedIndex === null || selectedIndex === cellIndex) {
      return false;
    }

    const selectedRow = Math.floor(selectedIndex / 9);
    const selectedCol = selectedIndex % 9;
    const cellRow = Math.floor(cellIndex / 9);
    const cellCol = cellIndex % 9;

    // Same row or column
    if (cellRow === selectedRow || cellCol === selectedCol) {
      return true;
    }

    // Same 3x3 grid
    const selectedBox = Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
    const cellBox = Math.floor(cellRow / 3) * 3 + Math.floor(cellCol / 3);
    return selectedBox === cellBox;
  }

  /** Checks if a cell has the same number as the selected cell */
  public isSameNumberCell(cellIndex: number): boolean {
    const selectedIndex = this.selected();
    if (selectedIndex === null || selectedIndex === cellIndex) {
      return false;
    }

    const selectedCell = this.getCellModel(selectedIndex);
    const selectedValue = selectedCell.getDisplayValue();
    
    // Don't highlight cells with value 0
    if (selectedValue === 0) {
      return false;
    }

    const cell = this.getCellModel(cellIndex);
    const cellValue = cell.getDisplayValue();
    
    return cellValue === selectedValue;
  }

  /** Checks if a note should be highlighted (matches selected cell's value) */
  public shouldHighlightNote(noteDigit: number): boolean {
    const selectedIndex = this.selected();
    if (selectedIndex === null) {
      return false;
    }

    const selectedCell = this.getCellModel(selectedIndex);
    const selectedValue = selectedCell.getDisplayValue();
    
    // Don't highlight notes for value 0
    if (selectedValue === 0) {
      return false;
    }

    return noteDigit === selectedValue;
  }
}
