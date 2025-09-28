import { Component, ViewChild } from '@angular/core';

import BoardModelComponent from '../../../components/board/board.component';

import type { AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-demo-board',
  standalone: true,
  imports: [BoardModelComponent],
  templateUrl: './board.demo.html',
  styleUrl: './board.demo.scss'
})
export default class BoardDemoPageComponent implements AfterViewInit {
  @ViewChild('board', { static: true }) board!: BoardModelComponent;
  // Simple puzzle seed; non-zero are fixed
  puzzle: number[];

  constructor() {
    this.puzzle = [
      5,3,0,0,7,0,0,0,0,
      6,0,0,1,9,5,0,0,0,
      0,9,8,0,0,0,0,6,0,
      8,0,0,0,6,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,0,6,
      0,6,0,0,0,0,2,8,0,
      0,0,0,4,1,9,0,0,5,
      0,0,0,0,8,0,0,7,9
    ];
  }

  ngAfterViewInit(): void {
    // Enable demo auto-accept for optimistic pending visualization
    this.board.model.autoAcceptPending = true;
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
      cell.notes = Array.from({ length: 9 }, (_, n) => n + 1)
        .filter(_ => Math.round(Math.random()) === 0);
    }

    // Pending: set optimistic pending values
    for (const i of pendingCells) {
      const v = ((i % 9) + 1);
      this.board.model.setPendingCell(i, v, performance.now());
    }

    // Dynamic values (non-fixed): place values as if user set them
    for (const i of dynamicCells) {
      const v = ((i % 9) + 1);
      // Avoid violating validation (e.g., cooldown): use update directly for demo visuals
      this.board.model.board[i].update(v, undefined);
    }
  }
}
