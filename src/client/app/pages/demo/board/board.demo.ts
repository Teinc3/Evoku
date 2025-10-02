import { Component, ViewChild, type OnInit } from '@angular/core';

import BoardModelComponent from '../../../components/board/board.component';


@Component({
  selector: 'app-demo-board',
  standalone: true,
  imports: [BoardModelComponent],
  templateUrl: './board.demo.html',
  styleUrl: './board.demo.scss'
})
export default class BoardDemoPageComponent implements OnInit {
  @ViewChild('board', { static: true })
  board!: BoardModelComponent;
  private readonly puzzle = [
    1, 0, 7, 0, 4, 9, 2, 0, 0,
    0, 0, 4, 2, 5, 0, 7, 3, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 6, 0, 3, 2, 5, 1, 0,
    0, 0, 0, 0, 0, 0, 8, 9, 0, 
    5, 1, 0, 0, 0, 6, 3, 4, 2, 
    9, 0, 1, 0, 2, 4, 6, 0, 0, 
    3, 0, 0, 0, 9, 7, 1, 0, 0,
    4, 7, 2, 0, 0, 3, 9, 5, 0,
  ];

  ngOnInit(): void {
    // Enable demo auto-accept for optimistic pending visualization
    this.board.model.autoAcceptPending = true;
    this.board.loadPuzzle(this.puzzle);

    // Showcase cells: notes (2-3), pending (2-3), dynamic placed (2-3)
    const notesCells = [
      { idx: 75, notes: [1, 6] },
      { idx: 76, notes: [1, 6] }
    ];
    const pendingCells = [{ idx: 80, value: 8 }];
    const dynamicCells = [
      { idx: 14, value: 1 },
      { idx: 24, value: 4 }
    ];

    // Directly set value for dynamic placed cells so no cd effect overwrites
    dynamicCells.forEach(c => {
      const cell = this.board.getCellModel(c.idx);
      cell.update(c.value); // No time, no cd
    });
    // And notes
    notesCells.forEach(c => {
      const cell = this.board.getCellModel(c.idx);
      cell.notes = c.notes;
    });

    // Use the given api so as to show the cd effect dynamically.
    pendingCells.forEach(c => {
      this.board.model.setPendingCell(c.idx, c.value, performance.now());
    });
  }
}
