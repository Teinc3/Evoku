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
      this.seed(this.puzzle);
    }
  }

  private seed(values: ReadonlyArray<number>): void {
    // Initialize board with provided puzzle, marking non-zero as fixed
    for (let i = 0; i < 81; i++) {
      const v = values[i] ?? 0;
      this.model.board[i] = new this.model.CellModelClass(v, v !== 0);
    }
  }

  cell(i: number): ClientCellModel {
    return this.model.board[i];
  }

  onCellSelected(i: number): void {
    this.selected.set(i);
    this.selectedIndexChange.emit(i);
    // Visually clear other selections
    this.cellComps?.forEach((comp, idx) => {
      if (idx !== i) {
        comp.deselect();
      }
    });
  }

  setPendingSelected(value: number, time?: number): boolean {
    const i = this.selected();
    if (i == null) {
      return false;
    }
    return this.model.setPendingCell(i, value, time);
  }
  confirmSelected(time?: number): boolean {
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
  rejectSelected(): void {
    const i = this.selected();
    if (i == null) {
      return;
    }
    this.model.rejectCellSet(i);
  }
}
