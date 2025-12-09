import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { MechanicsActions, LifecycleActions, ProtocolActions } from '@shared/types/enums/actions/';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import PupSlotsHolderComponent 
  from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import PupOrbSpinnerComponent 
  from '../../../../components/pup/pup-orb-spinner/pup-orb-spinner';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import GameStateManager from '../../../../../game/GameStateManager';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { MatchFoundContract } from '@shared/types/contracts';
import type { OmitBaseAttrs } from '../../../../../types/OmitAttrs';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  imports: [
    DuelHudTopComponent, 
    BoardModelComponent, 
    UniversalProgressBarComponent, 
    UtilityButtonsHolderComponent, 
    NumericButtonsHolderComponent,
    PupSlotsHolderComponent,
    PupOrbSpinnerComponent
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent implements OnInit, OnDestroy {
  static readonly MAX_PLAYER_COUNT = 2;
  public readonly gameState: GameStateManager;
  private subscriptions = new Subscription();
  private nextActionId = 0;

  @ViewChild('board1') board1!: BoardModelComponent;
  @ViewChild('board2') board2!: BoardModelComponent;

  constructor(
    private viewStateService: ViewStateService,
    private networkService: NetworkService
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
  }

  ngOnInit(): void {
    // Load match data from navigation and transfer to our owned model
    const matchData = this.viewStateService.getNavigationData<MatchFoundContract>();
    if (matchData) {
      this.gameState.createGame(matchData);
    }

    // Subscribe to disconnection events
    this.subscriptions.add(this.networkService.onDisconnect().subscribe(() => {
      // Navigate back to catalogue on disconnect
      this.viewStateService.navigateToView(AppView.CATALOGUE);
    }));

    // Subscribe to game initialization events
    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.GAME_INIT)
      .subscribe(data => {
        // Initialize game states with the board data from server
        this.gameState.initGameStates(data.cellValues);
      }));

    // Subscribe to cell set confirmations
    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.CELL_SET)
      .subscribe(data => {
        // Confirm the cell placement
        const board = this.gameState.getPlayerBoard(data.playerID);
        if (board) {
          // TODO: Check if this is our own pending action confirmed
          // If so, use our original client time instead of estimating from server time
          const clientTime = this.gameState.timeCoordinator.estimateClientTime(data.serverTime);
          board.confirmCellSet(data.cellIndex, data.value, clientTime);
        }
      }));

    // Subscribe to ping packets for time synchronization
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.PING)
      .subscribe(data => {
        // Handle ping and send pong response
        this.gameState.handlePing(data, (action, pongData) => {
          this.networkService.send(action, pongData);
        });
      }));
  }

  ngOnDestroy(): void {
    // Clear our local match state
    this.gameState.clearMatchData();
    this.subscriptions.unsubscribe();
  }

  /** Handle packet requests from board components */
  onPacketRequest(request: OmitBaseAttrs<AugmentAction<MechanicsActions>>): void {
    const { action, ...data } = request;
    this.networkService.send(action, {
      clientTime: this.gameState.timeCoordinator.clientTime,
      actionID: this.nextActionId++,
      ...data
    });
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
