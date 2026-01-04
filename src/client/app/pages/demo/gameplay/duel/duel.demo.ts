import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';

import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import PupSpinnerComponent 
  from '../../../../components/pup/pup-spinner/pup-spinner';
import PupSlotsHolderComponent 
  from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import { DuelActionDispatcher, DuelActionListener } from '../../../../../game/handlers';
import GameStateManager from '../../../../../game/GameStateManager';

import type { MatchFoundContract } from '@shared/types/contracts';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  providers: [DuelActionDispatcher, DuelActionListener],
  imports: [
    DuelHudTopComponent, 
    BoardModelComponent, 
    UniversalProgressBarComponent, 
    UtilityButtonsHolderComponent, 
    NumericButtonsHolderComponent,
    PupSlotsHolderComponent,
    PupSpinnerComponent,
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent implements OnInit, OnDestroy, AfterViewInit {
  static readonly MAX_PLAYER_COUNT = 2;
  public readonly gameState: GameStateManager;
  private subscriptions = new Subscription();
  protected AppView = AppView;

  @ViewChild('board1')
  board1!: BoardModelComponent;
  @ViewChild('board2')
  board2!: BoardModelComponent;
  @ViewChild('pupSpinner')
  pupSpinner?: PupSpinnerComponent;
  @ViewChild('myPupSlots')
  myPupSlots?: PupSlotsHolderComponent;

  constructor(
    protected viewStateService: ViewStateService,
    protected readonly duelActionDispatcher: DuelActionDispatcher,
    protected readonly duelActionListener: DuelActionListener,
    private readonly networkService: NetworkService
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
    this.duelActionDispatcher.gameInit(this.gameState);
    this.duelActionListener.gameInit(this.gameState);

    this.duelActionListener.setContext({
      onDisconnect: () => this.viewStateService.navigateToView(AppView.CATALOGUE)
    });
  }

  ngAfterViewInit(): void {
    this.duelActionDispatcher.setAccessContexts(
      {
        selected: () => this.board1.selected(),
        getCellValue: (cellIndex: number) => this.board1.model.board[cellIndex]?.value ?? null
      },
      {
        selected: () => this.board2.selected(),
        getCellValue: (cellIndex: number) => this.board2.model.board[cellIndex]?.value ?? null
      },
      (slotIndex: number) => this.myPupSlots?.shakeSlot(slotIndex)
    );

    this.duelActionListener.setContext({
      onDisconnect: () => this.viewStateService.navigateToView(AppView.CATALOGUE),
      onCellRejection: (cellIndex: number, value: number) => {
        this.board1.handleCellRejection(cellIndex, value);
      },
      onBeginPupSettling: () => this.pupSpinner?.beginSettling(),
      onSetPupSettlingType: element => this.pupSpinner?.setSettlingType(element)
    });
  }

  ngOnInit(): void {
    // Load match data from navigation and transfer to our owned model
    const matchData = this.viewStateService.getNavigationData<MatchFoundContract>();
    if (matchData) {
      this.gameState.createGame(matchData);
    }

    this.subscriptions.add(this.duelActionListener.bind());
  }

  ngOnDestroy(): void {
    this.gameState.clearMatchData();
    this.networkService.disconnect();
  }

  /** Handle quit action: disconnect and navigate to catalogue */
  onQuit(): void {
    this.networkService.disconnect();
    this.viewStateService.navigateToView(AppView.CATALOGUE);
  }

  /** Handle selection changes to ensure only one board has a cursor */
  onBoardSelectionChanged(boardIndex: number): void {
    if (boardIndex === 0) {
      this.board2.selected.set(null);
    } else if (boardIndex === 1) {
      this.board1.selected.set(null);
    }
  }
}
