import { Component, EventEmitter, Input, Output, ViewChildren, signal } from '@angular/core';

import SudokuCellComponent from '../cell/cell.component';
import ClientBoardModel from '../../../models/Board';

import type { QueryList, OnInit } from '@angular/core';
import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-sudoku-board-model',
  standalone: true,
  imports: [SudokuCellComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export default class BoardModelComponent implements OnInit {
  // Public model instance, composed here. Parent can access it via template ref if needed.
  public readonly model = new ClientBoardModel();

  @Input()
  puzzle: ReadonlyArray<number> = [];
  @Output()
  selectedIndexChange = new EventEmitter<number>();

  @ViewChildren(SudokuCellComponent)
  private cellComps!: QueryList<SudokuCellComponent>;

  // Flat indices 0..80 for a 9x9 board
  readonly indices = Array.from({ length: 81 }, (_, i) => i);
  readonly selected = signal<number | null>(null);

  ngOnInit(): void {
    if (this.puzzle.length === 81) {
      this.initBoard(this.puzzle);
    } else {
      // Ensure the board is always initialized with 81 cells so child components have a model
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
    // Visually clear other selections
    this.cellComps?.forEach(comp => {
      // Use the component's index rather than iteration index to ensure correctness
      if (comp.index === i) {
        comp.isSelected = true;
      } else {
        comp.deselect();
      }
    });
  }

  /** Sets a pending value for the currently selected cell */
  public setPendingSelected(value: number, time?: number): boolean {
    const i = this.selected();
    if (i == null) {
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
}
