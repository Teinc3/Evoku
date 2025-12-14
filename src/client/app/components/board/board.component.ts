import {
  Component, Input, Output, EventEmitter, signal, HostListener,
  type DoCheck, type OnDestroy, ViewChildren, type QueryList, OnChanges,
  type SimpleChanges,
} from '@angular/core';

import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import CombatFloatingTextComponent from '../combat/floating-text/floating-text';
import CooldownAnimationHelper from '../../utils/cooldown-animation-helper';
import UtilityAction from '../../../types/utility';
import { CursorDirectionEnum } from '../../../types/enums';
import {
  CombatDefuseType,
  type CombatIncomingThreat,
  type CombatOutcomeText
} from '../../../types/combat';
import ClientBoardModel from '../../../models/Board';
import SudokuCellComponent from './cell/cell.component';

import type { WritableSignal } from '@angular/core';
import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { OmitBaseAttrs } from '../../../types/OmitAttrs';
import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-board-model',
  standalone: true,
  imports: [SudokuCellComponent, CombatFloatingTextComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export default class BoardModelComponent implements DoCheck, OnDestroy, OnChanges {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  @Input() public model!: ClientBoardModel;
  /** Whether this board belongs to the current player */
  @Input() public isMe = false;
  /** Combat threat currently targeting this board */
  @Input() public combatThreat: CombatIncomingThreat | null = null;
  /** Floating text notifications to render on this board */
  @Input() public combatMessages: CombatOutcomeText[] = [];
  /** Optional shared current time tick for animations */
  @Input() public currentTimeMs: number | null = null;
  @Output() public sendPacket = new EventEmitter<
    OmitBaseAttrs<AugmentAction<MechanicsActions>>
  >();
  @Output() public selectionChanged = new EventEmitter<void>();
  @ViewChildren(SudokuCellComponent)
  cells!: QueryList<SudokuCellComponent>;

  public isNoteMode = false;
  readonly indices: number[];
  readonly selected: WritableSignal<number | null>;
  public readonly cooldownHelper: CooldownAnimationHelper;
  private threatTargets: number[] = [];
  private rowLineStyle: { top: string; height: string } | null = null;
  private colLineStyle: { left: string; width: string } | null = null;
  private boxStyle: { top: string; left: string; width: string; height: string } | null = null;
  private readonly segmentPercent: number;

  constructor() {
    this.indices = Array.from({ length: 81 }, (_, i) => i);
    this.selected = signal<number | null>(null);
    this.cooldownHelper = new CooldownAnimationHelper();
    this.segmentPercent = 100 / 9;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['combatThreat']) {
      this.rebuildThreatGeometry();
    }
  }

  ngDoCheck(): void {
    this.cooldownHelper.checkCooldownChanges(
      this.model.pendingGlobalCooldownEnd,
      this.model.globalLastCooldownEnd
    );
  }

  ngOnDestroy(): void {
    this.cooldownHelper.reset();
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
    if (!this.isMe) {
      return;
    }

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
      // Check if pending state can be set (i.e. local checks passed)
      const pendingSet = this.model.setPendingCell(i, num, this.nowMs());
      if (pendingSet) {
        // Send to server
        this.sendPacket.emit({
          action: MechanicsActions.SET_CELL,
          cellIndex: i,
          value: num
        });
      }
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

  private nowMs(): number {
    if (this.currentTimeMs !== null) {
      return this.currentTimeMs;
    }

    return Date.now();
  }

  /**
   * Handle rejection of a pending cell set action.
   * Resets animations if the rejection was successful.
   */
  public handleCellRejection(cellIndex: number, rejectedValue: number): void {
    if (this.model.rejectCellSet(cellIndex, rejectedValue)) {
      // Reset global animation
      this.cooldownHelper.reset();
      // Reset cell animation
      const cellComp = this.cells.get(cellIndex);
      if (cellComp) {
        cellComp.cooldownHelper.reset();
      }
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
    this.selectionChanged.emit();
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
    if (!this.isMe && !selectedCell.fixed && selectedValue !== 0) {
      return false;
    }
    
    // Don't highlight opponent's dynamic cells
    const checkedCell = this.getCellModel(cellIndex);
    if (!this.isMe && !checkedCell.fixed && checkedCell.getDisplayValue() !== 0) {
      return false;
    }
    
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

  /** Determine if a cell is currently marked as under threat */
  public isThreatCell(cellIndex: number): boolean {
    if (!this.combatThreat) {
      return false;
    }

    if (this.combatThreat.defuseType === CombatDefuseType.GLOBAL) {
      return true;
    }

    return this.threatTargets.includes(cellIndex);
  }

  public ghostTargets(): number[] {
    if (!this.combatThreat) {
      return [];
    }
    if (this.combatThreat.targetCells && this.combatThreat.targetCells.length > 0) {
      return this.combatThreat.targetCells;
    }
    return this.threatTargets;
  }

  public isThreatCritical(): boolean {
    return this.threatRemainingMs() < 3000;
  }

  public isGlobalThreat(): boolean {
    return this.combatThreat?.defuseType === CombatDefuseType.GLOBAL;
  }

  public threatRemainingMs(): number {
    if (!this.combatThreat || this.currentTimeMs === null) {
      return 0;
    }

    return Math.max(0, this.combatThreat.expiresAtMs - this.currentTimeMs);
  }

  public rowLinePosition(): { top: string; height: string } | null {
    return this.rowLineStyle;
  }

  public colLinePosition(): { left: string; width: string } | null {
    return this.colLineStyle;
  }

  public boxOutlinePosition(): {
    top: string;
    left: string;
    width: string;
    height: string;
  } | null {
    return this.boxStyle;
  }

  public ghostStyle(cellIndex: number): { top: string; left: string } {
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;
    const top = (row + 0.5) * this.segmentPercent;
    const left = (col + 0.5) * this.segmentPercent;
    return {
      top: `${top}%`,
      left: `${left}%`
    };
  }

  private rebuildThreatGeometry(): void {
    this.threatTargets = [];
    this.rowLineStyle = null;
    this.colLineStyle = null;
    this.boxStyle = null;

    if (!this.combatThreat) {
      return;
    }

    if (this.combatThreat.targetCells && this.combatThreat.targetCells.length > 0) {
      this.threatTargets = [...this.combatThreat.targetCells];
      return;
    }

    const idx = this.combatThreat.targetIndex ?? 0;
    switch (this.combatThreat.defuseType) {
      case CombatDefuseType.ROW:
        this.threatTargets = this.computeRowTargets(idx);
        this.rowLineStyle = this.buildRowStyle(idx);
        break;
      case CombatDefuseType.COL:
        this.threatTargets = this.computeColTargets(idx);
        this.colLineStyle = this.buildColStyle(idx);
        break;
      case CombatDefuseType.BOX:
        this.threatTargets = this.computeBoxTargets(idx);
        this.boxStyle = this.buildBoxStyle(idx);
        break;
      case CombatDefuseType.GLOBAL:
        this.threatTargets = this.indices;
        break;
    }
  }

  private computeRowTargets(rowIndex: number): number[] {
    const start = rowIndex * 9;
    return Array.from({ length: 9 }, (_, offset) => start + offset);
  }

  private computeColTargets(colIndex: number): number[] {
    return Array.from({ length: 9 }, (_, row) => row * 9 + colIndex);
  }

  private computeBoxTargets(boxIndex: number): number[] {
    const startRow = Math.floor(boxIndex / 3) * 3;
    const startCol = (boxIndex % 3) * 3;
    const targets: number[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        targets.push((startRow + r) * 9 + (startCol + c));
      }
    }
    return targets;
  }

  private buildRowStyle(rowIndex: number): { top: string; height: string } {
    return {
      top: `${rowIndex * this.segmentPercent}%`,
      height: `${this.segmentPercent}%`
    };
  }

  private buildColStyle(colIndex: number): { left: string; width: string } {
    return {
      left: `${colIndex * this.segmentPercent}%`,
      width: `${this.segmentPercent}%`
    };
  }

  private buildBoxStyle(boxIndex: number): {
    top: string;
    left: string;
    width: string;
    height: string;
  } {
    const startRow = Math.floor(boxIndex / 3) * 3;
    const startCol = (boxIndex % 3) * 3;
    return {
      top: `${startRow * this.segmentPercent}%`,
      left: `${startCol * this.segmentPercent}%`,
      width: `${this.segmentPercent * 3}%`,
      height: `${this.segmentPercent * 3}%`
    };
  }
}
