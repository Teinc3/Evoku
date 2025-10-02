import { getSudoku } from 'sudoku-gen';
import { Component, ViewChild, type OnInit } from '@angular/core';

import BoardConverter from '@shared/mechanics/utils/BoardConverter';
import AppView from '../../../types/app-view';
import ViewStateService from '../../../services/view-state.service';
import UtilityButtonsHolderComponent 
  from '../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../components/board/board.component';


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
export default class TimeAttackDemoPageComponent implements OnInit {
  @ViewChild('board', { static: true })
  board!: BoardModelComponent;
  puzzle: number[];

  protected AppView = AppView;

  constructor(protected viewStateService: ViewStateService) {
    // Let every puzzle be random for this one :D
    this.puzzle = BoardConverter.toBoardArray(getSudoku('easy').puzzle);
  }

  ngOnInit(): void {
    // Enable demo auto-accept for optimistic pending visualization (time attack sandbox)
    this.board.model.autoAcceptPending = true;
    // Load puzzle onto the pre-initialized empty board
    this.board.loadPuzzle(this.puzzle);
  }
}