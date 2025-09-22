// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Router } from '@angular/router';
import { Component, ViewChild } from '@angular/core';

import UtilityButtonsHolderComponent 
  from '../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../components/board/board.component';
import UtilityAction from '../../../../types/utility';

import type { AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-time-attack-demo-page',
  standalone: true,
  imports: [
    BoardModelComponent,
    NumericButtonsHolderComponent,
    UtilityButtonsHolderComponent,
  ],
  templateUrl: './time-attack.demo.html',
  styleUrl: './time-attack.demo.scss',
})
export default class TimeAttackDemoPageComponent implements AfterViewInit {
  @ViewChild('board', { static: true }) board!: BoardModelComponent;
  selected: number | null;
  isNoteMode = false;
  // Simple puzzle seed; non-zero are fixed
  puzzle: number[];

  constructor(private readonly router: Router) {
    this.selected = null;
    this.puzzle = [
      5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0,
      6, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2,
      0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0,
      0, 8, 0, 0, 7, 9,
    ];
  }

  ngAfterViewInit(): void {
    // Load puzzle onto the pre-initialized empty board
    this.board.loadPuzzle(this.puzzle);
    // Showcase cells: notes (2-3), pending (2-3), dynamic placed (2-3)
    // Pick some indices that are empty in the seed puzzle
    const notesCells = [2, 16, 74];
    const pendingCells = [6, 28, 48];
    const dynamicCells = [3, 24, 60];

    // Notes: add candidate numbers
    for (const i of notesCells) {
      const cell = this.board.model.board[i];
      cell.notes = Array.from({ length: 9 }, (_, n) => n + 1).filter(
        () => Math.round(Math.random()) === 0
      );
    }

    // Pending: set optimistic pending values
    for (const i of pendingCells) {
      const v = (i % 9) + 1;
      this.board.model.setPendingCell(i, v, performance.now());
    }

    // Dynamic values (non-fixed): place values as if user set them
    for (const i of dynamicCells) {
      const v = (i % 9) + 1;
      // Avoid violating validation (e.g., cooldown): use update directly for demo visuals
      this.board.model.board[i].update(v, undefined);
    }

    // Place a visible cursor at row 4, col 6 (index 42)
    this.board.selected.set(42);
    this.selected = 42;
  }

  onNumberClick(num: number): void {
    if (this.selected === null) return;

    if (this.isNoteMode) {
      this.board.toggleNoteSelected(num);
    } else {
      this.board.setPendingSelected(num, performance.now());
    }
  }

  onUtilityAction(action: UtilityAction): void {
    switch (action) {
      case UtilityAction.CLEAR:
        if (this.selected === null) return;
        this.board.clearSelected();
        break;
      case UtilityAction.NOTE:
        this.isNoteMode = !this.isNoteMode;
        // We can add some visual feedback for the note button here
        break;
      case UtilityAction.QUIT:
        this.router.navigate(['/']);
        break;
    }
  }

  randPending(): void {
    if (this.selected == null) {
      return;
    }
    const v = ((Math.random() * 9) | 0) + 1;
    this.board.setPendingSelected(v, performance.now());
  }
  confirm(): void {
    this.board.confirmSelected(performance.now());
  }
  reject(): void {
    this.board.rejectSelected();
  }
}