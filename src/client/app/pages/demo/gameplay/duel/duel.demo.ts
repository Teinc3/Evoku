import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';

import ActionGuard from '@shared/types/utils/typeguards/actions';
import MatchStatus from '@shared/types/enums/matchstatus';
import { 
  MechanicsActions, LifecycleActions, ProtocolActions, type PlayerActions
} from '@shared/types/enums/actions/';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import PupSlotsHolderComponent 
  from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import PupOrbSpinnerComponent 
  from '../../../../components/pup/pup-orb-spinner/pup-orb-spinner';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import CombatBadgeComponent from '../../../../components/hud/combat-badge/combat-badge';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import {
  CombatDefuseType,
  type CombatIncomingThreat,
  type CombatOutcomeText
} from '../../../../../types/combat';
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
    PupOrbSpinnerComponent,
    CombatBadgeComponent
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent implements OnInit, OnDestroy {
  static readonly MAX_PLAYER_COUNT = 2;
  public readonly gameState: GameStateManager;
  public readonly nowTick = signal(performance.now());
  public readonly myCombatThreat = signal<CombatIncomingThreat | null>(null);
  public readonly opponentCombatThreat = signal<CombatIncomingThreat | null>(null);
  public readonly myCombatMessages = signal<CombatOutcomeText[]>([]);
  public readonly opponentCombatMessages = signal<CombatOutcomeText[]>([]);
  private subscriptions = new Subscription();
  private nextActionId = 0;
  private uiTickInterval?: number;
  private combatTimers: number[] = [];

  @ViewChild('board1') board1!: BoardModelComponent;
  @ViewChild('board2') board2!: BoardModelComponent;

  constructor(
    private viewStateService: ViewStateService,
    private networkService: NetworkService
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
  }

  ngOnInit(): void {
    this.startUiTicker();
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
            // TODO: Handle rejection for different action types
            // For now, just reject the cell set
            if (ActionGuard.isActionContract(MechanicsActions.SET_CELL, pendingAction)) {
              this.board1.handleCellRejection(pendingAction.cellIndex, pendingAction.value);
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

    this.initCombatShowcase();
  }

  ngOnDestroy(): void {
    // Clear our local match state
    this.gameState.clearMatchData();
    this.subscriptions.unsubscribe();
    this.stopUiTicker();
    this.clearCombatTimers();
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
  }

  /** Handle selection changes to ensure only one board has a cursor */
  onBoardSelectionChanged(boardIndex: number): void {
    if (boardIndex === 0) {
      this.board2.selected.set(null);
    } else if (boardIndex === 1) {
      this.board1.selected.set(null);
    }
  }

  private startUiTicker(): void {
    this.stopUiTicker();
    this.uiTickInterval = window.setInterval(() => {
      this.nowTick.set(performance.now());
    }, 120);
  }

  private stopUiTicker(): void {
    if (this.uiTickInterval !== undefined) {
      window.clearInterval(this.uiTickInterval);
      this.uiTickInterval = undefined;
    }
  }

  private clearCombatTimers(): void {
    for (const timer of this.combatTimers) {
      window.clearTimeout(timer);
    }
    this.combatTimers = [];
  }

  /**
   * Temporary showcase for combat broadcast UI until real network events are wired.
   */
  private initCombatShowcase(): void {
    this.clearCombatTimers();
    const now = performance.now();

    this.myCombatThreat.set({
      id: 'demo-row-threat',
      pupName: 'Cryo',
      icon: '/assets/pup/icons/cryo.svg',
      defuseType: CombatDefuseType.ROW,
      targetIndex: 2,
      createdAtMs: now,
      expiresAtMs: now + 9000
    });

    this.opponentCombatThreat.set({
      id: 'demo-box-threat',
      pupName: 'Lock',
      icon: '/assets/pup/icons/lock.svg',
      defuseType: CombatDefuseType.BOX,
      targetIndex: 4,
      createdAtMs: now,
      expiresAtMs: now + 9000
    });

    this.combatTimers.push(window.setTimeout(() => {
      this.pushOutcome(true, 'REFLECTED!', 'reflected');
    }, 5200));

    this.combatTimers.push(window.setTimeout(() => {
      this.pushOutcome(false, 'HIT!', 'hit');
    }, 7200));

    this.combatTimers.push(window.setTimeout(() => {
      this.myCombatThreat.set(null);
      this.opponentCombatThreat.set(null);
    }, 9200));
  }

  private pushOutcome(isMe: boolean, text: string, tone: CombatOutcomeText['tone']): void {
    const now = performance.now();
    const message: CombatOutcomeText = {
      id: `${text}-${now}`,
      text,
      tone,
      createdAtMs: now,
      expiresAtMs: now + 1200
    };

    if (isMe) {
      this.myCombatMessages.update(prev => [...prev, message]);
    } else {
      this.opponentCombatMessages.update(prev => [...prev, message]);
    }
  }
}
