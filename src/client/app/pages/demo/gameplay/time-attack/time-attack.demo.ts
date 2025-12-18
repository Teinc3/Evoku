import { getSudoku } from 'sudoku-gen';
import { Component, ViewChild, type OnInit } from '@angular/core';

import BoardConverter from '@shared/mechanics/utils/BoardConverter';
import ViewStateService from '../../../../services/view-state';
import PupSpinnerComponent from '../../../../components/pup/pup-spinner/pup-spinner';
import PupSlotsHolderComponent from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import UniversalProgressBarComponent
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import PhaseTimerComponent from '../../../../components/hud/phase-timer/phase-timer.component';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import ClientBoardModel from '../../../../../models/Board';


@Component({
  selector: 'app-demo-time-attack',
  standalone: true,
  imports: [
    BoardModelComponent,
    NumericButtonsHolderComponent,
    UtilityButtonsHolderComponent,
    PhaseTimerComponent,
    UniversalProgressBarComponent,
    PupSpinnerComponent,
    PupSlotsHolderComponent,
  ],
  templateUrl: './time-attack.demo.html',
  styleUrl: './time-attack.demo.scss',
})
export default class TimeAttackDemoPageComponent implements OnInit {
  @ViewChild('board', { static: true })
  board!: BoardModelComponent;
  private puzzle!: number[];
  protected AppView = AppView;
  protected startTime = performance.now();

  constructor(protected viewStateService: ViewStateService) {}

  ngOnInit(): void {
    // Generate a new easy puzzle on each load
    this.puzzle = BoardConverter.toBoardArray(getSudoku('easy').puzzle);
    
    // Create and set the board model with puzzle data
    const boardModel = new ClientBoardModel(this.puzzle);
    this.board.model = boardModel;
  }
}
