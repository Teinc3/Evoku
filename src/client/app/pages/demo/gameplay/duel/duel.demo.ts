import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import ActionGuard from '@shared/types/utils/typeguards/actions';
import MatchStatus from '@shared/types/enums/matchstatus';
import { 
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
  WaterPUPActions,
  FirePUPActions,
  WoodPUPActions,
  EarthPUPActions,
  MetalPUPActions,
  type PlayerActions
} from '@shared/types/enums/actions/';
import pupConfig from '@config/shared/pup.json';
import sharedConfig from '@config/shared/base.json';
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
import GameStateManager from '../../../../../game/GameStateManager';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type {
  PupDrawnContract,
  PupSpunContract
} from '@shared/types/contracts/match/player/mechanics/DrawPupContract';
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
    PupSpinnerComponent,
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent implements OnInit, OnDestroy {
  static readonly MAX_PLAYER_COUNT = 2;
  public readonly gameState: GameStateManager;
  private subscriptions = new Subscription();
  private nextActionId = 0;

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

  /** Handle packet requests from board components */
  onPacketRequest(request: OmitBaseAttrs<AugmentAction<PlayerActions>>): void {
    const actionData = {
      clientTime: this.gameState.timeCoordinator.clientTime,
      actionID: this.nextActionId++,
      ...request
    };
    // Store the action for potential lookup on confirmation
    this.gameState.pendingActions.set(actionData.actionID, actionData);
    // Then send the packet to the server
    const { action, ...data } = actionData;
    this.networkService.send(action, data);
    console.log('Sent action:', action, data);
  }

  onPupRoll(): void {
    this.onPacketRequest({
      action: MechanicsActions.DRAW_PUP
    });
  }

  onMyPupSlotClicked(slotIndex: number): void {
    const playerGameState = this.gameState.getPlayerState(this.gameState.myID).gameState;
    if (!playerGameState) {
      return;
    }

    const slot = playerGameState.powerups[slotIndex];
    const now = this.gameState.timeCoordinator.clientTime;
    const effectiveCooldownEnd = Math.max(slot.lastCooldownEnd, slot.pendingCooldownEnd ?? 0);

    if (!slot.pup || slot.locked || effectiveCooldownEnd > now) {
      this.myPupSlots?.shakeSlot(slotIndex);
      return;
    }

    const { pup } = slot;
    const { pupID } = pup;
    const enemyID = 1 - this.gameState.myID;

    // Optimistic cooldown: apply for Yang PUPs (challenge cooldown)
    if (pupConfig[pup.type].theme === true) {
      const duration = sharedConfig.game.challenge.duration[this.gameState.matchState.phase];
      slot.pendingCooldownEnd = now + duration;
    }

    switch (pup.type) {
      // Water
      case 0: {
        // Cryo requires an enemy cell target
        const enemyCellIndex = this.board2.selected();
        if (enemyCellIndex === null) {
          this.myPupSlots?.shakeSlot(slotIndex);
          return;
        }

        this.onPacketRequest({
          action: WaterPUPActions.USE_CRYO,
          pupID,
          targetID: enemyID,
          cellIndex: enemyCellIndex,
        });
        return;
      }
      case 1: {
        this.onPacketRequest({
          action: WaterPUPActions.USE_PURITY,
          pupID,
        });
        return;
      }

      // Fire
      case 2: {
        // Inferno requires an enemy cell target
        const enemyCellIndex = this.board2.selected();
        if (enemyCellIndex === null) {
          this.myPupSlots?.shakeSlot(slotIndex);
          return;
        }

        this.onPacketRequest({
          action: FirePUPActions.USE_INFERNO,
          pupID,
          targetID: enemyID,
          cellIndex: enemyCellIndex,
        });
        return;
      }
      case 3: {
        this.onPacketRequest({
          action: FirePUPActions.USE_METABOLIC,
          pupID,
        });
        return;
      }

      // Wood
      case 4: {
        this.onPacketRequest({
          action: WoodPUPActions.USE_ENTANGLE,
          pupID,
          targetID: enemyID,
        });
        return;
      }
      case 5: {
        this.onPacketRequest({
          action: WoodPUPActions.USE_WISDOM,
          pupID,
        });
        return;
      }

      // Earth
      case 6: {
        this.onPacketRequest({
          action: EarthPUPActions.USE_LANDSLIDE,
          pupID,
          targetID: enemyID,
        });
        return;
      }
      case 7: {
        // Excavate requires a selected cell on your board
        const myCellIndex = this.board1.selected();
        if (myCellIndex === null) {
          this.myPupSlots?.shakeSlot(slotIndex);
          return;
        }

        this.onPacketRequest({
          action: EarthPUPActions.USE_EXCAVATE,
          pupID,
          cellIndex: myCellIndex,
        });
        return;
      }

      // Metal
      case 8: {
        // Check selected cell's number (both own and opponent selected cell is fine)
        const board1Selected = this.board1.selected();
        const board2Selected = this.board2.selected();

        const value = board1Selected !== null
          ? this.board1.model.board[board1Selected].value
          : board2Selected !== null
            ? this.board2.model.board[board2Selected].value
            : null;
          
        if (value === null || value <= 0) {
          this.myPupSlots?.shakeSlot(slotIndex);
          return;
        }

        this.onPacketRequest({
          action: MetalPUPActions.USE_LOCK,
          pupID,
          targetID: enemyID,
          value,
        });
        return;
      }
      case 9: {
        this.onPacketRequest({
          action: MetalPUPActions.USE_FORGE,
          pupID,
        });
        return;
      }
      default: {
        // Unknown PUP, shake the slot to indicate error
        this.myPupSlots?.shakeSlot(slotIndex);
      }
    }
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
