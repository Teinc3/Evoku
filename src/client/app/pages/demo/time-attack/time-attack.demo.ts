import { Component, ViewChild } from '@angular/core';

import UtilityButtonsHolderComponent 
  from '../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../components/board/board.component';
import UtilityAction from '../../../../types/utility';

import type { AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-demo-time-attack',
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
  @ViewChild('board', { static: true })
  board!: BoardModelComponent;
  isNoteMode = false;
  puzzle: number[];

  constructor() {
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
    this.board.setupDemoBoard();
  }

  onNumberClick(num: number): void {
    if (this.board.selected() === null) {
      return;
    }

    if (this.isNoteMode) {
      this.board.toggleNoteSelected(num);
    } else {
      this.board.setPendingSelected(num, performance.now());
    }
  }

  onUtilityAction(action: UtilityAction): void {
    switch (action) {
      case UtilityAction.CLEAR:
        if (this.board.selected() === null) {
          return;
        }
        this.board.clearSelected();
        break;
      case UtilityAction.NOTE:
        this.isNoteMode = !this.isNoteMode;
        this.board.isNoteMode = this.isNoteMode;
        // We can add some visual feedback for the note button here
        break;
    }
  }

  randPending(): void {
    if (this.board.selected() == null) {
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