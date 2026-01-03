import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';

import ActionGuard from '@shared/types/utils/typeguards/actions';
import MatchStatus from '@shared/types/enums/matchstatus';
import { 
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
} from '@shared/types/enums/actions/';
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
import { DuelActionHandler } from '../../../../../game/handlers';
import GameStateManager from '../../../../../game/GameStateManager';

import type {
  PupDrawnContract,
  PupSpunContract
} from '@shared/types/contracts/match/player/mechanics/DrawPupContract';
import type { MatchFoundContract } from '@shared/types/contracts';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  providers: [DuelActionHandler],
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

  @ViewChild('board1')
  board1!: BoardModelComponent;
  @ViewChild('board2')
  board2!: BoardModelComponent;
  @ViewChild('pupSpinner')
  pupSpinner?: PupSpinnerComponent;
  @ViewChild('myPupSlots')
  myPupSlots?: PupSlotsHolderComponent;


  protected get canSpinPupSpinner(): boolean {
    const powerups = this.gameState.getPlayerState(this.gameState.myID).gameState?.powerups;
    if (!powerups) {
      return true;
    }

    return powerups.some(slot => !slot.pup && !slot.locked
      && Math.max(slot.lastCooldownEnd, slot.pendingCooldownEnd ?? 0)
        < this.gameState.timeCoordinator.clientTime
    );
  }

  constructor(
    private viewStateService: ViewStateService,
    private networkService: NetworkService,
    protected readonly duelActionHandler: DuelActionHandler
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
    this.duelActionHandler.gameInit(this.gameState);
  }

  ngAfterViewInit(): void {
    this.duelActionHandler.setAccessContexts(
      {
        selected: () => {
          return this.board1.selected();
        },
        getCellValue: (cellIndex: number) => {
          return this.board1.model.board[cellIndex]?.value ?? null;
        }
      },
      {
        selected: () => {
          return this.board2.selected();
        },
        getCellValue: (cellIndex: number) => {
          return this.board2.model.board[cellIndex]?.value ?? null;
        }
      },
      (slotIndex: number) => {
        this.myPupSlots?.shakeSlot(slotIndex);
      }
    );
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
        this.gameState.timeCoordinator.onGameInit();
        this.gameState.matchState.status = MatchStatus.ONGOING;
      })
    );

    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.GAME_OVER)
      .subscribe(async _data => {
        this.gameState.matchState.status = MatchStatus.ENDED;
      })
    );

    // Subscribe to phase transition events
    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.PHASE_TRANSITION)
      .subscribe(data => {
        this.gameState.matchState.phase = data.newPhase;
      })
    );

    // Subscribe to board progress updates
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.UPDATE_PROGRESS)
      .subscribe(data => {
        const playerGameState = this.gameState.getPlayerState(data.playerID).gameState;
        if (!playerGameState) {
          return;
        }

        if (data.isBoard) {
          const playerBoardModel = playerGameState.boardState;
          playerBoardModel.progress = data.progress;
        } else {
          playerGameState.pupProgress = data.progress;
        }
      })
    );

    // Subscribe to cell set confirmations
    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.CELL_SET)
      .subscribe(data => {
        // Confirm the cell placement
        const board = this.gameState.getPlayerBoard(data.playerID);
        if (board) {
          // Check if this is our own pending action confirmed
          let clientTime: number;
          const pendingAction = (data.playerID === this.gameState.myID)
            ? this.gameState.pendingActions.get(data.actionID)
            : undefined;

          if (pendingAction) {
            clientTime = pendingAction.clientTime;
            this.gameState.pendingActions.delete(data.actionID);
          } else {
            clientTime = this.gameState.timeCoordinator.estimateClientTime(data.serverTime);
          }
          board.confirmCellSet(data.cellIndex, data.value, clientTime);
        }
      })
    );

    // Subscribe to action rejections
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.REJECT_ACTION)
      .subscribe(data => {
        // Reject the pending action - REJECT_ACTION is sent to the client who sent the action
        const pendingAction = this.gameState.pendingActions.get(data.actionID);
        if (pendingAction) {
          this.gameState.pendingActions.delete(data.actionID);
          const board = this.gameState.getPlayerBoard(this.gameState.myID);
          if (board) {
            // Reject the cell set
            if (ActionGuard.isActionContract(MechanicsActions.SET_CELL, pendingAction)) {
              this.board1.handleCellRejection(pendingAction.cellIndex, pendingAction.value);
              return;
            }
          }
          
          // Cancel optimistic cooldowns for PUP usage
          if (ActionGuard.isPUPActionsData(pendingAction)) {
            const playerGameState = this.gameState.getPlayerState(this.gameState.myID).gameState;
            if (!playerGameState) {
              return;
            }

            const slot = playerGameState.powerups.find(s => s.pup?.pupID === pendingAction.pupID);
            if (slot) {
              slot.pendingCooldownEnd = undefined;
            }
          }
        }
      })
    );

    // Subscribe to ping packets for time synchronization
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.PING)
      .subscribe(data => {
        // Handle ping and send pong response
        this.gameState.handlePing(data, (action, pongData) => {
          this.networkService.send(action, pongData);
        });
      })
    );

    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.PUP_DRAWN)
      .subscribe((data: PupDrawnContract) => {
        const { playerID, slotIndex, ...pupData } = data;
        const playerGameState = this.gameState.getPlayerState(playerID).gameState;
        if (!playerGameState) {
          return;
        }

        const slot = playerGameState.powerups[slotIndex];
        slot.pup = pupData;
        slot.locked = false;
        slot.pendingCooldownEnd = undefined;

        if (playerID === this.gameState.myID) {
          this.pupSpinner?.beginSettling();
        }
      })
    );

    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.PUP_SPUN)
      .subscribe((data: PupSpunContract) => {
        const playerGameState = this.gameState.getPlayerState(this.gameState.myID).gameState;
        if (!playerGameState) {
          return;
        }

        const slot = playerGameState.powerups[data.slotIndex];
        if (!slot) {
          return;
        }

        slot.locked = true;
        this.pupSpinner?.setSettlingType(data.element);
      })
    );
  }

  ngOnDestroy(): void {
    // Clear our local match state
    this.gameState.clearMatchData();
    this.subscriptions.unsubscribe();
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
